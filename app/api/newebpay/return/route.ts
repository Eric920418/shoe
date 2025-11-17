/**
 * 藍新金流 - 用戶返回頁面 API
 *
 * POST /api/newebpay/return
 *
 * 功能：
 * 1. 接收用戶從藍新金流頁面返回的資料
 * 2. 解密並驗證回傳資料
 * 3. 重定向到訂單結果頁面
 *
 * 注意：
 * - 這個端點會在用戶完成支付或取消支付後被藍新金流重定向
 * - 需要解析並驗證資料，然後導向適當的結果頁面
 */

import { NextRequest, NextResponse } from 'next/server';
import { decryptTradeInfo } from '@/lib/newebpay';
import { prisma } from '@/lib/prisma';

// 取得正確的網站 URL
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://xn--cjzl80byf571b.tw';

// ============================================
// Route Config - 允許處理大型請求體
// ============================================
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================
// POST /api/newebpay/return
// ============================================

export async function POST(request: NextRequest) {
  console.log('=== 藍新金流返回請求開始 ===');
  console.log('請求方法:', request.method);
  console.log('Content-Type:', request.headers.get('content-type'));
  console.log('User-Agent:', request.headers.get('user-agent'));

  try {
    let status: string | null = null;
    let tradeInfo: string | null = null;
    let tradeSha: string | null = null;

    // 嘗試多種方式解析藍新金流的資料
    const contentType = request.headers.get('content-type') || '';

    console.log('開始解析請求資料...');

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
      // 方法 3: 嘗試從 request clone 讀取
      const clonedRequest = request.clone();
      const bodyText = await clonedRequest.text();
      console.log('原始請求體 (前200字):', bodyText.substring(0, 200));

      const params = new URLSearchParams(bodyText);
      status = params.get('Status');
      tradeInfo = params.get('TradeInfo');
      tradeSha = params.get('TradeSha');
      console.log('使用備用方法解析');
    }

    console.log('=== 解析後的藍新金流返回資料 ===');
    console.log('Status:', status);
    console.log('TradeInfo (前100字):', tradeInfo ? tradeInfo.substring(0, 100) : 'null');
    console.log('TradeSha (前50字):', tradeSha ? tradeSha.substring(0, 50) : 'null');

    // 驗證必要參數
    if (!status || !tradeInfo || !tradeSha) {
      console.error('返回資料缺少必要參數');
      return NextResponse.redirect(
        new URL('/payment/error?message=資料不完整', SITE_URL)
      );
    }

    // 解密並驗證資料
    let decryptedData;
    try {
      decryptedData = decryptTradeInfo(tradeInfo, tradeSha);
    } catch (error) {
      console.error('返回資料驗證失敗:', error);
      return NextResponse.redirect(
        new URL(
          `/payment/error?message=${encodeURIComponent('資料驗證失敗')}`,
          SITE_URL
        )
      );
    }

    const { Status, Message, Result } = decryptedData;

    // 查找對應的訂單
    const payment = await prisma.payment.findUnique({
      where: { merchantOrderNo: Result.MerchantOrderNo },
      include: { order: true },
    });

    if (!payment) {
      console.error(`找不到支付記錄: ${Result.MerchantOrderNo}`);
      return NextResponse.redirect(
        new URL('/payment/error?message=找不到訂單', SITE_URL)
      );
    }

    // 根據支付狀態重定向
    if (Status === 'SUCCESS') {
      // 支付成功
      console.log(`訂單 ${payment.order.orderNumber} 支付成功（用戶返回）`);

      // ATM/超商代碼需要顯示繳費資訊
      const paymentType = Result.PaymentType || payment.paymentType;
      if (paymentType === 'VACC' || paymentType === 'CVS' || paymentType === 'BARCODE') {
        // 等待繳費的支付方式
        return NextResponse.redirect(
          new URL(
            `/payment/pending?orderId=${payment.order.id}&paymentType=${paymentType}`,
            SITE_URL
          )
        );
      }

      // 信用卡等即時支付成功
      return NextResponse.redirect(
        new URL(`/payment/success?orderId=${payment.order.id}`, SITE_URL)
      );
    } else {
      // 支付失敗或取消
      console.log(`訂單 ${payment.order.orderNumber} 支付失敗: ${Message}`);
      return NextResponse.redirect(
        new URL(
          `/payment/failed?orderId=${payment.order.id}&message=${encodeURIComponent(Message)}`,
          SITE_URL
        )
      );
    }
  } catch (error) {
    console.error('處理用戶返回失敗:', error);
    return NextResponse.redirect(
      new URL(
        `/payment/error?message=${encodeURIComponent('系統錯誤，請聯繫客服')}`,
        SITE_URL
      )
    );
  }
}

// ============================================
// GET /api/newebpay/return (處理 GET 請求)
// ============================================

export async function GET(request: NextRequest) {
  // 某些情況下藍新金流可能使用 GET 方式返回
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('Status');
  const tradeInfo = searchParams.get('TradeInfo');
  const tradeSha = searchParams.get('TradeSha');

  console.log('用戶從藍新金流返回 (GET):', { status });

  if (!status || !tradeInfo || !tradeSha) {
    return NextResponse.redirect(
      new URL('/payment/error?message=資料不完整', SITE_URL)
    );
  }

  // 解密並驗證資料
  try {
    const decryptedData = decryptTradeInfo(tradeInfo, tradeSha);
    const { Status, Message, Result } = decryptedData;

    const payment = await prisma.payment.findUnique({
      where: { merchantOrderNo: Result.MerchantOrderNo },
      include: { order: true },
    });

    if (!payment) {
      return NextResponse.redirect(
        new URL('/payment/error?message=找不到訂單', SITE_URL)
      );
    }

    if (Status === 'SUCCESS') {
      const paymentType = Result.PaymentType || payment.paymentType;
      if (paymentType === 'VACC' || paymentType === 'CVS' || paymentType === 'BARCODE') {
        return NextResponse.redirect(
          new URL(
            `/payment/pending?orderId=${payment.order.id}&paymentType=${paymentType}`,
            SITE_URL
          )
        );
      }
      return NextResponse.redirect(
        new URL(`/payment/success?orderId=${payment.order.id}`, SITE_URL)
      );
    } else {
      return NextResponse.redirect(
        new URL(
          `/payment/failed?orderId=${payment.order.id}&message=${encodeURIComponent(Message)}`,
          SITE_URL
        )
      );
    }
  } catch (error) {
    console.error('處理 GET 返回失敗:', error);
    return NextResponse.redirect(
      new URL('/payment/error?message=系統錯誤', SITE_URL)
    );
  }
}
