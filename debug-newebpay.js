/**
 * 藍新金流解密調試腳本
 *
 * 用途：測試從 NotifyURL 收到的 TradeInfo 能否正確解密
 */

const crypto = require('crypto');

// 從環境變數讀取
require('dotenv').config();

const HASH_KEY = process.env.NEWEBPAY_HASH_KEY;
const HASH_IV = process.env.NEWEBPAY_HASH_IV;

console.log('=== 藍新金流解密調試 ===\n');
console.log('HashKey:', HASH_KEY);
console.log('HashIV:', HASH_IV);
console.log('HashKey 長度:', HASH_KEY.length);
console.log('HashIV 長度:', HASH_IV.length);
console.log('');

// 從日誌中複製的 TradeInfo（NotifyURL 收到的，解密失敗的）
const NOTIFY_TRADE_INFO = '9669FBFC435C6234A7B8E7F33DC835C90A5A97004AD3BE28FB91FF8C1AF17500AFAE81D3450E361FC805EAF297941DDD79DE';

// 從日誌中複製的 TradeInfo（ReturnURL 收到的，解密成功的）
const RETURN_TRADE_INFO = '2b1b258bc994e2c8a66a57a386ed4f3e8c6338fd75993292d0cefdfef3cd79d88f8f91ff6231dcd22e0fdb55a9753f179e44';

/**
 * AES-256-CBC 解密函數
 */
function aesDecrypt(encryptedData, hashKey, hashIV) {
  try {
    const cleanedData = encryptedData.trim();

    console.log('嘗試解密:');
    console.log('- 加密資料長度:', cleanedData.length);
    console.log('- 加密資料（前50字）:', cleanedData.substring(0, 50));

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(hashKey, 'utf8'),
      Buffer.from(hashIV, 'utf8')
    );

    decipher.setAutoPadding(true);

    // 先試大寫
    let decrypted = '';
    try {
      decrypted = decipher.update(cleanedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      console.log('✅ 大寫解密成功');
      return decrypted;
    } catch (e) {
      console.log('❌ 大寫解密失敗:', e.message);
    }

    // 再試小寫
    const decipher2 = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(hashKey, 'utf8'),
      Buffer.from(hashIV, 'utf8')
    );
    decipher2.setAutoPadding(true);

    try {
      decrypted = decipher2.update(cleanedData.toLowerCase(), 'hex', 'utf8');
      decrypted += decipher2.final('utf8');
      console.log('✅ 小寫解密成功');
      return decrypted;
    } catch (e) {
      console.log('❌ 小寫解密失敗:', e.message);
      throw new Error('解密失敗: ' + e.message);
    }
  } catch (error) {
    console.error('❌ 解密過程出錯:', error.message);
    throw error;
  }
}

// 測試 NotifyURL 的 TradeInfo
console.log('\n=== 測試 NotifyURL 的 TradeInfo（解密失敗的） ===');
console.log('TradeInfo 完整長度:', NOTIFY_TRADE_INFO.length);
try {
  const result = aesDecrypt(NOTIFY_TRADE_INFO, HASH_KEY, HASH_IV);
  console.log('解密結果:', result);

  try {
    const json = JSON.parse(result);
    console.log('JSON 解析成功:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.log('JSON 解析失敗，原始結果:', result);
  }
} catch (error) {
  console.error('NotifyURL TradeInfo 解密失敗');
}

// 測試 ReturnURL 的 TradeInfo
console.log('\n\n=== 測試 ReturnURL 的 TradeInfo（解密成功的） ===');
console.log('TradeInfo 完整長度:', RETURN_TRADE_INFO.length);
try {
  const result = aesDecrypt(RETURN_TRADE_INFO, HASH_KEY, HASH_IV);
  console.log('解密結果（前200字）:', result.substring(0, 200));

  try {
    const json = JSON.parse(result);
    console.log('JSON 解析成功');
    console.log('Status:', json.Status);
    console.log('Message:', json.Message);
    console.log('Result.MerchantOrderNo:', json.Result?.MerchantOrderNo);
  } catch (e) {
    console.log('JSON 解析失敗');
  }
} catch (error) {
  console.error('ReturnURL TradeInfo 解密失敗');
}

console.log('\n=== 調試完成 ===');
