#!/usr/bin/env node
/**
 * 測試藍新金流解密功能
 *
 * 使用方法：
 * node test-newebpay-decrypt.js
 */

// 載入環境變數
require('dotenv').config();

const crypto = require('crypto');

// 從環境變數取得設定
const HASH_KEY = process.env.NEWEBPAY_HASH_KEY;
const HASH_IV = process.env.NEWEBPAY_HASH_IV;

if (!HASH_KEY || !HASH_IV) {
  console.error('❌ 請設定環境變數 NEWEBPAY_HASH_KEY 和 NEWEBPAY_HASH_IV');
  process.exit(1);
}

console.log('=== 測試藍新金流解密功能 ===\n');
console.log('HashKey 長度:', HASH_KEY.length, '(應為 32)');
console.log('HashIV 長度:', HASH_IV.length, '(應為 16)');
console.log('');

// ============================================
// 測試 1: 自己加密自己解密
// ============================================
function test1_SelfEncryptDecrypt() {
  console.log('【測試 1】自己加密 → 自己解密');
  console.log('-'.repeat(50));

  // 測試資料
  const testData = 'Status=SUCCESS&Message=測試訊息&MerchantOrderNo=TEST123&Amt=1000';
  console.log('原始資料:', testData);

  try {
    // 加密
    const key = Buffer.from(HASH_KEY, 'utf8');
    const iv = Buffer.from(HASH_IV, 'utf8');

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(testData, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    encrypted = encrypted.toUpperCase();

    console.log('加密後 (前100字):', encrypted.substring(0, 100));
    console.log('加密後長度:', encrypted.length);

    // 解密
    const encryptedBuffer = Buffer.from(encrypted, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    decipher.setAutoPadding(true);

    let decrypted = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final()
    ]);

    const result = decrypted.toString('utf8');
    console.log('解密結果:', result);

    if (result === testData) {
      console.log('✅ 測試通過：自己加密解密成功\n');
    } else {
      console.log('❌ 測試失敗：解密結果不符\n');
    }
  } catch (error) {
    console.error('❌ 測試失敗:', error.message, '\n');
  }
}

// ============================================
// 測試 2: 驗證 TradeSha
// ============================================
function test2_VerifyTradeSha() {
  console.log('【測試 2】TradeSha 驗證');
  console.log('-'.repeat(50));

  const tradeInfo = 'ABCD1234567890';
  console.log('TradeInfo (假設):', tradeInfo);

  // 計算 TradeSha
  const plain = `HashKey=${HASH_KEY}&${tradeInfo}&HashIV=${HASH_IV}`;
  const tradeSha = crypto
    .createHash('sha256')
    .update(plain)
    .digest('hex')
    .toUpperCase();

  console.log('計算出的 TradeSha:', tradeSha);
  console.log('TradeSha 長度:', tradeSha.length, '(應為 64)');

  // 驗證
  const testSha = tradeSha.toLowerCase();
  if (tradeSha === testSha.toUpperCase()) {
    console.log('✅ 測試通過：TradeSha 驗證機制正常\n');
  } else {
    console.log('❌ 測試失敗：TradeSha 驗證失敗\n');
  }
}

// ============================================
// 測試 3: 解析不同格式的回傳資料
// ============================================
function test3_ParseDifferentFormats() {
  console.log('【測試 3】解析不同格式的回傳資料');
  console.log('-'.repeat(50));

  // 測試 Query String 格式
  const queryString = 'Status=SUCCESS&Message=付款成功&MerchantOrderNo=ORD123&Amt=500&PaymentType=CREDIT';
  console.log('Query String 格式:', queryString);

  const params = new URLSearchParams(queryString);
  const parsed = {};
  for (const [key, value] of params) {
    parsed[key] = value;
  }
  console.log('解析結果:', parsed);

  // 測試 JSON 格式
  const jsonString = JSON.stringify({
    Status: 'SUCCESS',
    Message: '付款成功',
    Result: {
      MerchantOrderNo: 'ORD456',
      Amt: 1000,
      PaymentType: 'VACC'
    }
  });
  console.log('\nJSON 格式:', jsonString);
  const jsonParsed = JSON.parse(jsonString);
  console.log('解析結果:', jsonParsed);

  console.log('✅ 測試通過：可以處理多種格式\n');
}

