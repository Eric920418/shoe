/**
 * 藍新金流解密函數 - 完全符合官方規範版本
 *
 * 根據藍新金流官方文件：
 * 1. TradeInfo 是 AES-256-CBC 加密後轉成十六進制
 * 2. 解密時要先從十六進制轉回二進制 (hex2bin)
 * 3. 使用 PKCS7 填充
 * 4. 確保 TradeInfo 完整性
 */

import crypto from 'crypto';

// 環境變數配置
const NEWEBPAY_CONFIG = {
  merchantId: process.env.NEWEBPAY_MERCHANT_ID!,
  hashKey: process.env.NEWEBPAY_HASH_KEY!,
  hashIV: process.env.NEWEBPAY_HASH_IV!,
};

/**
 * 移除 PKCS7 填充
 * @param data Buffer 資料
 * @returns 移除填充後的資料
 */
function stripPKCS7Padding(data: Buffer): Buffer {
  const paddingLength = data[data.length - 1];

  // 驗證填充是否正確
  if (paddingLength < 1 || paddingLength > 16) {
    throw new Error('Invalid PKCS7 padding');
  }

  // 檢查所有填充字節是否相同
  for (let i = 0; i < paddingLength; i++) {
    if (data[data.length - 1 - i] !== paddingLength) {
      throw new Error('Invalid PKCS7 padding bytes');
    }
  }

  return data.slice(0, data.length - paddingLength);
}

/**
 * AES-256-CBC 解密（完全符合藍新金流規範）
 * @param encryptedHex 加密的十六進制字串
 * @param hashKey 32 字元的 Hash Key
 * @param hashIV 16 字元的 Hash IV
 * @returns 解密後的字串
 */
