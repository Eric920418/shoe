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
import { decryptAndVerifyTradeInfo } from '@/lib/newebpay-correct';
import { sendOrderConfirmationEmail, notifyPaymentSuccess } from '@/lib/notification';

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

    // 🔍 詳細診斷 TradeInfo（生產環境應移除）
    if (tradeInfo) {
      console.log('TradeInfo 診斷：');
      console.log('- 長度:', tradeInfo.length);
      console.log('- 是偶數:', tradeInfo.length % 2 === 0 ? '✅' : '❌');
      console.log('- 前100字:', tradeInfo.substring(0, 100));
      console.log('- 後100字:', tradeInfo.substring(tradeInfo.length - 100));
      console.log('- 包含 %:', tradeInfo.includes('%') ? '⚠️ 是（需要 URL decode）' : '✅ 否');
      console.log('- 包含空格:', tradeInfo.includes(' ') ? '⚠️ 是' : '✅ 否');
      console.log('- 包含 +:', tradeInfo.includes('+') ? '⚠️ 是（可能被當空格）' : '✅ 否');
      console.log('- 只含 Hex:', /^[0-9A-Fa-f]+$/.test(tradeInfo) ? '✅ 是' : '❌ 否');
      console.log('完整 TradeInfo:', tradeInfo);
      console.log('TradeSha 長度:', tradeSha?.length || 0);
      console.log('完整 TradeSha:', tradeSha);
    }

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
      decryptedData = decryptAndVerifyTradeInfo(tradeInfo, tradeSha);
    } catch (error) {
      console.error('❌ 藍新金流資料驗證失敗:', error instanceof Error ? error.message : '未知錯誤');

      // ✅ 嘗試記錄錯誤訊息
      try {
        const errorMessage = `藍新金流解密失敗：${error instanceof Error ? error.message : '未知錯誤'}`;

        // 記錄完整的錯誤資訊到日誌
        console.error('完整錯誤資訊:', {
          error: errorMessage,
          tradeInfoLength: tradeInfo?.length,
          timestamp: new Date().toISOString()
        });

        // 嘗試找到最近的待處理訂單（可能無法從加密資料中取得訂單號）
        // 這是最後手段，根據時間推斷
        const recentPayment = await prisma.payment.findFirst({
          where: {
            status: 'PENDING',
            createdAt: {
              gte: new Date(Date.now() - 30 * 60 * 1000) // 30分鐘內
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        if (recentPayment) {
          // 儲存錯誤訊息到資料庫
          await prisma.payment.update({
            where: { id: recentPayment.id },
            data: {
              errorMessage,
              errorCode: 'DECRYPT_FAILED',
              responseData: {
                rawTradeInfo: tradeInfo?.substring(0, 100), // 只儲存前100字避免太長
                error: errorMessage,
                timestamp: new Date().toISOString()
              }
            }
          });
          console.log(`已將錯誤訊息儲存到支付記錄: ${recentPayment.merchantOrderNo}`);
        }
      } catch (logError) {
        console.error('儲存錯誤訊息失敗:', logError);
      }

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

    // 🔍 記錄完整的回傳資料（用於調試）
    console.log('=== 藍新金流完整回傳資料 ===');
    console.log(JSON.stringify(Result, null, 2));
    console.log('付款人姓名 (PayerName):', Result.PayerName);
    console.log('付款人電話 (PayerPhone):', Result.PayerPhone);
    console.log('付款人 Email (PayerEmail):', Result.PayerEmail);
    console.log('超商門市代號 (StoreCode):', Result.StoreCode);
    console.log('超商門市名稱 (StoreName):', Result.StoreName);
    console.log('超商門市地址 (StoreAddr):', Result.StoreAddr);
    console.log('超商類型 (StoreType):', Result.StoreType);
    console.log('================================');

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
      // 準備訂單更新資料
      const orderUpdateData: any = {
        paymentStatus: 'PAID',
        paidAt: updateData.payTime,
        status: 'CONFIRMED', // 付款成功後自動確認訂單
      };

      // 👤 用藍新金流回傳的付款人資料更新訂單收件人資訊
      // 以藍新頁面上用戶填寫的資料為準
      if (Result.PayerName) {
        console.log('👤 更新收件人姓名:', Result.PayerName);
        orderUpdateData.shippingName = Result.PayerName;
      }
      if (Result.PayerPhone) {
        console.log('📞 更新收件人電話:', Result.PayerPhone);
        orderUpdateData.shippingPhone = Result.PayerPhone;
      }
      // 也可以更新 guest email（如果是訪客訂單）
      if (Result.PayerEmail && !payment.order.userId) {
        console.log('📧 更新訪客 Email:', Result.PayerEmail);
        orderUpdateData.guestEmail = Result.PayerEmail;
      }

      // 🏪 如果是超商取貨，儲存門市資訊
      if (Result.StoreCode || Result.StoreName || Result.StoreAddr) {
        console.log('📍 偵測到超商取貨資訊，儲存到訂單中');
        // 用現有欄位儲存超商門市資訊
        // shippingCity -> 門市名稱
        // shippingStreet -> 門市地址
        // shippingZipCode -> 門市代號
        if (Result.StoreName) orderUpdateData.shippingCity = Result.StoreName;
        if (Result.StoreAddr) orderUpdateData.shippingStreet = Result.StoreAddr;
        if (Result.StoreCode) orderUpdateData.shippingZipCode = Result.StoreCode;
      }

      await prisma.order.update({
        where: { id: payment.orderId },
        data: orderUpdateData,
      });

      console.log(`訂單 ${payment.order.orderNumber} 支付成功`);

      // 扣減 SKU 庫存
      try {
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: payment.orderId },
        });

        for (const item of orderItems) {
          if (item.skuId) {
            await prisma.productSku.update({
              where: { id: item.skuId },
              data: {
                stock: { decrement: item.quantity },
              },
            });
            console.log(`📦 扣減庫存: SKU ${item.skuId}, 數量 -${item.quantity}`);
          }
        }
        console.log(`✅ 訂單 ${payment.order.orderNumber} SKU 庫存已扣減`);
      } catch (stockError) {
        // 庫存扣減失敗不影響訂單狀態，但要記錄錯誤
        console.error('❌ 扣減 SKU 庫存失敗:', stockError);
      }

      // 發送訂單確認通知（Email/LINE）
      try {
        // 獲取完整訂單資訊
        const fullOrder = await prisma.order.findUnique({
          where: { id: payment.orderId },
          include: {
            items: {
              include: {
                product: true,
                variant: true,
              },
            },
            payment: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        });

        if (fullOrder) {
          // 準備通知資料
          const orderData = {
            orderNumber: fullOrder.orderNumber,
            total: Number(fullOrder.total),
            subtotal: Number(fullOrder.subtotal),
            shippingFee: Number(fullOrder.shippingFee),
            discount: Number(fullOrder.discount),
            shippingName: fullOrder.shippingName,
            shippingPhone: fullOrder.shippingPhone,
            shippingCity: fullOrder.shippingCity || '',
            shippingDistrict: fullOrder.shippingDistrict || '',
            shippingStreet: fullOrder.shippingStreet || '',
            shippingZipCode: fullOrder.shippingZipCode || '',
            paymentMethod: fullOrder.paymentMethod || undefined,
            paymentTypeName: fullOrder.payment?.paymentType,
            items: fullOrder.items.map(item => ({
              productName: item.productName,
              productImage: item.productImage || undefined,
              color: item.color || undefined,
              sizeEu: item.sizeEu || '',
              quantity: item.quantity,
              price: Number(item.price),
              subtotal: Number(item.subtotal),
            })),
            payment: fullOrder.payment ? {
              atmBankCode: fullOrder.payment.atmBankCode || undefined,
              atmVirtualAccount: fullOrder.payment.atmVirtualAccount || undefined,
              atmExpireDate: fullOrder.payment.atmExpireDate || undefined,
              cvsPaymentNo: fullOrder.payment.cvsPaymentNo || undefined,
              cvsExpireDate: fullOrder.payment.cvsExpireDate || undefined,
            } : undefined,
          };

          // 發送郵件通知給客戶
          const customerEmail = fullOrder.user?.email || fullOrder.guestEmail;
          if (customerEmail) {
            await sendOrderConfirmationEmail(customerEmail, orderData, true);
            console.log(`付款成功郵件已發送至: ${customerEmail}`);
          }

          // 發送 LINE 通知給商家
          await notifyPaymentSuccess(orderData);
        }
      } catch (notifyError) {
        // 通知發送失敗不影響訂單狀態
        console.error('發送付款成功通知失敗:', notifyError);
      }
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
