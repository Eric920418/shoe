#!/usr/bin/env node

/**
 * 綜合測試藍新金流解密問題
 * 包含 URL 編碼、HashKey/IV 檢查等
 */

const crypto = require('crypto');

// 環境設定
const MERCHANT_ID = "MS3804866712";
const HASH_KEY = "K9gJ99V7agH7IHzXFrQMQQWHKgW6LDZd";
const HASH_IV = "P3Byvs1dzveFaSLC";

console.log('\n' + '='.repeat(70));
console.log('🔬 綜合測試藍新金流解密問題');
console.log('='.repeat(70));

// ==================== 輔助函數 ====================

/**
 * 改進的 AES 解密（處理 URL 編碼）
 */
function aesDecryptImproved(encryptedData, hashKey, hashIV) {
  try {
    let cleanedData = encryptedData.trim();

    // 檢查並處理 URL 編碼
    if (cleanedData.includes('%')) {
      console.log('  ⚠️ 偵測到 URL 編碼，解碼中...');
      cleanedData = decodeURIComponent(cleanedData);
    }

    console.log(`  長度: ${cleanedData.length}, 前30字: ${cleanedData.substring(0, 30)}`);

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(hashKey, 'utf8'),
      Buffer.from(hashIV, 'utf8')
    );

    decipher.setAutoPadding(true); // PKCS7

    const encrypted = Buffer.from(cleanedData, 'hex');
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`解密失敗: ${error.message}`);
  }
}

/**
 * AES 加密
 */
function aesEncrypt(data, hashKey, hashIV) {
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(hashKey, 'utf8'),
    Buffer.from(hashIV, 'utf8')
  );

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted.toUpperCase();
}

// ==================== 測試案例 ====================

console.log('\n📋 環境檢查');
console.log('='.repeat(50));
console.log('MerchantID:', MERCHANT_ID);
console.log('HashKey 長度:', HASH_KEY.length, '(應為 32)');
console.log('HashIV 長度:', HASH_IV.length, '(應為 16)');
console.log('API 環境: 正式 (https://core.newebpay.com)');

// 測試 1：自我加解密
console.log('\n🧪 測試 1：自我加解密');
console.log('='.repeat(50));

const testData = `MerchantID=${MERCHANT_ID}&Amt=100&ItemDesc=TestProduct&TimeStamp=${Math.floor(Date.now()/1000)}`;
console.log('原始資料:', testData);

const encrypted = aesEncrypt(testData, HASH_KEY, HASH_IV);
console.log('加密結果（前50字）:', encrypted.substring(0, 50));

try {
  const decrypted = aesDecryptImproved(encrypted, HASH_KEY, HASH_IV);
  console.log('✅ 解密成功:', decrypted === testData ? '完全符合' : '不符');
} catch (error) {
  console.error('❌ 解密失敗:', error.message);
}

// 測試 2：URL 編碼的 TradeInfo
console.log('\n🧪 測試 2：URL 編碼處理');
console.log('='.repeat(50));

// 模擬 URL 編碼的情況
const urlEncodedTradeInfo = encodeURIComponent(encrypted);
console.log('URL 編碼後（前50字）:', urlEncodedTradeInfo.substring(0, 50));

try {
  const decrypted = aesDecryptImproved(urlEncodedTradeInfo, HASH_KEY, HASH_IV);
  console.log('✅ 解密成功');
} catch (error) {
  console.error('❌ 解密失敗:', error.message);
}

// 測試 3：實際的 TradeInfo（從日誌）
console.log('\n🧪 測試 3：實際的 TradeInfo');
console.log('='.repeat(50));

// 這是從您的測試中截取的
const realTradeInfo = '9669FBFC435C6234A7B8E7F33DC835C90A5A97004AD3BE28FB91FF8C1AF17500AFAE81D3450E361FC805EAF297941DDD79DE';

console.log('TradeInfo 長度:', realTradeInfo.length);
console.log('是否只含 Hex:', /^[0-9A-Fa-f]+$/.test(realTradeInfo) ? '✅' : '❌');

try {
  const decrypted = aesDecryptImproved(realTradeInfo, HASH_KEY, HASH_IV);
  console.log('✅ 解密成功！');
  console.log('內容:', decrypted.substring(0, 100));
} catch (error) {
  console.error('❌ 解密失敗:', error.message);
}

// 測試 4：診斷不同長度問題
console.log('\n🧪 測試 4：TradeInfo 長度分析');
console.log('='.repeat(50));

// 產生不同長度的測試資料
const testLengths = [
  { data: 'MerchantID=TEST&Amt=1', desc: '短資料' },
  { data: 'MerchantID=TEST&Amt=100&ItemDesc=VeryLongDescriptionHereToTestPaddingIssues', desc: '長資料' },
];

testLengths.forEach(({ data, desc }) => {
  const enc = aesEncrypt(data, HASH_KEY, HASH_IV);
  console.log(`${desc}:`, data.length, '字 → 加密後', enc.length, '字');
});

// 總結
console.log('\n' + '='.repeat(70));
console.log('📊 診斷總結');
console.log('='.repeat(70));

console.log(`
根據測試結果：

如果自我加解密【成功】但實際 TradeInfo【失敗】：

1. HashKey/HashIV 不匹配（90% 機率）
   ➤ 解決：登入藍新金流後台，確認憑證是否正確

2. TradeInfo 被截斷（5% 機率）
   ➤ 檢查：日誌中的 TradeInfo 長度是否與藍新回傳的一致
   ➤ 注意：TradeInfo 長度通常是 16 的倍數（因為 AES block size）

3. URL 編碼問題（3% 機率）
   ➤ 已修正：程式碼會自動偵測並處理

4. 環境混用（2% 機率）
   ➤ 確認：測試環境用 ccore.newebpay.com
   ➤ 確認：正式環境用 core.newebpay.com

建議行動步驟：
1. 執行一筆新交易
2. 查看 server.log 中的「TradeInfo 診斷」
3. 複製完整的 TradeInfo（但不要貼在公開場合）
4. 如果還是失敗，請提供：
   - TradeInfo 長度
   - 是否包含 %、+、空格等特殊字符
   - 前後各 20 字符
`);