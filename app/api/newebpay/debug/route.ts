/**
 * 藍新金流 - 診斷端點
 *
 * GET /api/newebpay/debug
 *
 * 功能：
 * 1. 顯示當前藍新金流配置（不含敏感資訊）
 * 2. 幫助排查回調問題
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // 🔒 只顯示 URL 的前綴，避免暴露完整網址結構
  const maskUrl = (url: string | undefined) => {
    if (!url) return '❌ 未設定';
    try {
      const parsed = new URL(url);
      return `✅ ${parsed.origin}/...${url.slice(-20)}`;
    } catch {
      return `⚠️ 無效 URL: ${url.substring(0, 30)}...`;
    }
  };

  const config = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,

    // 藍新金流配置檢查
    newebpay: {
      merchantId: process.env.NEWEBPAY_MERCHANT_ID
        ? `✅ 已設定 (${process.env.NEWEBPAY_MERCHANT_ID.substring(0, 4)}...)`
        : '❌ 未設定',
      hashKey: process.env.NEWEBPAY_HASH_KEY
        ? `✅ 已設定 (${process.env.NEWEBPAY_HASH_KEY.length} 字元)`
        : '❌ 未設定',
      hashIV: process.env.NEWEBPAY_HASH_IV
        ? `✅ 已設定 (${process.env.NEWEBPAY_HASH_IV.length} 字元)`
        : '❌ 未設定',
      mpgUrl: maskUrl(process.env.NEWEBPAY_MPG_URL),
      notifyUrl: maskUrl(process.env.NEWEBPAY_NOTIFY_URL),
      returnUrl: maskUrl(process.env.NEWEBPAY_RETURN_URL),
      clientBackUrl: maskUrl(process.env.NEWEBPAY_CLIENT_BACK_URL),
    },

    // 網站 URL 配置
    siteUrl: maskUrl(process.env.NEXT_PUBLIC_SITE_URL),

    // 回調端點狀態
    endpoints: {
      return: '/api/newebpay/return - 用戶返回端點',
      notify: '/api/newebpay/notify - 背景通知端點',
    },

    // 診斷建議
    suggestions: [
      '1. 確認 NEWEBPAY_RETURN_URL 設置為完整的 HTTPS URL',
      '2. 確認藍新金流測試環境可以訪問您的網站',
      '3. 使用瀏覽器直接訪問 /api/newebpay/return 確認端點可達',
      '4. 檢查 Vercel 日誌中是否有相關錯誤',
    ],
  };

  console.log('📊 藍新金流診斷請求:', JSON.stringify(config, null, 2));

  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
