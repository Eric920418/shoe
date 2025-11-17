#!/usr/bin/env node

/**
 * 藍新金流加解密測試程式
 * 用來診斷 AES 解密失敗的問題
 */

const crypto = require('crypto');

// ===== 1. 環境變數檢查 =====
console.log('\n' + '='.repeat(60));
console.log('📋 步驟 1: 檢查環境變數設定');
console.log('='.repeat(60));

// 硬編碼設定（排除環境變數讀取錯誤）
const MERCHANT_ID = "MS3804866712";
const HASH_KEY = "K9gJ99V7agH7IHzXFrQMQQWHKgW6LDZd";
const HASH_IV = "P3Byvs1dzveFaSLC";

console.log('商店代號:', MERCHANT_ID);
console.log('HashKey:', HASH_KEY);
console.log('HashKey 長度:', HASH_KEY.length, '(應該是 32)');
console.log('HashIV:', HASH_IV);
console.log('HashIV 長度:', HASH_IV.length, '(應該是 16)');

// 驗證長度
if (HASH_KEY.length !== 32) {
  console.error('❌ 錯誤：HashKey 長度不是 32！');
  process.exit(1);
}
if (HASH_IV.length !== 16) {
  console.error('❌ 錯誤：HashIV 長度不是 16！');
  process.exit(1);
}

console.log('✅ Key/IV 長度正確');

// ===== 2. 加密函數 =====
function aesEncrypt(data, hashKey, hashIV) {
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(hashKey, 'utf8'), // 重要：utf8，不是 hex
    Buffer.from(hashIV, 'utf8')    // 重要：utf8，不是 hex
  );

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted.toUpperCase(); // 藍新要求大寫
}

// ===== 3. 解密函數（正確版本）=====
function aesDecrypt(encryptedHex, hashKey, hashIV) {
  try {
    // 重要：先將 hex 字串轉為 Buffer
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(hashKey, 'utf8'), // 重要：utf8
      Buffer.from(hashIV, 'utf8')    // 重要：utf8
    );

    decipher.setAutoPadding(true); // PKCS7

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`解密失敗: ${error.message}`);
  }
}

// ===== 4. 自我加解密測試 =====
console.log('\n' + '='.repeat(60));
console.log('🔬 步驟 2: 自我加解密測試');
console.log('='.repeat(60));

// 測試資料（模擬藍新金流格式）
const testData = `MerchantID=${MERCHANT_ID}&Amt=100&ItemDesc=TestProduct&TimeStamp=${Math.floor(Date.now()/1000)}`;
console.log('原始資料:', testData);

// 加密
const encrypted = aesEncrypt(testData, HASH_KEY, HASH_IV);
console.log('\n加密結果:');
console.log('- 長度:', encrypted.length, '(必須是偶數)');
console.log('- 前50字:', encrypted.substring(0, 50));
console.log('- 是否只含 0-9 A-F:', /^[0-9A-F]+$/.test(encrypted) ? '✅ 是' : '❌ 否');

// 解密
try {
  const decrypted = aesDecrypt(encrypted, HASH_KEY, HASH_IV);
  console.log('\n解密結果:');
  console.log('- 成功:', decrypted === testData ? '✅ 完全符合' : '❌ 不符');
  console.log('- 解密內容:', decrypted.substring(0, 100));

  if (decrypted === testData) {
    console.log('\n✅ 自我加解密測試通過！AES 函數正常工作。');
  } else {
    console.log('\n❌ 自我加解密測試失敗！資料不符。');
  }
} catch (error) {
  console.error('\n❌ 自我加解密測試失敗:', error.message);
}

// ===== 5. 測試實際的 TradeInfo（從日誌複製）=====
console.log('\n' + '='.repeat(60));
console.log('🔍 步驟 3: 測試實際的 TradeInfo');
console.log('='.repeat(60));

// NotifyURL 收到的（解密失敗的）
const NOTIFY_TRADEINFO = '9669FBFC435C6234A7B8E7F33DC835C90A5A97004AD3BE28FB91FF8C1AF17500AFAE81D3450E361FC805EAF297941DDD79DE';

// ReturnURL 收到的（解密成功的）
const RETURN_TRADEINFO = '2b1b258bc994e2c8a66a57a386ed4f3e8c6338fd75993292d0cefdfef3cd79d88f8f91ff6231dcd22e0fdb55a9753f179e44';

