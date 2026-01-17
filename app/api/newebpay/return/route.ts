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
import { decryptAndVerifyTradeInfo } from '@/lib/newebpay-correct';
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
  // 🚨 最優先日誌 - 確認請求到達
  console.log('🚨🚨🚨 藍新金流 RETURN POST 請求收到！🚨🚨🚨');
  console.log('時間戳:', new Date().toISOString());
  console.log('=== 藍新金流返回請求開始 ===');
  console.log('請求方法:', request.method);
  console.log('Content-Type:', request.headers.get('content-type'));
  console.log('User-Agent:', request.headers.get('user-agent'));
  console.log('完整 URL:', request.url);
  console.log('來源 IP:', request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown');

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

        // 🏪 檢查是否為 CVSCOM 明文格式
        const cvsStoreID = formData.get('CVSStoreID') || formData.get('StoreCode');
        const cvsStoreName = formData.get('CVSStoreName') || formData.get('StoreName');
        const cvsAddress = formData.get('CVSAddress') || formData.get('StoreAddr');
        const merchantOrderNo = formData.get('MerchantOrderNo');

        console.log('🏪 formData CVSCOM 參數:', { cvsStoreID, cvsStoreName, cvsAddress, merchantOrderNo });

        if (merchantOrderNo && (cvsStoreID || cvsStoreName)) {
          console.log('📦 formData: 偵測到 CVSCOM 門市選擇返回');
          const payment = await prisma.payment.findUnique({
            where: { merchantOrderNo: merchantOrderNo as string },
            include: { order: true },
          });

          if (payment) {
            await prisma.order.update({
              where: { id: payment.order.id },
              data: {
                shippingCity: (cvsStoreName as string) || payment.order.shippingCity,
                shippingStreet: (cvsAddress as string) || payment.order.shippingStreet,
                shippingZipCode: (cvsStoreID as string) || payment.order.shippingZipCode,
                status: 'CONFIRMED',
                paymentStatus: 'PENDING',
              },
            });
            console.log('✅ CVSCOM 門市資訊已儲存 (formData)');
            return NextResponse.redirect(
              new URL(`/payment/success?orderId=${payment.order.id}&type=cod`, SITE_URL)
            );
          }
        }
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

      // 🏪 檢查是否為 CVSCOM 明文格式（超商門市選擇返回）
      const cvsStoreID = params.get('CVSStoreID') || params.get('StoreCode');
      const cvsStoreName = params.get('CVSStoreName') || params.get('StoreName');
      const cvsAddress = params.get('CVSAddress') || params.get('StoreAddr');
      const merchantOrderNo = params.get('MerchantOrderNo');

      console.log('🏪 POST CVSCOM 參數檢查:', { cvsStoreID, cvsStoreName, cvsAddress, merchantOrderNo });

      if (merchantOrderNo && (cvsStoreID || cvsStoreName)) {
        console.log('📦 POST: 偵測到 CVSCOM 門市選擇返回（明文格式）');
        const payment = await prisma.payment.findUnique({
          where: { merchantOrderNo },
          include: { order: true },
        });

        if (payment) {
          await prisma.order.update({
            where: { id: payment.order.id },
            data: {
              shippingCity: cvsStoreName || payment.order.shippingCity,
              shippingStreet: cvsAddress || payment.order.shippingStreet,
              shippingZipCode: cvsStoreID || payment.order.shippingZipCode,
              status: 'CONFIRMED',
              paymentStatus: 'PENDING',
            },
          });
          console.log('✅ CVSCOM 門市資訊已儲存');
          return NextResponse.redirect(
            new URL(`/payment/success?orderId=${payment.order.id}&type=cod`, SITE_URL)
          );
        }
      }
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
      decryptedData = decryptAndVerifyTradeInfo(tradeInfo, tradeSha);
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

    // 🔍 記錄完整的回傳資料（用於調試）
    console.log('=== 藍新金流 Return 完整回傳資料 ===');
    console.log(JSON.stringify(Result, null, 2));
    console.log('PaymentType:', Result.PaymentType);
    console.log('付款人姓名 (PayerName):', Result.PayerName);
    console.log('付款人電話 (PayerPhone):', Result.PayerPhone);
    console.log('付款人 Email (PayerEmail):', Result.PayerEmail);
    console.log('超商門市代號 (StoreCode):', Result.StoreCode);
    console.log('超商門市名稱 (StoreName):', Result.StoreName);
    console.log('超商門市地址 (StoreAddr):', Result.StoreAddr);
    console.log('超商類型 (StoreType):', Result.StoreType);
    console.log('=====================================');

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

    // 👤 如果有付款人資訊，更新到訂單中（以藍新頁面填寫的資料為準）
    const orderUpdateData: any = {};

    if (Result.PayerName) {
      console.log('👤 更新收件人姓名:', Result.PayerName);
      orderUpdateData.shippingName = Result.PayerName;
    }
    if (Result.PayerPhone) {
      console.log('📞 更新收件人電話:', Result.PayerPhone);
      orderUpdateData.shippingPhone = Result.PayerPhone;
    }
    if (Result.PayerEmail && !payment.order.userId) {
      console.log('📧 更新訪客 Email:', Result.PayerEmail);
      orderUpdateData.guestEmail = Result.PayerEmail;
    }

    // 🏪 如果有超商門市資訊，儲存到訂單中（貨到付款時會在這裡回傳）
    if (Result.StoreCode || Result.StoreName || Result.StoreAddr) {
      console.log('📍 偵測到超商門市資訊，儲存到訂單中');
      if (Result.StoreName) orderUpdateData.shippingCity = Result.StoreName;
      if (Result.StoreAddr) orderUpdateData.shippingStreet = Result.StoreAddr;
      if (Result.StoreCode) orderUpdateData.shippingZipCode = Result.StoreCode;
    }

    // 如果有需要更新的資料，執行更新
    if (Object.keys(orderUpdateData).length > 0) {
      await prisma.order.update({
        where: { id: payment.order.id },
        data: orderUpdateData,
      });
      console.log('✅ 訂單資訊已更新');
    }

    // 根據支付狀態重定向
    if (Status === 'SUCCESS') {
      // 支付成功
      console.log(`訂單 ${payment.order.orderNumber} 支付成功（用戶返回）`);

      // ATM/超商代碼需要顯示繳費資訊
      const paymentType = Result.PaymentType || payment.paymentType;

      // 🏪 超商取貨付款（貨到付款）- 用戶選擇門市後返回
      if (paymentType === 'CVSCOM') {
        console.log('📦 超商取貨付款 - 訂單待取貨');
        // 更新訂單狀態為「已確認」（等待用戶取貨付款）
        await prisma.order.update({
          where: { id: payment.order.id },
          data: {
            status: 'CONFIRMED',
            paymentStatus: 'PENDING', // 尚未付款
          },
        });
        return NextResponse.redirect(
          new URL(`/payment/success?orderId=${payment.order.id}&type=cod`, SITE_URL)
        );
      }

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
  // 🚨 最優先日誌 - 確認請求到達
  console.log('🚨🚨🚨 藍新金流 RETURN GET 請求收到！🚨🚨🚨');
  console.log('時間戳:', new Date().toISOString());
  console.log('完整 URL:', request.url);

  // 某些情況下藍新金流可能使用 GET 方式返回
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('Status');
  const tradeInfo = searchParams.get('TradeInfo');
  const tradeSha = searchParams.get('TradeSha');

  console.log('用戶從藍新金流返回 (GET):', { status });

  // 🏪 檢查是否為 CVSCOM 門市選擇返回（明文格式）
  // 藍新金流的超商取貨可能直接返回門市資訊，不使用加密格式
  const cvsStoreID = searchParams.get('CVSStoreID') || searchParams.get('StoreCode');
  const cvsStoreName = searchParams.get('CVSStoreName') || searchParams.get('StoreName');
  const cvsAddress = searchParams.get('CVSAddress') || searchParams.get('StoreAddr');
  const merchantOrderNo = searchParams.get('MerchantOrderNo');

  console.log('🏪 CVSCOM 參數檢查:', { cvsStoreID, cvsStoreName, cvsAddress, merchantOrderNo });

  // 如果有 CVSCOM 門市資訊，優先處理
  if (merchantOrderNo && (cvsStoreID || cvsStoreName)) {
    console.log('📦 偵測到 CVSCOM 門市選擇返回');
    try {
      // 查找訂單
      const payment = await prisma.payment.findUnique({
        where: { merchantOrderNo },
        include: { order: true },
      });

      if (!payment) {
        console.error('找不到支付記錄:', merchantOrderNo);
        return NextResponse.redirect(
          new URL('/payment/error?message=找不到訂單', SITE_URL)
        );
      }

      // 儲存門市資訊
      console.log('📍 儲存超商門市資訊到訂單');
      await prisma.order.update({
        where: { id: payment.order.id },
        data: {
          shippingCity: cvsStoreName || payment.order.shippingCity,
          shippingStreet: cvsAddress || payment.order.shippingStreet,
          shippingZipCode: cvsStoreID || payment.order.shippingZipCode,
          status: 'CONFIRMED',
          paymentStatus: 'PENDING', // 貨到付款
        },
      });
      console.log('✅ 門市資訊已儲存');

      return NextResponse.redirect(
        new URL(`/payment/success?orderId=${payment.order.id}&type=cod`, SITE_URL)
      );
    } catch (error) {
      console.error('處理 CVSCOM 返回失敗:', error);
      return NextResponse.redirect(
        new URL('/payment/error?message=處理門市資訊失敗', SITE_URL)
      );
    }
  }

  // 🔧 健康檢查：如果沒有任何參數，返回端點狀態
  if (!status && !tradeInfo && !tradeSha && !merchantOrderNo) {
    console.log('📍 健康檢查請求 - 無藍新金流參數');
    return NextResponse.json({
      status: 'ok',
      endpoint: '/api/newebpay/return',
      timestamp: new Date().toISOString(),
      message: '藍新金流 Return 端點正常運作',
    });
  }

  if (!status || !tradeInfo || !tradeSha) {
    console.error('❌ 缺少必要參數:', { status: !!status, tradeInfo: !!tradeInfo, tradeSha: !!tradeSha });
    // 記錄所有收到的參數，幫助調試
    console.log('📋 所有收到的參數:', Object.fromEntries(searchParams.entries()));
    return NextResponse.redirect(
      new URL('/payment/error?message=資料不完整', SITE_URL)
    );
  }

  // 解密並驗證資料
  try {
    const decryptedData = decryptAndVerifyTradeInfo(tradeInfo, tradeSha);
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
