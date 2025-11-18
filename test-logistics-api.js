#!/usr/bin/env node
/**
 * 測試物流 API 連線
 */

require('dotenv').config();
const crypto = require('crypto');

// 配置
const merchantId = process.env.NEWEBPAY_LOGISTICS_MERCHANT_ID || process.env.NEWEBPAY_MERCHANT_ID;
const hashKey = process.env.NEWEBPAY_LOGISTICS_HASH_KEY || process.env.NEWEBPAY_HASH_KEY;
const hashIV = process.env.NEWEBPAY_LOGISTICS_HASH_IV || process.env.NEWEBPAY_HASH_IV;
const apiUrl = 'https://ccore.newebpay.com/API/Logistic';

console.log('=== 物流 API 測試 ===\n');
console.log('配置資訊:');
console.log('商店代號:', merchantId || '❌ 未設定');
console.log('HashKey:', hashKey ? `${hashKey.substring(0, 10)}...` : '❌ 未設定');
console.log('HashIV:', hashIV ? `${hashIV.substring(0, 5)}...` : '❌ 未設定');
console.log('API URL:', apiUrl);
console.log('');

if (!merchantId || !hashKey || !hashIV) {
  console.error('❌ 物流 API 配置不完整');
  console.log('');
  console.log('請確認以下環境變數已設定:');
  console.log('- NEWEBPAY_MERCHANT_ID');
  console.log('- NEWEBPAY_HASH_KEY');
  console.log('- NEWEBPAY_HASH_IV');
  console.log('');
  console.log('或設定物流專屬的環境變數:');
  console.log('- NEWEBPAY_LOGISTICS_MERCHANT_ID');
  console.log('- NEWEBPAY_LOGISTICS_HASH_KEY');
  console.log('- NEWEBPAY_LOGISTICS_HASH_IV');
  process.exit(1);
}

// AES-256-CBC 加密
function encrypt(data) {
  const jsonData = JSON.stringify(data);
  const cipher = crypto.createCipheriv('aes-256-cbc', hashKey, hashIV);
  let encrypted = cipher.update(jsonData, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// 產生 SHA256 雜湊值
function generateHash(encryptedData) {
  const hashString = `HashKey=${hashKey}&${encryptedData}&HashIV=${hashIV}`;
  return crypto.createHash('sha256').update(hashString).digest('hex').toUpperCase();
}

async function testPrintLabel() {
  console.log('【測試列印標籤 API】\n');

  // 準備測試參數
  const params = {
    LgsType: 'B2C',
    ShipType: '2', // 全家
    MerchantOrderNo: ['TEST' + Date.now()], // 測試訂單編號
    Version: '1.0',
    TimeStamp: Math.floor(Date.now() / 1000).toString(),
    RespondType: 'JSON',
  };

  console.log('測試參數:', params);
  console.log('');

  try {
    // 加密資料
    const encryptedData = encrypt(params);
    console.log('加密資料 (前50字):', encryptedData.substring(0, 50) + '...');

    // 產生雜湊值
    const hashData = generateHash(encryptedData);
    console.log('雜湊值 (前50字):', hashData.substring(0, 50) + '...');
    console.log('');

    // 發送 API 請求
    const formData = new URLSearchParams({
      UID_: merchantId,
      Version_: '1.0',
      RespondType_: 'JSON',
      EncryptData_: encryptedData,
      HashData_: hashData,
    });

    console.log('發送 POST 請求到:', `${apiUrl}/printLabel`);
    console.log('');

    const response = await fetch(`${apiUrl}/printLabel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    console.log('HTTP 狀態碼:', response.status);
    console.log('回應內容:', responseText);
    console.log('');

    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('解析後的回應:', JSON.stringify(result, null, 2));

        if (result.Status === 'SUCCESS') {
          console.log('\n✅ API 連線成功！');
        } else {
          console.log(`\n❌ API 回傳錯誤: ${result.Message || '未知錯誤'}`);
          if (result.Message === '查無合作商店') {
            console.log('\n可能的原因:');
            console.log('1. 商店代號 (UID_) 不正確');
            console.log('2. HashKey 或 HashIV 不正確');
            console.log('3. 此商店未啟用物流服務');
            console.log('4. 使用了金流的 Key/IV，但物流需要不同的 Key/IV');
          }
        }
      } catch (e) {
        console.log('❌ 無法解析 JSON 回應');
      }
    } else {
      console.log('❌ HTTP 請求失敗');
    }
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    console.error(error);
  }
}

// 執行測試
testPrintLabel();
