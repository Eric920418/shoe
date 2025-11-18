#!/usr/bin/env node
/**
 * 測試 GraphQL Order 查詢是否返回正確的客戶資料和物流資訊
 *
 * 使用方法：
 * node test-order-query.js [orderId]
 */

require('dotenv').config();

const orderId = process.argv[2];

if (!orderId) {
  console.error('請提供訂單 ID');
  console.log('使用方法: node test-order-query.js [orderId]');
  process.exit(1);
}

// GraphQL 查詢
const GET_ORDER = `
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      orderNumber
      status
      paymentStatus
      paymentMethod

      # 物流資訊
      shippingStatus
      shippingMethod
      trackingNumber
      shippedAt
      deliveredAt

      # 收件資訊
      shippingName
      shippingPhone
      shippingCountry
      shippingCity
      shippingDistrict
      shippingStreet
      shippingZipCode

      # 客戶資訊（會員）
      user {
        id
        name
        email
        phone
      }

      # 客戶資訊（訪客）
      guestName
      guestPhone
      guestEmail

      # 金額
      total
      subtotal
      shippingFee
      discount

      # 時間戳記
      createdAt
      paidAt

      # 備註
      notes

      # 支付資訊
      payment {
        id
        merchantOrderNo
        tradeNo
        amount
        status
        paymentType
        errorMessage
      }

      # 訂單項目
      items {
        id
        productName
        quantity
        price
        subtotal
        sizeEu
        color
      }
    }
  }
`;

async function testOrderQuery() {
  console.log('=== 測試 GraphQL Order 查詢 ===\n');
  console.log('訂單 ID:', orderId);
  console.log('');

  // 需要管理員 token 才能查詢
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    console.warn('⚠️  未設定 ADMIN_TOKEN，嘗試不帶認證查詢');
    console.log('提示：請在 .env 設定 ADMIN_TOKEN 或執行以下命令獲取：');
    console.log('1. 登入管理員帳號');
    console.log('2. 在瀏覽器控制台執行: localStorage.getItem("token")');
    console.log('3. 將 token 加入 .env: ADMIN_TOKEN=你的token');
    console.log('');
  }

  try {
    const response = await fetch('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken && { 'Authorization': `Bearer ${adminToken}` }),
      },
      body: JSON.stringify({
        query: GET_ORDER,
        variables: { id: orderId },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('❌ GraphQL 錯誤:');
      result.errors.forEach(error => {
        console.error(' -', error.message);
        if (error.extensions?.code) {
          console.error('   Code:', error.extensions.code);
        }
      });
      return;
    }

    if (!result.data || !result.data.order) {
      console.error('❌ 查詢失敗：沒有返回訂單資料');
      return;
    }

    const order = result.data.order;

    console.log('✅ 訂單查詢成功！');
    console.log('');
    console.log('【基本資訊】');
    console.log('訂單編號:', order.orderNumber);
    console.log('狀態:', order.status);
    console.log('支付狀態:', order.paymentStatus);
    console.log('支付方式:', order.paymentMethod || '未設定');
    console.log('');

    console.log('【客戶資料】');
    if (order.user) {
      console.log('✅ 會員資料:');
      console.log('  ID:', order.user.id);
      console.log('  姓名:', order.user.name || '未設定');
      console.log('  Email:', order.user.email);
      console.log('  電話:', order.user.phone || '未設定');
    } else {
      console.log('❌ 無會員資料 (可能是訪客訂單)');
    }

    if (order.guestName || order.guestEmail || order.guestPhone) {
      console.log('✅ 訪客資料:');
      console.log('  姓名:', order.guestName || '未設定');
      console.log('  Email:', order.guestEmail || '未設定');
      console.log('  電話:', order.guestPhone || '未設定');
    } else {
      console.log('⚠️  無訪客資料');
    }
    console.log('');

    console.log('【收件資訊】');
    if (order.shippingName) {
      console.log('✅ 收件資料:');
      console.log('  收件人:', order.shippingName);
      console.log('  電話:', order.shippingPhone);
      console.log('  地址:', `${order.shippingCountry} ${order.shippingCity} ${order.shippingDistrict} ${order.shippingStreet}`);
      if (order.shippingZipCode) {
        console.log('  郵遞區號:', order.shippingZipCode);
      }
    } else {
      console.log('❌ 無收件資料');
    }
    console.log('');

    console.log('【物流資訊】');
    console.log('物流狀態:', order.shippingStatus || '未設定');
    console.log('物流方式:', order.shippingMethod || '未設定');
    console.log('追蹤號碼:', order.trackingNumber || '未設定');
    console.log('出貨時間:', order.shippedAt ? new Date(order.shippedAt).toLocaleString('zh-TW') : '未出貨');
    console.log('送達時間:', order.deliveredAt ? new Date(order.deliveredAt).toLocaleString('zh-TW') : '未送達');
    console.log('');

    console.log('【訂單項目】');
    if (order.items && order.items.length > 0) {
      order.items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.productName}`);
        console.log(`   數量: ${item.quantity}, 單價: $${item.price}, 小計: $${item.subtotal}`);
        if (item.sizeEu) console.log(`   尺碼: EU ${item.sizeEu}`);
        if (item.color) console.log(`   顏色: ${item.color}`);
      });
    } else {
      console.log('❌ 無訂單項目');
    }
    console.log('');

    console.log('【診斷結果】');
    const issues = [];

    if (!order.user && !order.guestName && !order.guestEmail) {
      issues.push('缺少客戶資料（無會員也無訪客資料）');
    }
    if (!order.shippingName || !order.shippingPhone) {
      issues.push('缺少收件人資訊');
    }
    if (!order.shippingCountry || !order.shippingCity || !order.shippingStreet) {
      issues.push('收件地址不完整');
    }
    if (!order.shippingMethod && order.shippingStatus !== 'PENDING') {
      issues.push('已出貨但無物流方式');
    }

    if (issues.length > 0) {
      console.log('❌ 發現以下問題:');
      issues.forEach(issue => console.log('  -', issue));
    } else {
      console.log('✅ 所有必要資料都有正確返回');
    }

  } catch (error) {
    console.error('❌ 請求失敗:', error.message);
    console.log('');
    console.log('請確認：');
    console.log('1. 開發伺服器是否運行中（pnpm dev）');
    console.log('2. 訂單 ID 是否正確');
    console.log('3. 是否有管理員權限');
  }
}

// 執行測試
testOrderQuery();