/**
 * 藍新金流 - 支付通知回呼 API
 *
 * POST /api/newebpay/notify
 *
 * 功能：
 * 1. 接收藍新金流的支付通知（NotifyURL）
 * 2. 驗證並解密回傳資料
 * 3. 更新訂單和支付狀態
 * 4. 發送訂單確認通知（Email/LINE）
 *
 * 注意：
 * - 這個端點會被藍新金流伺服器呼叫
 * - 必須返回 200 狀態碼，否則藍新金流會重複發送通知
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decryptTradeInfo } from '@/lib/newebpay';

// ============================================
// Route Config - 允許處理大型請求體
// ============================================
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================
// POST /api/newebpay/notify
// ============================================

export async function POST(request: NextRequest) {
  console.log('=== 藍新金流通知請求開始 ===');
  console.log('請求方法:', request.method);
  console.log('Content-Type:', request.headers.get('content-type'));
  console.log('來源 IP:', request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown');

  try {
    let status: string | null = null;
    let tradeInfo: string | null = null;
    let tradeSha: string | null = null;

    // 嘗試多種方式解析藍新金流的資料
    const contentType = request.headers.get('content-type') || '';

    console.log('開始解析通知資料...');

    if (contentType.includes('application/x-www-form-urlencoded')) {
      // 方法 1: 使用 formData()
      try {
        const formData = await request.formData();
        status = formData.get('Status') as string;
        tradeInfo = formData.get('TradeInfo') as string;
        tradeSha = formData.get('TradeSha') as string;
        console.log('使用 formData() 解析成功');
      } catch (error) {
        console.error('formData() 解析失敗:', error);
        // 方法 2: 使用 text() 然後手動解析
        const bodyText = await request.text();
        console.log('原始請求體 (前200字):', bodyText.substring(0, 200));

        const params = new URLSearchParams(bodyText);
        status = params.get('Status');
        tradeInfo = params.get('TradeInfo');
        tradeSha = params.get('TradeSha');
        console.log('使用 URLSearchParams 解析成功');
      }
    } else {
      // 方法 3: 備用解析方法
      const clonedRequest = request.clone();
      const bodyText = await clonedRequest.text();
      console.log('原始請求體 (前200字):', bodyText.substring(0, 200));

      const params = new URLSearchParams(bodyText);
      status = params.get('Status');
      tradeInfo = params.get('TradeInfo');
      tradeSha = params.get('TradeSha');
      console.log('使用備用方法解析');
    }

    console.log('=== 解析後的藍新金流通知資料 ===');
    console.log('Status:', status);
    console.log('TradeInfo 長度:', tradeInfo?.length || 0);

    // ⚠️ 重要：根據藍新金流官方文件，NotifyURL 必須始終回傳 HTTP 200
    // 否則藍新會持續重發通知

    // 驗證必要參數
    if (!status || !tradeInfo || !tradeSha) {
      console.error('❌ 藍新金流通知缺少必要參數');
      // 即使缺參數也要回 200 避免重送
      return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 200 });
    }

    // 解密並驗證資料
    let decryptedData;
    try {
      decryptedData = decryptTradeInfo(tradeInfo, tradeSha);
    } catch (error) {
      console.error('❌ 藍新金流資料驗證失敗:', error instanceof Error ? error.message : '未知錯誤');
      // TradeSha 驗證失敗，拒絕處理並記錄（可能是偽造通知）
      // 但仍回 200 避免重送
      return NextResponse.json(
        { success: false, error: '資料驗證失敗' },
        { status: 200 }
      );
    }

    const { Status, Message, Result } = decryptedData;

    // ⚠️ 驗證關鍵欄位（防止偽造通知）
    if (!Result || !Result.MerchantID || !Result.MerchantOrderNo || !Result.Amt) {
      console.error('❌ 缺少關鍵欄位:', {
        hasMerchantID: !!Result?.MerchantID,
        hasMerchantOrderNo: !!Result?.MerchantOrderNo,
        hasAmt: !!Result?.Amt
      });
      return NextResponse.json({ success: false, error: '缺少關鍵欄位' }, { status: 200 });
    }

    // 驗證 MerchantID 是否正確
    const expectedMerchantID = process.env.NEWEBPAY_MERCHANT_ID;
    if (Result.MerchantID !== expectedMerchantID) {
      console.error('❌ MerchantID 不符:', {
        expected: expectedMerchantID,
        received: Result.MerchantID
      });
      return NextResponse.json({ success: false, error: 'MerchantID 不符' }, { status: 200 });
    }

    console.log('✅ 關鍵欄位驗證通過');
    console.log('交易狀態:', Status);
    console.log('訂單編號:', Result.MerchantOrderNo);
    console.log('交易金額:', Result.Amt);

    // 檢查交易狀態
    if (Status !== 'SUCCESS') {
      console.error('⚠️  交易失敗:', Message);
      // 即使失敗也要更新記錄
      await updatePaymentRecord(Result.MerchantOrderNo, 'FAILED', decryptedData, Message);
      return NextResponse.json({ success: false, message: Message }, { status: 200 });
    }

    // 更新支付記錄
    await updatePaymentRecord(Result.MerchantOrderNo, 'SUCCESS', decryptedData);

    // 返回成功（藍新金流需要 200 狀態碼）
    return NextResponse.json({ success: true, message: '支付通知處理成功' }, { status: 200 });
  } catch (error) {
    console.error('處理支付通知失敗:', error);
    // 即使發生錯誤也返回 200，避免藍新金流重複發送
    return NextResponse.json(
      {
        success: false,
        error: `處理支付通知失敗：${error instanceof Error ? error.message : '未知錯誤'}`,
      },
      { status: 200 }
    );
  }
}

// ============================================
// 更新支付記錄
// ============================================

async function updatePaymentRecord(
  merchantOrderNo: string,
  status: 'SUCCESS' | 'FAILED',
  decryptedData: any,
  errorMessage?: string
) {
  try {
    const { Result } = decryptedData;

    // 查找支付記錄
    const payment = await prisma.payment.findUnique({
      where: { merchantOrderNo },
      include: { order: true },
    });

    if (!payment) {
      console.error(`❌ 找不到支付記錄: ${merchantOrderNo}`);
      throw new Error(`找不到支付記錄: ${merchantOrderNo}`);
    }

    // ⚠️ 驗證金額是否與資料庫一致（防止偽造通知）
    // 重要：直接比對整數金額，不使用 Math.floor 避免「少收錢」問題
    const expectedAmount = Number(payment.amount);
    const receivedAmount = Number(Result.Amt);

    // 確保資料庫金額是整數（應在建立 Payment 時就保證）
    if (!Number.isInteger(expectedAmount)) {
      console.error('❌ 資料庫金額不是整數:', {
        paymentAmount: payment.amount,
        expectedAmount,
        orderNo: merchantOrderNo
      });
      throw new Error(`資料庫金額異常：${payment.amount} 不是整數`);
    }

    // 比對金額（必須完全相符）
    if (expectedAmount !== receivedAmount) {
      console.error('❌ 金額不符:', {
        expected: expectedAmount,
        received: receivedAmount,
        orderNo: merchantOrderNo
      });
      throw new Error(`金額不符：預期 ${expectedAmount}，實際收到 ${receivedAmount}`);
    }

    console.log('✅ 金額驗證通過:', expectedAmount);

    // 準備更新資料
    const updateData: any = {
      status,
      tradeNo: Result.TradeNo,
      responseData: decryptedData,
      updatedAt: new Date(),
    };

    if (status === 'SUCCESS') {
      updateData.payTime = Result.PayTime ? new Date(Result.PayTime) : new Date();

      // 根據支付方式儲存額外資訊
      const paymentType = Result.PaymentType || payment.paymentType;

      if (paymentType === 'VACC') {
        // ATM 轉帳
        updateData.atmBankCode = Result.BankCode;
        updateData.atmVirtualAccount = Result.CodeNo;
        if (Result.ExpireDate) {
          updateData.atmExpireDate = new Date(Result.ExpireDate);
        }
      } else if (paymentType === 'CVS' || paymentType === 'BARCODE') {
        // 超商代碼/條碼
        updateData.cvsBankCode = Result.StoreCode;
        updateData.cvsPaymentNo = Result.CodeNo;
        if (Result.ExpireDate) {
          updateData.cvsExpireDate = new Date(Result.ExpireDate);
        }
      } else if (paymentType === 'CREDIT' || paymentType === 'CREDIT_CARD') {
        // 信用卡
        updateData.card4No = Result.Card4No;
        updateData.card6No = Result.Card6No;
        updateData.authBank = Result.AuthBank;
        updateData.respondCode = Result.RespondCode;
      }
    } else {
      // 失敗狀態
      updateData.errorMessage = errorMessage || decryptedData.Message;
    }

    // 更新支付記錄
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: updateData,
    });

    // 更新訂單狀態
    if (status === 'SUCCESS') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'PAID',
          paidAt: updateData.payTime,
          status: 'CONFIRMED', // 付款成功後自動確認訂單
        },
      });

      console.log(`訂單 ${payment.order.orderNumber} 支付成功`);

      // TODO: 發送訂單確認通知（Email/LINE）
      // await sendOrderConfirmationEmail(payment.order);
    } else {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'FAILED',
        },
      });

      console.log(`訂單 ${payment.order.orderNumber} 支付失敗: ${errorMessage}`);
    }

    return updatedPayment;
  } catch (error) {
    console.error('更新支付記錄失敗:', error);
    throw error;
  }
}
