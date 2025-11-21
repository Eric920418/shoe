/**
 * 藍新金流（NewebPay）正確實作 - 完全符合官方文件規範
 *
 * 根據官方手冊 NDNF-1.1.9：
 * - TradeInfo 是十六進制字串（不是 Base64）
 * - 使用 AES-256-CBC + PKCS7
 * - HashKey/HashIV 直接使用 UTF-8 編碼
 */

import crypto from 'crypto';
import qs from 'querystring';

// ============================================
// 環境變數配置
// ============================================
const HASH_KEY = process.env.NEWEBPAY_HASH_KEY!;
const HASH_IV = process.env.NEWEBPAY_HASH_IV!;
const MERCHANT_ID = process.env.NEWEBPAY_MERCHANT_ID!;

export const NEWEBPAY_CONFIG = {
  merchantId: process.env.NEWEBPAY_MERCHANT_ID!,
  hashKey: process.env.NEWEBPAY_HASH_KEY!,
  hashIV: process.env.NEWEBPAY_HASH_IV!,
  mpgUrl: process.env.NEWEBPAY_MPG_URL!,
  queryUrl: process.env.NEWEBPAY_QUERY_URL!,
  notifyUrl: process.env.NEWEBPAY_NOTIFY_URL!,
  returnUrl: process.env.NEWEBPAY_RETURN_URL!,
  clientBackUrl: process.env.NEWEBPAY_CLIENT_BACK_URL!,
};

// 驗證必要的環境變數
if (!HASH_KEY || !HASH_IV || !MERCHANT_ID) {
  throw new Error('藍新金流環境變數未設定：請檢查 NEWEBPAY_MERCHANT_ID, NEWEBPAY_HASH_KEY, NEWEBPAY_HASH_IV');
}

// ============================================
// 類型定義
// ============================================
export type NewebPaymentType = 'CREDIT_CARD' | 'VACC' | 'CVS' | 'BARCODE' | 'WEBATM';

// ============================================
// 核心加解密函數
// ============================================

/**
 * 1) 驗證 TradeSha
 * 根據官方文件：SHA256(HashKey=xxx&TradeInfo&HashIV=xxx)
 */
export function verifyTradeSha(tradeInfo: string, tradeSha: string): boolean {
  const plain = `HashKey=${HASH_KEY}&${tradeInfo}&HashIV=${HASH_IV}`;
  const sha = crypto
    .createHash('sha256')
    .update(plain)
    .digest('hex')
    .toUpperCase();

  const isValid = sha === tradeSha.toUpperCase();

  if (!isValid) {
    console.error('TradeSha 驗證失敗:');
    console.error('- 計算值 (前20字):', sha.substring(0, 20) + '...');
    console.error('- 接收值 (前20字):', tradeSha.toUpperCase().substring(0, 20) + '...');
  }

  return isValid;
}

/**
 * 2) 解密 TradeInfo
 * 官方文件：密文是十六進位字串，要先轉 bytes 再 AES 解密
 */