console.log('NotifyURL TradeInfo:');
console.log('- 長度:', NOTIFY_TRADEINFO.length, '(是否偶數:', NOTIFY_TRADEINFO.length % 2 === 0 ? '✅' : '❌', ')');
console.log('- 只含 Hex 字符:', /^[0-9A-Fa-f]+$/.test(NOTIFY_TRADEINFO) ? '✅' : '❌');

console.log('\nReturnURL TradeInfo:');
console.log('- 長度:', RETURN_TRADEINFO.length, '(是否偶數:', RETURN_TRADEINFO.length % 2 === 0 ? '✅' : '❌', ')');
console.log('- 只含 Hex 字符:', /^[0-9A-Fa-f]+$/.test(RETURN_TRADEINFO) ? '✅' : '❌');

// 嘗試解密 NotifyURL 的資料
console.log('\n測試 NotifyURL TradeInfo:');
try {
  const decrypted = aesDecrypt(NOTIFY_TRADEINFO, HASH_KEY, HASH_IV);
  console.log('✅ 解密成功！');
  console.log('內容（前200字）:', decrypted.substring(0, 200));

  // 嘗試解析為 JSON
  try {
    const json = JSON.parse(decrypted);
    console.log('JSON 解析成功:', JSON.stringify(json, null, 2).substring(0, 500));
  } catch (e) {
    console.log('不是 JSON，可能是 query string:', decrypted.substring(0, 200));
  }
} catch (error) {
  console.error('❌ 解密失敗:', error.message);
}

// 嘗試解密 ReturnURL 的資料
console.log('\n測試 ReturnURL TradeInfo:');
try {
  const decrypted = aesDecrypt(RETURN_TRADEINFO, HASH_KEY, HASH_IV);
  console.log('✅ 解密成功！');
  console.log('內容（前200字）:', decrypted.substring(0, 200));

  // 嘗試解析為 JSON
  try {
    const json = JSON.parse(decrypted);
    console.log('JSON 解析成功:');
    console.log('- Status:', json.Status);
    console.log('- Message:', json.Message);
    console.log('- MerchantOrderNo:', json.Result?.MerchantOrderNo);
  } catch (e) {
    console.log('不是 JSON，可能是 query string:', decrypted.substring(0, 200));
  }
} catch (error) {
  console.error('❌ 解密失敗:', error.message);
}

// ===== 6. 測試不同的 Key/IV 組合 =====
console.log('\n' + '='.repeat(60));
console.log('🔐 步驟 4: 測試可能的 Key/IV 問題');
console.log('='.repeat(60));

// 測試：如果 Key/IV 有多餘空白或換行
const testCases = [
  { name: '原始 Key/IV', key: HASH_KEY, iv: HASH_IV },
  { name: '前後有空白', key: ` ${HASH_KEY} `, iv: ` ${HASH_IV} ` },
  { name: '有換行符', key: HASH_KEY + '\n', iv: HASH_IV + '\n' },
];

testCases.forEach(({ name, key, iv }) => {
  console.log(`\n測試: ${name}`);
  console.log(`Key 長度: ${key.length}, IV 長度: ${iv.length}`);

  try {
    const testStr = 'Test123';
    const enc = aesEncrypt(testStr, key.trim(), iv.trim());
    const dec = aesDecrypt(enc, key.trim(), iv.trim());
    console.log('✅ 可以正常加解密');
  } catch (error) {
    console.log('❌ 加解密失敗:', error.message);
  }
});

// ===== 7. 診斷結論 =====
console.log('\n' + '='.repeat(60));
console.log('📊 診斷結論');
console.log('='.repeat(60));

console.log(`
可能的問題：
1. 如果自我加解密【成功】，但藍新的 TradeInfo【失敗】：
   → 很可能是 HashKey/HashIV 不匹配（測試環境 vs 正式環境）
   → 或者 TradeInfo 在傳輸過程中被損壞

2. 如果自我加解密也【失敗】：
   → AES 實作有問題

3. NotifyURL 和 ReturnURL 的 TradeInfo 長度不同：
   → 可能是不同的資料內容
   → 或者編碼方式不同

建議：
1. 向藍新金流確認目前使用的是【測試】還是【正式】環境的 Key/IV
2. 確認 MerchantID、HashKey、HashIV 是同一組
3. 檢查是否有其他地方（如 Nginx）對請求進行了編碼轉換
`);

console.log('測試完成！');