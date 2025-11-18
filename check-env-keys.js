#!/usr/bin/env node
/**
 * 檢查藍新金流 HashKey/HashIV 環境變數
 *
 * 使用方法：
 * node check-env-keys.js
 */

require('dotenv').config();

const HASH_KEY = process.env.NEWEBPAY_HASH_KEY;
const HASH_IV = process.env.NEWEBPAY_HASH_IV;
const MERCHANT_ID = process.env.NEWEBPAY_MERCHANT_ID;

console.log('=== 檢查藍新金流環境變數 ===\n');

// 檢查 HashKey
console.log('【HashKey 檢查】');
if (!HASH_KEY) {
  console.error('❌ NEWEBPAY_HASH_KEY 未設定！');
} else {
  console.log('✅ NEWEBPAY_HASH_KEY 已設定');
  console.log('   長度:', HASH_KEY.length, '(應為 32)');
  console.log('   前5字元:', HASH_KEY.substring(0, 5) + '...');
  console.log('   後5字元:', '...' + HASH_KEY.substring(HASH_KEY.length - 5));

  // 檢查長度
  if (HASH_KEY.length !== 32) {
    console.error('   ❌ 長度錯誤！應為 32 字元，實際為', HASH_KEY.length);
  } else {
    console.log('   ✅ 長度正確');
  }

  // 檢查前後空白
  if (HASH_KEY !== HASH_KEY.trim()) {
    console.error('   ❌ 包含前後空白字元！');
    console.log('   原始長度:', HASH_KEY.length);
    console.log('   去空白後長度:', HASH_KEY.trim().length);
  } else {
    console.log('   ✅ 無前後空白');
  }

  // 檢查是否只含英數字
  if (!/^[A-Za-z0-9]+$/.test(HASH_KEY)) {
    console.warn('   ⚠️  包含非英數字字元（可能正常，但請確認）');
  }
}

console.log('\n【HashIV 檢查】');
if (!HASH_IV) {
  console.error('❌ NEWEBPAY_HASH_IV 未設定！');
} else {
  console.log('✅ NEWEBPAY_HASH_IV 已設定');
  console.log('   長度:', HASH_IV.length, '(應為 16)');
  console.log('   前5字元:', HASH_IV.substring(0, 5) + '...');
  console.log('   後5字元:', '...' + HASH_IV.substring(HASH_IV.length - 5));

  // 檢查長度
  if (HASH_IV.length !== 16) {
    console.error('   ❌ 長度錯誤！應為 16 字元，實際為', HASH_IV.length);
  } else {
    console.log('   ✅ 長度正確');
  }

  // 檢查前後空白
  if (HASH_IV !== HASH_IV.trim()) {
    console.error('   ❌ 包含前後空白字元！');
    console.log('   原始長度:', HASH_IV.length);
    console.log('   去空白後長度:', HASH_IV.trim().length);
  } else {
    console.log('   ✅ 無前後空白');
  }

  // 檢查是否只含英數字
  if (!/^[A-Za-z0-9]+$/.test(HASH_IV)) {
    console.warn('   ⚠️  包含非英數字字元（可能正常，但請確認）');
  }
}

console.log('\n【MerchantID 檢查】');
if (!MERCHANT_ID) {
  console.error('❌ NEWEBPAY_MERCHANT_ID 未設定！');
} else {
  console.log('✅ NEWEBPAY_MERCHANT_ID 已設定');
  console.log('   值:', MERCHANT_ID);
  console.log('   長度:', MERCHANT_ID.length);
}

console.log('\n【環境檢查】');
const API_URL = process.env.NEWEBPAY_MPG_URL;
if (API_URL) {
  if (API_URL.includes('cwww.newebpay.com')) {
    console.log('📍 測試環境（cwww）');
  } else if (API_URL.includes('www.newebpay.com')) {
    console.log('📍 正式環境（www）');
  } else {
    console.log('⚠️  未知環境:', API_URL);
  }
} else {
  console.warn('⚠️  NEWEBPAY_MPG_URL 未設定');
}

console.log('\n=== 檢查完成 ===');

if (HASH_KEY && HASH_KEY.length === 32 && HASH_IV && HASH_IV.length === 16) {
  console.log('\n✅ 環境變數設定看起來正確');
  console.log('📝 請再次確認：');
  console.log('1. HashKey/HashIV 與藍新金流後台設定完全一致（含大小寫）');
  console.log('2. 測試/正式環境的憑證沒有混用');
  console.log('3. 複製時沒有多餘的空白或特殊字元');
} else {
  console.error('\n❌ 環境變數設定有問題，請修正後再試');
}

// 顯示 .env 範例
console.log('\n【正確的 .env 設定範例】');
console.log('```');
console.log('# 藍新金流測試環境');
console.log('NEWEBPAY_MERCHANT_ID=MS123456789');
console.log('NEWEBPAY_HASH_KEY=abcdef0123456789ABCDEF0123456789');
console.log('NEWEBPAY_HASH_IV=0123456789ABCDEF');
console.log('NEWEBPAY_MPG_URL=https://cwww.newebpay.com/MPG/mpg_gateway');
console.log('NEWEBPAY_QUERY_URL=https://cwww.newebpay.com/MPG/mpg_gateway/QueryTradeInfo');
console.log('NEWEBPAY_NOTIFY_URL=https://你的網址/api/newebpay/notify');
console.log('NEWEBPAY_RETURN_URL=https://你的網址/api/newebpay/return');
console.log('NEWEBPAY_CLIENT_BACK_URL=https://你的網址/orders');
console.log('```');