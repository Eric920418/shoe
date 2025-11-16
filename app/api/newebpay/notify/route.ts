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
// POST /api/newebpay/notify
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 解析表單資料（藍新金流使用 application/x-www-form-urlencoded）
    const formData = await request.formData();
    const status = formData.get('Status') as string;
    const tradeInfo = formData.get('TradeInfo') as string;
    const tradeSha = formData.get('TradeSha') as string;

    console.log('收到藍新金流通知:', { status, tradeInfo: tradeInfo?.substring(0, 50) });

    // 驗證必要參數
    if (!status || !tradeInfo || !tradeSha) {
      console.error('藍新金流通知缺少必要參數');
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    // 解密並驗證資料
    let decryptedData;
    try {
      decryptedData = decryptTradeInfo(tradeInfo, tradeSha);
    } catch (error) {
      console.error('藍新金流資料驗證失敗:', error);
      return NextResponse.json(
        { error: `資料驗證失敗：${error instanceof Error ? error.message : '未知錯誤'}` },
        { status: 400 }
      );
    }

    console.log('解密後的交易資料:', JSON.stringify(decryptedData, null, 2));

    const { Status, Message, Result } = decryptedData;

    // 檢查交易狀態
    if (Status !== 'SUCCESS') {
      console.error('交易失敗:', Message);
      // 即使失敗也要更新記錄
      await updatePaymentRecord(Result.MerchantOrderNo, 'FAILED', decryptedData, Message);
      return NextResponse.json({ success: false, message: Message });
    }

    // 更新支付記錄
    await updatePaymentRecord(Result.MerchantOrderNo, 'SUCCESS', decryptedData);

    // 返回成功（藍新金流需要 200 狀態碼）
    return NextResponse.json({ success: true, message: '支付通知處理成功' });
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
      console.error(`找不到支付記錄: ${merchantOrderNo}`);
      throw new Error(`找不到支付記錄: ${merchantOrderNo}`);
    }

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
