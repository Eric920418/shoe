#!/usr/bin/env node

/**
 * 測試修正後的解密函數
 */

const crypto = require('crypto');

// 設定
const MERCHANT_ID = "MS3804866712";
const HASH_KEY = "K9gJ99V7agH7IHzXFrQMQQWHKgW6LDZd";
const HASH_IV = "P3Byvs1dzveFaSLC";

console.log('\n' + '='.repeat(70));
console.log('🔬 測試修正後的藍新金流解密函數');
console.log('='.repeat(70));

/**
 * 移除 PKCS7 填充
 */
function stripPKCS7Padding(data) {
  const paddingLength = data[data.length - 1];

  if (paddingLength < 1 || paddingLength > 16) {
    throw new Error('Invalid PKCS7 padding');
  }

  for (let i = 0; i < paddingLength; i++) {
    if (data[data.length - 1 - i] !== paddingLength) {
      throw new Error('Invalid PKCS7 padding bytes');
    }
  }

  return data.slice(0, data.length - paddingLength);
}

/**
 * 解密函數（完全符合官方規範）
 */
function aesDecryptFixed(encryptedHex, hashKey, hashIV) {
  try {
    console.log('\n開始解密...');
    console.log('TradeInfo 長度:', encryptedHex.length);
    console.log('TradeInfo 前30字:', encryptedHex.substring(0, 30));

    // 步驟 1：從十六進制轉換回二進制
    const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
    console.log('二進制資料長度:', encryptedBuffer.length);

    // 步驟 2：準備 Key 和 IV
    const keyBuffer = Buffer.from(hashKey, 'utf8');
    const ivBuffer = Buffer.from(hashIV, 'utf8');

    // 步驟 3：使用 AES-256-CBC 解密
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);

    // 關閉自動填充（手動處理 PKCS7）
    decipher.setAutoPadding(false);

    let decrypted = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final()
    ]);

    // 步驟 4：移除 PKCS7 填充
    decrypted = stripPKCS7Padding(decrypted);

    const result = decrypted.toString('utf8');
    console.log('✅ 解密成功！');

    return result;
  } catch (error) {
    console.error('❌ 解密失敗:', error.message);
    throw error;
  }
}

/**
 * 使用 Node.js 預設方式解密（對照組）
 */
function aesDecryptNode(encryptedHex, hashKey, hashIV) {
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(hashKey, 'utf8'),
      Buffer.from(hashIV, 'utf8')
    );

    decipher.setAutoPadding(true); // 自動處理填充

    const encrypted = Buffer.from(encryptedHex, 'hex');
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw error;
  }
}

// ===== 測試 1：自我加解密 =====
console.log('\n' + '='.repeat(50));
console.log('測試 1：自我加解密');
console.log('='.repeat(50));

// 加密測試資料
const testData = `MerchantID=${MERCHANT_ID}&Amt=100&ItemDesc=Test&TimeStamp=${Math.floor(Date.now()/1000)}`;
console.log('原始資料:', testData);

// 加密
const cipher = crypto.createCipheriv(
  'aes-256-cbc',
  Buffer.from(HASH_KEY, 'utf8'),
  Buffer.from(HASH_IV, 'utf8')
);
let encrypted = cipher.update(testData, 'utf8', 'hex');
encrypted += cipher.final('hex');
encrypted = encrypted.toUpperCase();

console.log('\n加密結果:', encrypted.substring(0, 50) + '...');

// 測試兩種解密方式
console.log('\n使用修正版解密:');
try {
  const result1 = aesDecryptFixed(encrypted, HASH_KEY, HASH_IV);
  console.log('結果:', result1 === testData ? '✅ 完全符合' : '❌ 不符');
} catch (e) {
  console.error('失敗:', e.message);
}

console.log('\n使用 Node.js 預設解密:');
try {
  const result2 = aesDecryptNode(encrypted, HASH_KEY, HASH_IV);
  console.log('結果:', result2 === testData ? '✅ 完全符合' : '❌ 不符');
} catch (e) {
  console.error('失敗:', e.message);
}

// ===== 測試 2：實際的 TradeInfo =====
console.log('\n' + '='.repeat(50));
console.log('測試 2：實際的 TradeInfo（從日誌）');
console.log('='.repeat(50));

// 這些是從日誌中取得的實際 TradeInfo
const TEST_CASES = [
  {
    name: 'NotifyURL TradeInfo（原本解密失敗）',
    tradeInfo: '9669FBFC435C6234A7B8E7F33DC835C90A5A97004AD3BE28FB91FF8C1AF17500AFAE81D3450E361FC805EAF297941DDD79DE',
  },
  {
    name: 'ReturnURL TradeInfo（原本解密成功）',
    tradeInfo: '2b1b258bc994e2c8a66a57a386ed4f3e8c6338fd75993292d0cefdfef3cd79d88f8f91ff6231dcd22e0fdb55a9753f179e44',
  }
];

TEST_CASES.forEach(({ name, tradeInfo }) => {
  console.log(`\n測試: ${name}`);
  console.log('TradeInfo 長度:', tradeInfo.length);

  console.log('\n使用修正版解密:');
  try {
    const result = aesDecryptFixed(tradeInfo, HASH_KEY, HASH_IV);
    console.log('✅ 解密成功！');
    console.log('內容（前100字）:', result.substring(0, 100));

    // 嘗試解析 JSON
    try {
      const json = JSON.parse(result);
      console.log('JSON 解析成功:');
      console.log('- Status:', json.Status);
      console.log('- Message:', json.Message);
      if (json.Result) {
        console.log('- MerchantOrderNo:', json.Result.MerchantOrderNo);
        console.log('- Amt:', json.Result.Amt);
      }
    } catch (e) {
      console.log('不是 JSON，可能是 query string');
    }
  } catch (error) {
    console.error('❌ 解密失敗:', error.message);
  }
});

// ===== 測試 3：診斷 =====
console.log('\n' + '='.repeat(50));
console.log('診斷結論');
console.log('='.repeat(50));

console.log(`
如果自我加解密成功，但實際 TradeInfo 解密失敗：

最可能的原因（按機率排序）：
1. ⭐ HashKey/HashIV 不匹配（90%）
   - 測試環境 vs 正式環境混用
   - 憑證過期或更新了

2. TradeInfo 不完整（5%）
   - 傳輸過程中被截斷
   - URL 編碼問題

3. 版本不匹配（3%）
   - API 版本不同
   - EncryptType 設定錯誤

4. 其他（2%）
   - 時區問題
   - 字元編碼問題

建議行動：
1. 登入藍新金流後台，確認憑證
2. 確認 MerchantID (${MERCHANT_ID}) 的環境
3. 重新複製正確的 HashKey 和 HashIV
`);