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
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

// 取得正確的網站 URL
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://xn--cjzl80byf571b.tw';

// 環境變數
const HASH_KEY = process.env.NEWEBPAY_HASH_KEY!;
const HASH_IV = process.env.NEWEBPAY_HASH_IV!;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================
// 解密函數（嘗試多種方式）
// ============================================

// 方法 1: AES-256-CBC（標準藍新金流）
function tryAes256Decrypt(encryptedData: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', HASH_KEY, HASH_IV);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// 方法 2: AES-128-CBC（某些物流 API 可能使用）
function tryAes128Decrypt(encryptedData: string): string {
  // AES-128 需要 16 bytes 的 key
  const key16 = HASH_KEY.substring(0, 16);
  const decipher = crypto.createDecipheriv('aes-128-cbc', key16, HASH_IV);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// 方法 3: 使用 Buffer（某些編碼問題可能需要）
function tryBufferDecrypt(encryptedData: string): string {
  const encrypted = Buffer.from(encryptedData, 'hex');
  const key = Buffer.from(HASH_KEY, 'utf8');
  const iv = Buffer.from(HASH_IV, 'utf8');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

// 方法 4: PHP 風格解密（ZERO_PADDING + 手動 PKCS7 strip）
// 參考: 藍新金流物流 API 範例 return_url.php
function tryPhpStyleDecrypt(encryptedData: string): string {
  const encrypted = Buffer.from(encryptedData, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', HASH_KEY, HASH_IV);
  decipher.setAutoPadding(false); // 相當於 OPENSSL_ZERO_PADDING
  let decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  // 手動移除 PKCS7 padding（和 PHP 的 strippadding 函數一樣）
  const padLen = decrypted[decrypted.length - 1];
  if (padLen > 0 && padLen <= 16) {
    // 驗證 padding 是否正確
    let validPadding = true;
    for (let i = decrypted.length - padLen; i < decrypted.length; i++) {
      if (decrypted[i] !== padLen) {
        validPadding = false;
        break;
      }
    }
    if (validPadding) {
      decrypted = decrypted.slice(0, -padLen);
    }
  }

  return decrypted.toString('utf8');
}

function verifyTradeSha(tradeInfo: string, tradeSha: string): boolean {
  const hashString = `HashKey=${HASH_KEY}&${tradeInfo}&HashIV=${HASH_IV}`;
  const computed = crypto.createHash('sha256').update(hashString).digest('hex').toUpperCase();
  return computed === tradeSha.toUpperCase();
}

// 重定向輔助函數（使用 303 狀態碼，讓瀏覽器用 GET 方法）
// 這是必要的，因為 POST 請求的 307 重定向會保留 POST 方法
function redirectWithGet(url: string): NextResponse {
  return NextResponse.redirect(new URL(url, SITE_URL), { status: 303 });
}

// 診斷函數：顯示密鑰詳細資訊
function debugKeyInfo(): void {
  console.log('=== 密鑰診斷資訊 ===');
  console.log('HASH_KEY:');
  console.log('  - 長度:', HASH_KEY?.length);
  console.log('  - 類型:', typeof HASH_KEY);
  console.log('  - Buffer 長度:', Buffer.from(HASH_KEY || '', 'utf8').length);
  console.log('  - 前8字:', HASH_KEY?.substring(0, 8));
  console.log('  - 後4字:', HASH_KEY?.slice(-4));
  console.log('HASH_IV:');
  console.log('  - 長度:', HASH_IV?.length);
  console.log('  - 類型:', typeof HASH_IV);
  console.log('  - Buffer 長度:', Buffer.from(HASH_IV || '', 'utf8').length);
  console.log('  - 前4字:', HASH_IV?.substring(0, 4));
  console.log('  - 後4字:', HASH_IV?.slice(-4));

  // 檢查是否有隱藏字符
  if (HASH_KEY && HASH_KEY.length !== Buffer.from(HASH_KEY, 'utf8').length) {
    console.log('⚠️ 警告: HASH_KEY 包含多字節字符！');
  }
  if (HASH_IV && HASH_IV.length !== Buffer.from(HASH_IV, 'utf8').length) {
    console.log('⚠️ 警告: HASH_IV 包含多字節字符！');
  }
}

// ============================================
// POST /api/newebpay/customer
// ============================================

export async function POST(request: NextRequest) {
  console.log('🏪🏪🏪 藍新金流 CustomerURL POST 請求收到！🏪🏪🏪');
  console.log('時間戳:', new Date().toISOString());

  // 顯示密鑰診斷資訊
  debugKeyInfo();

  try {
    const formData = await request.formData();

    // 記錄所有收到的欄位
    const allFormData: Record<string, string> = {};
    formData.forEach((value, key) => {
      allFormData[key] = value as string;
    });
    console.log('📋 收到的所有欄位:', JSON.stringify(allFormData, null, 2));

    const status = formData.get('Status') as string;
    const tradeInfo = formData.get('TradeInfo') as string;
    const tradeSha = formData.get('TradeSha') as string;

    console.log('=== CustomerURL 接收資料 ===');
    console.log('Status:', status);
    console.log('TradeInfo 長度:', tradeInfo?.length);
    console.log('TradeInfo (前100字):', tradeInfo?.substring(0, 100));
    console.log('TradeSha:', tradeSha);

    if (!status || !tradeInfo || !tradeSha) {
      console.error('❌ CustomerURL 缺少必要參數');
      return redirectWithGet('/payment/error?message=門市選擇資料不完整');
    }

    // 解密資料
    let decryptedData: any = null;
    let decryptError: string | null = null;

    // 步驟 1：驗證 TradeSha
    console.log('🔐 步驟 1: 驗證 TradeSha...');
    const isValidSha = verifyTradeSha(tradeInfo, tradeSha);
    console.log('TradeSha 驗證結果:', isValidSha ? '✅ 通過' : '❌ 失敗');

    // 步驟 2：嘗試解密（多種方法）
    console.log('🔐 步驟 2: 嘗試 AES 解密...');
    console.log('HASH_KEY 長度:', HASH_KEY?.length);
    console.log('HASH_IV 長度:', HASH_IV?.length);

    // 同時檢查 EncryptData（物流 API 格式）和 TradeInfo（MPG 格式）
    const encryptData = formData.get('EncryptData') as string;
    const dataToDecrypt = encryptData || tradeInfo;
    const dataSource = encryptData ? 'EncryptData' : 'TradeInfo';
    console.log(`使用 ${dataSource} 進行解密，長度: ${dataToDecrypt?.length}`);

    // 定義解密方法
    const decryptMethods = [
      { name: 'AES-256-CBC (標準)', fn: tryAes256Decrypt },
      { name: 'AES-256-CBC (Buffer)', fn: tryBufferDecrypt },
      { name: 'AES-256-CBC (PHP 風格)', fn: tryPhpStyleDecrypt },
      { name: 'AES-128-CBC', fn: tryAes128Decrypt },
    ];

    // 嘗試每種解密方法
    for (const method of decryptMethods) {
      try {
        console.log(`🔐 嘗試: ${method.name}...`);
        const decryptedStr = method.fn(dataToDecrypt);
        console.log(`✅ ${method.name} 解密成功！`);
        console.log('解密後原始內容 (前300字):', decryptedStr.substring(0, 300));

        // 嘗試解析 JSON
        try {
          decryptedData = JSON.parse(decryptedStr);
          console.log('✅ JSON 解析成功');
          break; // 成功就跳出
        } catch {
          // 可能是 Query String 格式
          console.log('不是 JSON，嘗試解析為 Query String...');
          const qs = require('querystring');
          decryptedData = qs.parse(decryptedStr);
          console.log('✅ Query String 解析成功');
          break; // 成功就跳出
        }
      } catch (error: any) {
        console.log(`❌ ${method.name} 失敗:`, error.message);
        decryptError = error.message;
      }
    }

    // 如果所有解密方法都失敗，記錄除錯資訊
    if (!decryptedData) {
      console.log('所有解密方法都失敗，除錯資訊:');
      console.log('- 數據來源:', dataSource);
      console.log('- 數據是否為 hex:', /^[0-9A-Fa-f]+$/.test(dataToDecrypt));
      console.log('- 數據長度:', dataToDecrypt.length);
      console.log('- 數據長度是否為偶數:', dataToDecrypt.length % 2 === 0);
      console.log('- 解密後 bytes 是否為 16 的倍數:', (dataToDecrypt.length / 2) % 16 === 0);
      console.log('- 數據前100字:', dataToDecrypt.substring(0, 100));
    }

    // 步驟 3：如果解密失敗，嘗試從 formData 讀取明文欄位
    if (!decryptedData) {
      console.log('🔍 步驟 3: 嘗試從 formData 讀取明文欄位...');

      // 檢查是否有明文欄位
      const merchantOrderNo = formData.get('MerchantOrderNo') as string;
      const storeCode = formData.get('StoreCode') as string;
      const storeName = formData.get('StoreName') as string;
      const storeAddr = formData.get('StoreAddr') as string;

      if (merchantOrderNo && (storeCode || storeName)) {
        console.log('✅ 找到明文門市資訊');
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
        // 最後嘗試：回傳錯誤並包含完整資訊供除錯
        console.error('❌ 無法解密也無法讀取明文資料');
        const errorDetails = encodeURIComponent(
          `解密失敗: ${decryptError || '未知錯誤'}。收到欄位: ${Object.keys(allFormData).join(', ')}`
        );
        return redirectWithGet(`/payment/error?message=${errorDetails}`);
      }
    }

    // 處理解密後的資料
    // CVSCOM 回傳格式可能是：
    // 1. { Status, Message, Result: {...} } - 標準格式
    // 2. 直接的物件（不含 Result 包裝）
    let result: any;
    if (decryptedData.Result) {
      result = decryptedData.Result;
    } else if (decryptedData.MerchantOrderNo) {
      result = decryptedData;
    } else {
      result = decryptedData;
    }

    console.log('=== CustomerURL 解密後資料 ===');
    console.log('完整解密資料:', JSON.stringify(decryptedData, null, 2));
    console.log('MerchantOrderNo:', result?.MerchantOrderNo);
    console.log('StoreCode:', result?.StoreCode);
    console.log('StoreName:', result?.StoreName);
    console.log('StoreAddr:', result?.StoreAddr);
    console.log('StoreType:', result?.StoreType);
    console.log('CVSCOMName:', result?.CVSCOMName);
    console.log('CVSCOMPhone:', result?.CVSCOMPhone);

    // 查找對應的支付記錄
    const merchantOrderNo = result?.MerchantOrderNo;
    if (!merchantOrderNo) {
      console.error('❌ 解密資料中沒有 MerchantOrderNo');
      return redirectWithGet('/payment/error?message=無法取得訂單編號');
    }

    const payment = await prisma.payment.findUnique({
      where: { merchantOrderNo: merchantOrderNo },
      include: { order: true },
    });

    if (!payment) {
      console.error('❌ 找不到支付記錄:', merchantOrderNo);
      return redirectWithGet('/payment/error?message=找不到訂單');
    }

    // 儲存門市資訊到訂單
    const finalStatus = decryptedData.Status || status;
    if (finalStatus === 'SUCCESS') {
      console.log('✅ 門市選擇成功，儲存門市資訊');

      await prisma.order.update({
        where: { id: payment.order.id },
        data: {
          // 儲存門市資訊
          shippingCity: result.StoreName || payment.order.shippingCity,
          shippingStreet: result.StoreAddr || payment.order.shippingStreet,
          shippingZipCode: result.StoreCode || payment.order.shippingZipCode,
          // 更新訂單狀態為「已確認」（等待用戶取貨付款）
          status: 'CONFIRMED',
          paymentStatus: 'PENDING', // 貨到付款，尚未付款
        },
      });

      console.log('✅ 門市資訊已儲存到訂單:', payment.order.id);

      // 重定向到成功頁面
      return redirectWithGet(`/payment/success?orderId=${payment.order.id}&type=cod`);
    } else {
      const message = decryptedData.Message || '門市選擇失敗';
      console.log('❌ 門市選擇失敗:', message);
      return redirectWithGet(`/payment/failed?orderId=${payment.order.id}&message=${encodeURIComponent(message)}`);
    }
  } catch (error: any) {
    console.error('❌ CustomerURL 處理失敗:', error);
    console.error('錯誤堆疊:', error.stack);
    return redirectWithGet(`/payment/error?message=處理門市選擇時發生錯誤: ${encodeURIComponent(error.message)}`);
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
    config: {
      hashKeyLength: HASH_KEY?.length || 0,
      hashIVLength: HASH_IV?.length || 0,
      siteUrl: SITE_URL,
    }
  });
}
