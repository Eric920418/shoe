/**
 * 藍新金流 - 創建支付請求 API
 *
 * POST /api/newebpay/create-payment
 *
 * 功能：
 * 1. 接收訂單資訊
 * 2. 產生支付表單資料
 * 3. 建立 Payment 記錄
 * 4. 返回加密的支付資料給前端
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createPaymentData,
  generateMerchantOrderNo,
  NEWEBPAY_CONFIG,
  type NewebPaymentType,
} from '@/lib/newebpay-correct';

// ============================================
// 請求資料型別
// ============================================

interface CreatePaymentRequest {
  orderId: string;            // 訂單 ID
  paymentTypes: NewebPaymentType[];  // 支付方式
  itemDesc?: string;          // 商品描述（選填）
}

// ============================================
// POST /api/newebpay/create-payment
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentRequest = await request.json();
    const { orderId, paymentTypes, itemDesc } = body;

    // 驗證必要參數
    if (!orderId || !paymentTypes || paymentTypes.length === 0) {
      return NextResponse.json(
        { error: '缺少必要參數：orderId 或 paymentTypes' },
        { status: 400 }
      );
    }

    // 查詢訂單資料
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: `找不到訂單：${orderId}` },
        { status: 404 }
      );
    }

    // 檢查訂單是否已支付
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: '此訂單已完成支付' },
        { status: 400 }
      );
    }

    // 檢查是否已存在 Payment 記錄
    let existingPayment = await prisma.payment.findUnique({
      where: { orderId },
    });

    // 如果已存在且狀態為 SUCCESS，不允許重複支付
    if (existingPayment && existingPayment.status === 'SUCCESS') {
      return NextResponse.json(
        { error: '此訂單已完成支付' },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 🔥 修正重點：產生唯一的 MerchantOrderNo
    // ----------------------------------------------------------
    // 即使是同一筆 Order ID，每次發起支付請求都應該視為新的交易嘗試
    // 避免藍新鎖死第一次的參數設定 (如 LgsType)

    const timestamp = Date.now().toString();
    // 取時間戳後 4 碼，避免過長
    const randomSuffix = timestamp.substring(timestamp.length - 4);

    // 組合新的訂單編號：原單號_嘗試次數或時間
    // 例如: ORD20231121001_8821
    const merchantOrderNo = `${order.orderNumber}_${randomSuffix}`;

    console.log('💡 產生新的 MerchantOrderNo:', merchantOrderNo, '(原訂單:', order.orderNumber, ')');

    // 準備商品描述
    const description =
      itemDesc ||
      (order.items.length > 0
        ? `${order.items[0].productName} 等 ${order.items.length} 件商品`
        : '商品購買');

    // 取得用戶 Email（訪客訂單使用訪客 email）
    const email = order.user?.email || order.guestEmail || 'guest@example.com';

    // ⚠️ 驗證訂單金額必須是整數（藍新金流 MPG01016 要求）
    const orderTotal = Number(order.total);
    if (!Number.isInteger(orderTotal)) {
      console.error('訂單金額不是整數:', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        type: typeof order.total
      });
      return NextResponse.json(
        {
          error: `訂單金額必須是整數：當前為 ${order.total}。` +
                 `請檢查訂單計算邏輯，確保 subtotal、shippingFee、discount 等欄位計算後為整數。`
        },
        { status: 400 }
      );
    }

    // 產生支付表單資料（使用正確的加密函數）
    const paymentFormData = createPaymentData({
      merchantOrderNo,
      amount: orderTotal,
      itemDesc: description,
      email,
      notifyUrl: NEWEBPAY_CONFIG.notifyUrl,
      returnUrl: NEWEBPAY_CONFIG.returnUrl,
      clientBackUrl: NEWEBPAY_CONFIG.clientBackUrl,
      shippingMethod: order.shippingMethod || undefined, // 傳遞配送方式
      paymentTypes, // 🎯 新增：傳入付款方式陣列
      // ⚠️ 快篩測試：如果需要測試，取消下面這行的註解，強制使用 SELF_PICKUP
      // shippingMethod: 'SELF_PICKUP' as any,
    });

    // 日誌
    console.log('=== 第 2 層：藍新金流支付請求 ===');
    console.log('原訂單號:', order.orderNumber);
    console.log('新 MerchantOrderNo:', merchantOrderNo, '(每次都是唯一的)');
    console.log('order.shippingMethod:', order.shippingMethod, '(type:', typeof order.shippingMethod, ')');
    console.log('傳給 createPaymentData:', order.shippingMethod || undefined);
    console.log('金額: NT$', Number(order.total));
    console.log('====================================');

    // 建立或更新 Payment 記錄
    // 注意：因為 merchantOrderNo 變了，建議更新該欄位以利對帳
    const payment = existingPayment
      ? await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            paymentType: paymentTypes[0], // 儲存第一個支付方式（用戶實際選擇後會更新）
            merchantOrderNo, // 👈 更新 DB 中的訂單編號（每次都是新的）
            tradeInfo: paymentFormData.TradeInfo,
            tradeSha: paymentFormData.TradeSha,
            status: 'PENDING',
            updatedAt: new Date(),
          },
        })
      : await prisma.payment.create({
          data: {
            orderId,
            merchantOrderNo, // 👈 寫入新的編號
            amount: order.total,
            paymentType: paymentTypes[0],
            tradeInfo: paymentFormData.TradeInfo,
            tradeSha: paymentFormData.TradeSha,
            status: 'PENDING',
          },
        });

    // 更新訂單支付方式
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: 'NEWEBPAY',
        paymentStatus: 'PENDING',
      },
    });

    // 返回支付表單資料
    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        mpgUrl: NEWEBPAY_CONFIG.mpgUrl,
        formData: paymentFormData,
      },
    });
  } catch (error) {
    console.error('創建支付請求失敗:', error);
    return NextResponse.json(
      {
        error: `創建支付請求失敗：${error instanceof Error ? error.message : '未知錯誤'}`,
      },
      { status: 500 }
    );
  }
}
