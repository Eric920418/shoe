#!/usr/bin/env node
/**
 * 直接檢查資料庫中的訂單資料
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
  console.log('=== 檢查訂單資料 ===\n');

  try {
    // 查詢最近的訂單
    const orders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        items: true,
        payment: true,
      },
    });

    console.log(`找到 ${orders.length} 筆訂單\n`);

    orders.forEach((order, index) => {
      console.log(`【訂單 ${index + 1}】`);
      console.log('ID:', order.id);
      console.log('訂單編號:', order.orderNumber);
      console.log('狀態:', order.status);
      console.log('支付狀態:', order.paymentStatus);

      // 客戶資料
      if (order.user) {
        console.log('會員:', order.user.name || order.user.email);
      } else if (order.guestName) {
        console.log('訪客:', order.guestName);
      } else {
        console.log('客戶: ❌ 無資料');
      }

      // 收件資訊
      if (order.shippingName) {
        console.log('收件人:', order.shippingName);
        console.log('收件電話:', order.shippingPhone);
        console.log('收件地址:', `${order.shippingCity}${order.shippingDistrict}${order.shippingStreet}`);
      } else {
        console.log('收件資訊: ❌ 無資料');
      }

      // 物流資訊
      console.log('物流狀態:', order.shippingStatus);
      console.log('物流方式:', order.shippingMethod || '❌ 未設定');
      console.log('追蹤號碼:', order.trackingNumber || '❌ 未設定');

      console.log('建立時間:', order.createdAt.toLocaleString('zh-TW'));
      console.log('-'.repeat(50));
      console.log('');
    });

    // 檢查是否有資料問題
    console.log('【資料完整性檢查】');

    const ordersWithoutUser = await prisma.order.count({
      where: {
        userId: null,
        guestName: null,
      },
    });
    console.log(`無客戶資料的訂單: ${ordersWithoutUser} 筆`);

    const ordersWithoutShipping = await prisma.order.count({
      where: {
        OR: [
          { shippingName: null },
          { shippingPhone: null },
          { shippingStreet: null },
        ],
      },
    });
    console.log(`收件資訊不完整的訂單: ${ordersWithoutShipping} 筆`);

    const shippedWithoutTracking = await prisma.order.count({
      where: {
        shippingStatus: 'SHIPPED',
        trackingNumber: null,
      },
    });
    console.log(`已出貨但無追蹤號碼: ${shippedWithoutTracking} 筆`);

  } catch (error) {
    console.error('❌ 查詢失敗:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();