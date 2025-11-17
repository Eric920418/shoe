#!/usr/bin/env node

/**
 * 檢查藍新金流環境設定
 */

const crypto = require('crypto');

console.log('\n' + '='.repeat(70));
console.log('🔍 藍新金流環境診斷');
console.log('='.repeat(70));

// 目前的設定
const CURRENT = {
  merchantId: "MS3804866712",
  hashKey: "K9gJ99V7agH7IHzXFrQMQQWHKgW6LDZd",
  hashIV: "P3Byvs1dzveFaSLC",
  mpgUrl: "https://core.newebpay.com/MPG/mpg_gateway"
};

console.log('\n📌 目前設定：');
console.log('MerchantID:', CURRENT.merchantId);
console.log('HashKey:', CURRENT.hashKey);
console.log('HashIV:', CURRENT.hashIV);
console.log('MPG URL:', CURRENT.mpgUrl);

// 判斷環境
const isProduction = CURRENT.mpgUrl.includes('core.newebpay.com');
const isTest = CURRENT.mpgUrl.includes('ccore.newebpay.com');

console.log('\n🌐 環境判斷：');
if (isProduction) {
  console.log('✅ 使用【正式環境】');
  console.log('   API: https://core.newebpay.com');
} else if (isTest) {
  console.log('🧪 使用【測試環境】');
  console.log('   API: https://ccore.newebpay.com');
} else {
  console.log('❓ 無法判斷環境');
}

// 常見的測試環境設定（供參考）
console.log('\n📝 提醒：');
console.log('1. MerchantID 格式：');
console.log('   - 正式環境：通常是 MS 開頭 + 10 位數字');
console.log('   - 測試環境：通常是 MS + 數字');
console.log('   您的 MerchantID:', CURRENT.merchantId, '看起來像', CURRENT.merchantId.startsWith('MS') ? '正式環境格式' : '未知格式');

console.log('\n2. 確認清單：');
console.log('   □ MerchantID、HashKey、HashIV 是同一組（同環境）');
console.log('   □ 在藍新金流商店後台確認這組憑證是【正式】還是【測試】');
console.log('   □ API URL 與憑證環境一致');

// 測試加密功能（使用藍新範例資料）
console.log('\n' + '='.repeat(70));
console.log('🧪 測試加密功能（使用目前的 Key/IV）');
console.log('='.repeat(70));

function testEncryption(merchantId, hashKey, hashIV) {
  try {
    // 建立測試資料
    const testData = [
      `MerchantID=${merchantId}`,
      'Amt=100',
      'ItemDesc=TestProduct',
      `TimeStamp=${Math.floor(Date.now()/1000)}`,
      'RespondType=JSON',
      'Version=2.0'
    ].join('&');

    console.log('\n測試資料:', testData);

    // 加密
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(hashKey, 'utf8'),
      Buffer.from(hashIV, 'utf8')
    );

    let encrypted = cipher.update(testData, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    encrypted = encrypted.toUpperCase();

    console.log('加密成功 ✅');
    console.log('TradeInfo (前50字):', encrypted.substring(0, 50) + '...');

    // 產生 TradeSha
    const shaStr = `HashKey=${hashKey}&${encrypted}&HashIV=${hashIV}`;
    const tradeSha = crypto.createHash('sha256').update(shaStr).digest('hex').toUpperCase();

    console.log('TradeSha (前50字):', tradeSha.substring(0, 50) + '...');

    return { success: true, tradeInfo: encrypted, tradeSha };
  } catch (error) {
    console.error('加密失敗 ❌:', error.message);
    return { success: false };
  }
}

const result = testEncryption(CURRENT.merchantId, CURRENT.hashKey, CURRENT.hashIV);

if (result.success) {
  console.log('\n✅ 加密功能正常');
} else {
  console.log('\n❌ 加密功能異常');
}

// 建議
console.log('\n' + '='.repeat(70));
console.log('💡 建議下一步：');
console.log('='.repeat(70));

console.log(`
1. 登入藍新金流商店後台，確認：
   - 這組 MerchantID (${CURRENT.merchantId}) 是正式還是測試帳號
   - HashKey 和 HashIV 是否正確
   - 回調網址是否已設定

2. 如果是測試環境的憑證，請修改：
   - NEWEBPAY_MPG_URL 改為 https://ccore.newebpay.com/MPG/mpg_gateway
   - NEWEBPAY_QUERY_URL 改為 https://ccore.newebpay.com/API/QueryTradeInfo

3. 如果是正式環境的憑證（目前設定），請：
   - 向藍新金流確認憑證是否有效
   - 檢查是否有 IP 白名單限制

4. 可以先用測試環境測試：
   - 申請測試商店帳號
   - 使用測試環境的 Key/IV
   - 測試成功後再切換到正式環境
`);

console.log('診斷完成！\n');