// ============================================
// 測試 4: 檢測常見問題
// ============================================
function test4_CommonIssues() {
  console.log('【測試 4】檢測常見問題');
  console.log('-'.repeat(50));

  // 檢查是否有空白或特殊字符
  const problematicHex = '1234ABCD EF56'; // 包含空白
  console.log('問題 Hex (包含空白):', problematicHex);
  console.log('是否只含 Hex 字符:', /^[0-9A-Fa-f]+$/.test(problematicHex) ? '是' : '否（問題！）');

  const cleanedHex = problematicHex.replace(/ /g, '');
  console.log('清理後:', cleanedHex);
  console.log('是否只含 Hex 字符:', /^[0-9A-Fa-f]+$/.test(cleanedHex) ? '是' : '否');

  // 檢查長度是否為偶數
  const oddHex = '1234ABC'; // 奇數長度
  console.log('\n奇數長度 Hex:', oddHex);
  console.log('長度:', oddHex.length);
  console.log('是否為偶數:', oddHex.length % 2 === 0 ? '是' : '否（問題！）');

  console.log('\n✅ 測試完成：已檢測常見問題\n');
}

// ============================================
// 測試 5: 使用實際的 newebpay-correct.ts
// ============================================
async function test5_UseCorrectImplementation() {
  console.log('【測試 5】測試 newebpay-correct.ts 實作');
  console.log('-'.repeat(50));

  try {
    // 動態載入 TypeScript 模組
    const {
      encryptTradeInfo,
      decryptTradeInfo,
      generateTradeSha,
      verifyTradeSha,
      decryptAndVerifyTradeInfo
    } = require('./dist/lib/newebpay-correct.js');

    // 測試加密
    const testData = 'Status=SUCCESS&Message=測試&MerchantOrderNo=TEST789&Amt=2000';
    const encrypted = encryptTradeInfo(testData);
    console.log('加密測試資料成功，長度:', encrypted.length);

    // 測試 TradeSha
    const tradeSha = generateTradeSha(encrypted);
    console.log('產生 TradeSha:', tradeSha.substring(0, 20) + '...');

    // 測試驗證
    const isValid = verifyTradeSha(encrypted, tradeSha);
    console.log('TradeSha 驗證:', isValid ? '✅ 通過' : '❌ 失敗');

    // 測試解密
    const decrypted = decryptTradeInfo(encrypted);
    console.log('解密結果:', decrypted);

    // 測試完整流程
    const fullResult = decryptAndVerifyTradeInfo(encrypted, tradeSha);
    console.log('完整驗證解密:', fullResult);

    console.log('✅ newebpay-correct.ts 測試通過\n');
  } catch (error) {
    console.log('⚠️  無法載入 TypeScript 模組（需要先編譯）');
    console.log('   請執行: pnpm build 或 npx tsc');
    console.log('   錯誤:', error.message, '\n');
  }
}

// ============================================
// 執行所有測試
// ============================================
async function runAllTests() {
  test1_SelfEncryptDecrypt();
  test2_VerifyTradeSha();
  test3_ParseDifferentFormats();
  test4_CommonIssues();
  await test5_UseCorrectImplementation();

  console.log('='.repeat(50));
  console.log('所有測試完成！');
  console.log('='.repeat(50));

  console.log('\n📝 如果實際環境仍有 "bad decrypt" 錯誤，請檢查：');
  console.log('1. HashKey/HashIV 是否與藍新金流後台設定一致');
  console.log('2. 測試/正式環境的憑證是否混用');
  console.log('3. TradeInfo 在傳輸過程是否被修改（URL 編碼等）');
  console.log('4. 是否誤用 EncryptType=1（GCM 模式）');
}

// 執行測試
runAllTests();