export function decryptTradeInfo(tradeInfo: string) {
  if (!tradeInfo) throw new Error('TradeInfo is empty');

  // 清理可能的空白和特殊字符
  // 重要：有些環境會把 + 變成空白
  const cleaned = tradeInfo.trim().replace(/ /g, '+');

  console.log('解密前檢查:');
  console.log('- TradeInfo 長度:', cleaned.length);
  console.log('- 前50字符:', cleaned.substring(0, 50));
  console.log('- 是否只含 Hex 字符:', /^[0-9A-Fa-f]+$/.test(cleaned) ? '✅' : '❌');

  // 如果不是有效的 hex，可能有編碼問題
  if (!/^[0-9A-Fa-f]+$/.test(cleaned)) {
    console.error('TradeInfo 包含非 Hex 字符，可能有編碼問題');
    throw new Error('Invalid TradeInfo format: not a valid hex string');
  }

  try {
    // 官方文件：密文是十六進位字串，要先轉 bytes 再 AES 解密
    const encrypted = Buffer.from(cleaned, 'hex');

    const key = Buffer.from(HASH_KEY, 'utf8');
    const iv = Buffer.from(HASH_IV, 'utf8');

    // 檢查 key 和 iv 長度
    if (key.length !== 32) {
      throw new Error(`HashKey 長度錯誤：${key.length}，應為 32`);
    }
    if (iv.length !== 16) {
      throw new Error(`HashIV 長度錯誤：${iv.length}，應為 16`);
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    // 使用自動 PKCS7 padding（Node.js 預設）
    decipher.setAutoPadding(true);

    let decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    const decryptedStr = decrypted.toString('utf8');
    console.log('✅ 解密成功，原始內容 (前100字):', decryptedStr.substring(0, 100));

    // 藍新金流回傳的內容可能是：
    // 1. JSON 格式（RespondType=JSON）
    // 2. Query String 格式（預設）

    // 先嘗試 JSON 解析
    try {
      const jsonData = JSON.parse(decryptedStr);
      console.log('✅ JSON 格式解析成功');
      return jsonData;
    } catch (jsonError) {
      // 不是 JSON，嘗試 query string
      console.log('不是 JSON 格式，解析為 query string');
      const parsed = qs.parse(decryptedStr);

      // 如果有 Result 欄位且是 JSON 字串，解析它
      let result: any = parsed;
      if (typeof parsed.Result === 'string') {
        try {
          result = {
            ...parsed,
            Result: JSON.parse(parsed.Result),
          };
        } catch {
          // Result 不是 JSON，保持原樣
        }
      }

      return result;
    }
  } catch (error) {
    console.error('❌ AES 解密失敗:', error instanceof Error ? error.message : '未知錯誤');

    if (error instanceof Error && error.message.includes('bad decrypt')) {
      console.error('可能原因：');
      console.error('1. HashKey 或 HashIV 不正確（測試/正式環境混用）');
      console.error('2. TradeInfo 在傳輸中被修改或截斷');
      console.error('3. 使用了 EncryptType=1（GCM 模式）但解密用 CBC');
    }

    throw error;
  }
}

/**
 * 3) 主要解密驗證函數
 * 先驗證 TradeSha，再解密 TradeInfo
 */
export function decryptAndVerifyTradeInfo(tradeInfo: string, tradeSha: string) {
  console.log('=== 開始驗證藍新金流資料 ===');
  console.log('TradeInfo 長度:', tradeInfo.length);
  console.log('TradeSha 長度:', tradeSha.length);

  // 步驟 1：先驗證 TradeSha（防止資料遭竄改）
  if (!verifyTradeSha(tradeInfo, tradeSha)) {
    throw new Error('TradeSha 驗證失敗：資料可能遭竄改或使用錯誤的 HashKey/HashIV');
  }

  console.log('✅ TradeSha 驗證通過');

  // 步驟 2：解密 TradeInfo
  const decryptedData = decryptTradeInfo(tradeInfo);

  console.log('✅ 資料解密成功');
  console.log('Status:', decryptedData.Status);
  console.log('Message:', decryptedData.Message);

  return decryptedData;
}

/**
 * 4) 加密函數（用於建立支付）
 * 將資料用 AES-256-CBC 加密成十六進制
 */
export function encryptTradeInfo(data: string): string {
  const key = Buffer.from(HASH_KEY, 'utf8');
  const iv = Buffer.from(HASH_IV, 'utf8');

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return encrypted.toUpperCase(); // 藍新金流要求大寫
}

/**
 * 5) 產生 TradeSha（用於建立支付）
 */
export function generateTradeSha(tradeInfo: string): string {
  const plain = `HashKey=${HASH_KEY}&${tradeInfo}&HashIV=${HASH_IV}`;
  return crypto
    .createHash('sha256')
    .update(plain)
    .digest('hex')
    .toUpperCase();
}

/**
 * 6) 建立支付資料（修正版：白名單機制 + 付款方式控制）
 */
export function createPaymentData(params: {
  merchantOrderNo: string;
  amount: number;
  itemDesc: string;
  email: string;
  notifyUrl: string;
  returnUrl: string;
  clientBackUrl: string;
  shippingMethod?: string; // 接收字串
  paymentTypes: NewebPaymentType[]; // 新增：付款方式陣列
}) {
  // 1. 強制轉型並移除空白，確保比對精準
  const cleanShippingMethod = String(params.shippingMethod || '').trim();

  // 2. 金額取整
  const amount = Math.floor(params.amount);

  // 3. 建立基本參數
  const tradeData: Record<string, any> = {
    MerchantID: MERCHANT_ID,
    RespondType: 'JSON',
    TimeStamp: Math.floor(Date.now() / 1000),
    Version: '2.0',
    MerchantOrderNo: params.merchantOrderNo,
    Amt: amount,
    ItemDesc: params.itemDesc.substring(0, 50),
    Email: params.email,
    NotifyURL: params.notifyUrl,
    ReturnURL: params.returnUrl,
    ClientBackURL: params.clientBackUrl,
    LoginType: 0,
  };

  // 4. 🎯 明確設定付款方式（根據 paymentTypes 陣列）
  console.log(`💳 [PaymentTypes] 設定付款方式: ${params.paymentTypes.join(', ')}`);
  const types = new Set(params.paymentTypes);

  // 根據陣列設定對應的藍新金流欄位
  if (types.has('CREDIT_CARD')) tradeData.CREDIT = 1;
  if (types.has('WEBATM'))      tradeData.WEBATM = 1;
  if (types.has('VACC'))        tradeData.VACC = 1;
  if (types.has('CVS'))         tradeData.CVS = 1;
  if (types.has('BARCODE'))     tradeData.BARCODE = 1;

  // 5. 🔥 核心判斷邏輯：只有 'SEVEN_ELEVEN' 才加物流參數
  console.log(`🛡️ [PaymentCheck] 訂單號: ${params.merchantOrderNo}, 配送方式: "${cleanShippingMethod}"`);

  if (cleanShippingMethod === 'SEVEN_ELEVEN') {
    console.log('✅ 判定為 [7-11 店到店] -> 啟用 LgsType');
    tradeData.LgsType = 'C2C';
    // 如果有超商付款，可能還需要 CVSCOM（超商取貨付款）
    if (types.has('CVS') || types.has('BARCODE')) {
      tradeData.CVSCOM = 1; // 啟用超商取貨付款
      console.log('   📦 啟用 CVSCOM（超商取貨付款）');
    }
  } else {
    console.log('🚫 判定為 [純金流/宅配/自取] -> 強制移除 LgsType');
    // 確保完全移除，不留痕跡
    delete tradeData.LgsType;
    delete tradeData.CVSCOM;
    // 移除其他可能殘留的超商參數
    delete tradeData.CVSStoreID;
    delete tradeData.CVSStoreName;
    delete tradeData.CVSAddress;
    delete tradeData.CVSOutSide;
  }

  // 6. 轉換為 Query String
  const queryString = Object.entries(tradeData)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');

  // 7. 🔍 最終檢查 (請查看 VS Code 終端機)
  console.log('[NewebPay QueryString] =>', queryString.substring(0, 200) + '...');

  if (queryString.includes('LgsType')) {
    console.warn('⚠️ 警告：最終字串包含 LgsType，將會顯示取貨地圖！');
  } else {
    console.log('👍 確認：最終字串不含 LgsType，將只顯示付款選項。');
  }

  const tradeInfo = encryptTradeInfo(queryString);
  const tradeSha = generateTradeSha(tradeInfo);

  return {
    MerchantID: MERCHANT_ID,
    TradeInfo: tradeInfo,
    TradeSha: tradeSha,
    Version: '2.0',
  };
}

// ============================================
// 輔助函數
// ============================================

/**
 * 格式化支付方式名稱（前端顯示用）
 */
export function formatPaymentType(paymentType: string): string {
  const mapping: Record<string, string> = {
    'CREDIT': '信用卡',
    'CREDIT_CARD': '信用卡',
    'VACC': 'ATM 轉帳',
    'CVS': '超商代碼',
    'BARCODE': '超商條碼',
    'WEBATM': '網路 ATM',
  };
  return mapping[paymentType] || paymentType;
}

/**
 * 產生商店訂單編號
 */
export function generateMerchantOrderNo(prefix: string = 'ORD'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// ============================================
// 導出所有函數
// ============================================
export default {
  // 配置
  NEWEBPAY_CONFIG,

  // 解密相關
  verifyTradeSha,
  decryptTradeInfo,
  decryptAndVerifyTradeInfo,

  // 加密相關
  encryptTradeInfo,
  generateTradeSha,
  createPaymentData,

  // 輔助函數
  formatPaymentType,
  generateMerchantOrderNo,
};