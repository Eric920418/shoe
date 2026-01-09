/**
 * 藍新金流 - CustomerURL 端點
 *
 * POST /api/newebpay/customer
 *
 * 功能：
 * 1. 接收 CVSCOM（超商取貨付款）門市選擇的回調
 * 2. 解密並驗證回傳資料
 * 3. 儲存門市資訊到訂單
 * 4. 重定向到訂單確認頁面
 *
 * 注意：
 * - 這個端點在用戶選擇超商門市後被藍新金流調用
 * - 不同於 NotifyURL（消費者實際付款後才觸發）
 * - 不同於 ReturnURL（一般金流付款完成後觸發）
 */

import { NextRequest, NextResponse } from 'next/server';
import { decryptAndVerifyTradeInfo } from '@/lib/newebpay-correct';
import { decryptLogisticsData } from '@/lib/logistics';
import { prisma } from '@/lib/prisma';

// 取得正確的網站 URL
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://xn--cjzl80byf571b.tw';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================
// POST /api/newebpay/customer
// ============================================

export async function POST(request: NextRequest) {
  console.log('🏪🏪🏪 藍新金流 CustomerURL POST 請求收到！🏪🏪🏪');
  console.log('時間戳:', new Date().toISOString());

  try {
    const formData = await request.formData();
    const status = formData.get('Status') as string;
    const tradeInfo = formData.get('TradeInfo') as string;
    const tradeSha = formData.get('TradeSha') as string;

    console.log('=== CustomerURL 接收資料 ===');
    console.log('Status:', status);
    console.log('TradeInfo (前50字):', tradeInfo?.substring(0, 50));
    console.log('TradeSha (前30字):', tradeSha?.substring(0, 30));

    if (!status || !tradeInfo || !tradeSha) {
      console.error('❌ CustomerURL 缺少必要參數');
      return NextResponse.redirect(
        new URL('/payment/error?message=門市選擇資料不完整', SITE_URL)
      );
    }

    // 解密並驗證資料 - 嘗試多種方式
    let decryptedData;

    // 方法 1: 嘗試用金流密鑰解密
    try {
      console.log('🔐 嘗試方法 1: 金流密鑰解密');
      decryptedData = decryptAndVerifyTradeInfo(tradeInfo, tradeSha);
      console.log('✅ 金流密鑰解密成功');
    } catch (error1) {
      console.log('❌ 金流密鑰解密失敗，嘗試物流密鑰...');

      // 方法 2: 嘗試用物流密鑰解密
      try {
        console.log('🔐 嘗試方法 2: 物流密鑰解密');
        const logisticsResult = decryptLogisticsData(tradeInfo);
        console.log('✅ 物流密鑰解密成功:', JSON.stringify(logisticsResult, null, 2));
        decryptedData = {
          Status: status,
          Message: 'SUCCESS',
          Result: logisticsResult
        };
      } catch (error2) {
        console.error('❌ 物流密鑰解密也失敗:', error2);

        // 方法 3: 嘗試直接解析 formData 中的欄位
        console.log('🔍 嘗試方法 3: 從 formData 直接讀取門市資訊...');
        const allFormData: Record<string, string> = {};
        formData.forEach((value, key) => {
          allFormData[key] = value as string;
        });
        console.log('📋 所有 formData 欄位:', JSON.stringify(allFormData, null, 2));

        // 如果有 MerchantOrderNo，嘗試直接使用明文資料
        const merchantOrderNo = formData.get('MerchantOrderNo') as string;
        const storeCode = formData.get('StoreCode') as string;
        const storeName = formData.get('StoreName') as string;
        const storeAddr = formData.get('StoreAddr') as string;

        if (merchantOrderNo && (storeCode || storeName)) {
          console.log('✅ 偵測到明文門市資訊，直接使用');
          decryptedData = {
            Status: status,
            Message: 'SUCCESS',
            Result: {
              MerchantOrderNo: merchantOrderNo,
              StoreCode: storeCode,
              StoreName: storeName,
              StoreAddr: storeAddr,
              StoreType: formData.get('StoreType') as string,
              CVSCOMName: formData.get('CVSCOMName') as string,
              CVSCOMPhone: formData.get('CVSCOMPhone') as string,
            }
          };
        } else {
          return NextResponse.redirect(
            new URL('/payment/error?message=門市選擇資料驗證失敗', SITE_URL)
          );
        }
      }
    }

    const { Status, Message, Result } = decryptedData;

    console.log('=== CustomerURL 解密後資料 ===');
    console.log('Status:', Status);
    console.log('Message:', Message);
    console.log('MerchantOrderNo:', Result?.MerchantOrderNo);
    console.log('StoreCode:', Result?.StoreCode);
    console.log('StoreName:', Result?.StoreName);
    console.log('StoreAddr:', Result?.StoreAddr);
    console.log('StoreType:', Result?.StoreType);
    console.log('CVSCOMName:', Result?.CVSCOMName);
    console.log('CVSCOMPhone:', Result?.CVSCOMPhone);
    console.log('TradeType:', Result?.TradeType);
    console.log('完整 Result:', JSON.stringify(Result, null, 2));

    // 查找對應的支付記錄
    const payment = await prisma.payment.findUnique({
      where: { merchantOrderNo: Result.MerchantOrderNo },
      include: { order: true },
    });

    if (!payment) {
      console.error('❌ 找不到支付記錄:', Result.MerchantOrderNo);
      return NextResponse.redirect(
        new URL('/payment/error?message=找不到訂單', SITE_URL)
      );
    }

    // 儲存門市資訊到訂單
    if (Status === 'SUCCESS') {
      console.log('✅ 門市選擇成功，儲存門市資訊');

      await prisma.order.update({
        where: { id: payment.order.id },
        data: {
          // 儲存門市資訊
          shippingCity: Result.StoreName || payment.order.shippingCity,
          shippingStreet: Result.StoreAddr || payment.order.shippingStreet,
          shippingZipCode: Result.StoreCode || payment.order.shippingZipCode,
          // 更新訂單狀態為「已確認」（等待用戶取貨付款）
          status: 'CONFIRMED',
          paymentStatus: 'PENDING', // 貨到付款，尚未付款
        },
      });

      console.log('✅ 門市資訊已儲存到訂單:', payment.order.id);

      // 重定向到成功頁面
      return NextResponse.redirect(
        new URL(`/payment/success?orderId=${payment.order.id}&type=cod`, SITE_URL)
      );
    } else {
      console.log('❌ 門市選擇失敗:', Message);
      return NextResponse.redirect(
        new URL(
          `/payment/failed?orderId=${payment.order.id}&message=${encodeURIComponent(Message)}`,
          SITE_URL
        )
      );
    }
  } catch (error) {
    console.error('❌ CustomerURL 處理失敗:', error);
    return NextResponse.redirect(
      new URL('/payment/error?message=處理門市選擇時發生錯誤', SITE_URL)
    );
  }
}

// ============================================
// GET /api/newebpay/customer (健康檢查)
// ============================================

export async function GET() {
  console.log('🏪 CustomerURL GET 健康檢查');
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/newebpay/customer',
    timestamp: new Date().toISOString(),
    message: '藍新金流 CustomerURL 端點正常運作（用於接收 CVSCOM 門市選擇）',
  });
}
