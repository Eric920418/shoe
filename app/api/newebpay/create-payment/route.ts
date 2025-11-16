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
  createPaymentFormData,
  generateMerchantOrderNo,
  NEWEBPAY_CONFIG,
  type NewebPaymentType,
} from '@/lib/newebpay';

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

    // 產生商店訂單編號（使用訂單號碼）
    const merchantOrderNo = existingPayment?.merchantOrderNo || order.orderNumber;

    // 準備商品描述
    const description =
      itemDesc ||
      (order.items.length > 0
        ? `${order.items[0].productName} 等 ${order.items.length} 件商品`
        : '商品購買');

    // 取得用戶 Email（訪客訂單使用訪客 email）
    const email = order.user?.email || order.guestEmail || 'guest@example.com';

    // 產生支付表單資料
    const paymentFormData = createPaymentFormData({
      merchantOrderNo,
      amount: Number(order.total),
      itemDesc: description,
      email,
      paymentTypes,
      tradeLimit: 900, // 15 分鐘交易限制
    });

    // 詳細日誌
    console.log('=== 藍新金流支付請求 ===');
    console.log('訂單號:', merchantOrderNo);
    console.log('金額:', Number(order.total));
    console.log('Email:', email);
    console.log('支付方式:', paymentTypes);
    console.log('TradeInfo (前100字):', paymentFormData.TradeInfo.substring(0, 100));
    console.log('TradeSha:', paymentFormData.TradeSha);

    // 建立或更新 Payment 記錄
    const payment = existingPayment
      ? await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            paymentType: paymentTypes[0], // 儲存第一個支付方式（用戶實際選擇後會更新）
            tradeInfo: paymentFormData.TradeInfo,
            tradeSha: paymentFormData.TradeSha,
            status: 'PENDING',
            updatedAt: new Date(),
          },
        })
      : await prisma.payment.create({
          data: {
            orderId,
            merchantOrderNo,
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