export function aesDecryptFixed(
  encryptedHex: string,
  hashKey?: string,
  hashIV?: string
): string {
  try {
    // 使用傳入的 key/iv 或環境變數
    const key = hashKey || NEWEBPAY_CONFIG.hashKey;
    const iv = hashIV || NEWEBPAY_CONFIG.hashIV;

    console.log('解密參數檢查:');
    console.log('- TradeInfo 長度:', encryptedHex.length);
    console.log('- TradeInfo 是否為偶數:', encryptedHex.length % 2 === 0);
    console.log('- TradeInfo 前50字:', encryptedHex.substring(0, 50));
    console.log('- HashKey 長度:', key.length, '(應為 32)');
    console.log('- HashIV 長度:', iv.length, '(應為 16)');

    // 驗證參數
    if (!encryptedHex || encryptedHex.length === 0) {
      throw new Error('TradeInfo 是空的');
    }

    if (encryptedHex.length % 2 !== 0) {
      throw new Error('TradeInfo 長度必須是偶數（無效的十六進制）');
    }

    // 檢查是否只包含有效的十六進制字符
    if (!/^[0-9A-Fa-f]+$/.test(encryptedHex)) {
      throw new Error('TradeInfo 包含無效字符（應只有 0-9 A-F）');
    }

    if (key.length !== 32) {
      throw new Error(`HashKey 長度錯誤：${key.length}，應為 32`);
    }

    if (iv.length !== 16) {
      throw new Error(`HashIV 長度錯誤：${iv.length}，應為 16`);
    }

    // 步驟 1：從十六進制轉換回二進制格式 (hex2bin)
    const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
    console.log('- 二進制資料長度:', encryptedBuffer.length);

    // 步驟 2：準備 Key 和 IV
    const keyBuffer = Buffer.from(key, 'utf8');
    const ivBuffer = Buffer.from(iv, 'utf8');

    // 步驟 3：使用 AES-256-CBC 模式進行解密
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);

    // 關閉自動填充處理（我們要手動處理 PKCS7）
    decipher.setAutoPadding(false);

    // 執行解密
    let decrypted = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final()
    ]);

    // 步驟 4：移除 PKCS7 填充
    decrypted = stripPKCS7Padding(decrypted);

    // 轉換為 UTF-8 字串
    const result = decrypted.toString('utf8');

    console.log('✅ 解密成功');
    console.log('- 結果長度:', result.length);
    console.log('- 結果前100字:', result.substring(0, 100));

    return result;
  } catch (error) {
    console.error('❌ 解密失敗:', error instanceof Error ? error.message : '未知錯誤');

    // 提供更詳細的錯誤診斷
    if (error instanceof Error) {
      if (error.message.includes('bad decrypt') || error.message.includes('wrong final block length')) {
        console.error('可能原因：');
        console.error('1. HashKey 或 HashIV 不正確（最常見）');
        console.error('2. TradeInfo 不完整或被截斷');
        console.error('3. 使用了錯誤環境的憑證（測試 vs 正式）');
        console.error('4. TradeInfo 在傳輸中被修改');
      }
    }

    throw new Error(`AES 解密失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/**
 * AES-256-CBC 加密（用於測試）
 * @param data 要加密的資料
 * @param hashKey Hash Key
 * @param hashIV Hash IV
 * @returns 加密後的十六進制字串
 */
export function aesEncryptFixed(
  data: string,
  hashKey?: string,
  hashIV?: string
): string {
  const key = hashKey || NEWEBPAY_CONFIG.hashKey;
  const iv = hashIV || NEWEBPAY_CONFIG.hashIV;

  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'utf8'),
    Buffer.from(iv, 'utf8')
  );

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return encrypted.toUpperCase(); // 藍新要求大寫
}

/**
 * 產生 SHA256 雜湊
 * @param data 要雜湊的資料
 * @returns SHA256 雜湊值（大寫）
 */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex').toUpperCase();
}

/**
 * 產生 TradeSha
 * @param tradeInfo 已加密的 TradeInfo
 * @returns TradeSha 驗證碼
 */
export function generateTradeSha(tradeInfo: string, hashKey?: string, hashIV?: string): string {
  const key = hashKey || NEWEBPAY_CONFIG.hashKey;
  const iv = hashIV || NEWEBPAY_CONFIG.hashIV;
  const str = `HashKey=${key}&${tradeInfo}&HashIV=${iv}`;
  return sha256(str);
}

/**
 * 驗證 TradeSha 是否正確
 * @param tradeInfo 加密的 TradeInfo
 * @param tradeSha 回傳的 TradeSha
 * @returns 是否驗證成功
 */
export function verifyTradeSha(
  tradeInfo: string,
  tradeSha: string,
  hashKey?: string,
  hashIV?: string
): boolean {
  const calculatedSha = generateTradeSha(tradeInfo, hashKey, hashIV);
  const result = calculatedSha === tradeSha.toUpperCase();

  if (!result) {
    console.log('TradeSha 驗證失敗:');
    console.log('- 計算值:', calculatedSha);
    console.log('- 接收值:', tradeSha.toUpperCase());
  }

  return result;
}

/**
 * 解密並驗證藍新金流回傳資料（主要函數）
 * @param tradeInfo 加密的 TradeInfo
 * @param tradeSha 回傳的 TradeSha
 * @returns 解密後的交易資料
 */
export function decryptTradeInfo(
  tradeInfo: string,
  tradeSha: string,
  hashKey?: string,
  hashIV?: string
): any {
  console.log('=== 開始驗證藍新金流資料 ===');

  // 步驟 1：驗證 TradeSha
  if (!verifyTradeSha(tradeInfo, tradeSha, hashKey, hashIV)) {
    throw new Error('TradeSha 驗證失敗：資料可能遭竄改或使用錯誤的 HashKey/HashIV');
  }

  console.log('✅ TradeSha 驗證通過');

  // 步驟 2：解密 TradeInfo
  const decrypted = aesDecryptFixed(tradeInfo, hashKey, hashIV);

  // 步驟 3：解析結果
  try {
    // 嘗試解析為 JSON（藍新金流 2.0 版本回傳 JSON）
    const data = JSON.parse(decrypted);
    console.log('✅ JSON 解析成功');
    return data;
  } catch (jsonError) {
    // 如果不是 JSON，可能是 query string 格式（舊版）
    console.log('不是 JSON 格式，嘗試解析為 query string');

    const params = new URLSearchParams(decrypted);
    const result: any = {
      Status: params.get('Status'),
      Message: params.get('Message'),
      Result: {}
    };

    // 將所有參數轉換為物件
    for (const [key, value] of params) {
      if (key !== 'Status' && key !== 'Message') {
        result.Result[key] = value;
      }
    }

    return result;
  }
}

// 導出所有函數
export default {
  aesDecryptFixed,
  aesEncryptFixed,
  sha256,
  generateTradeSha,
  verifyTradeSha,
  decryptTradeInfo,
};