/**
 * 自動取消超時未付款訂單 API
 *
 * GET/POST /api/cron/cancel-expired-orders
 *
 * 功能：
 * 1. 查找所有創建超過指定時間且未付款的訂單
 * 2. 自動刪除這些訂單
 * 3. 返回處理統計
 *
 * 使用場景：
 * - 定時任務（cron job）每小時執行一次
 * - 管理員手動觸發清理
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 配置：訂單超時時間（小時）
const ORDER_TIMEOUT_HOURS = 24;

export async function GET(request: NextRequest) {
  return handleCancelExpiredOrders(request);
}

export async function POST(request: NextRequest) {
  return handleCancelExpiredOrders(request);
}

async function handleCancelExpiredOrders(request: NextRequest) {
  try {
    // 簡單的安全驗證（可選）
    const authHeader = request.headers.get('authorization');
    const urlToken = request.nextUrl.searchParams.get('token');
    const expectedToken = process.env.CRON_SECRET || 'default-cron-secret';

    // 驗證 token（從 header 或 URL 參數）
    const providedToken = authHeader?.replace('Bearer ', '') || urlToken;
    if (providedToken !== expectedToken) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }

    // 計算超時時間點
    const timeoutDate = new Date();
    timeoutDate.setHours(timeoutDate.getHours() - ORDER_TIMEOUT_HOURS);

    console.log(`=== 開始清理超時訂單 ===`);
    console.log(`超時時間設定: ${ORDER_TIMEOUT_HOURS} 小時`);
    console.log(`清理基準時間: ${timeoutDate.toISOString()}`);

    // 查找需要取消的訂單
    const expiredOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          lt: timeoutDate,
        },
        paymentStatus: 'PENDING',
        status: {
          notIn: ['CANCELLED', 'COMPLETED', 'SHIPPED'],
        },
      },
      include: {
        items: true,
      },
    });

    console.log(`找到 ${expiredOrders.length} 筆超時未付款訂單`);

    // 統計信息
    const stats = {
      total: expiredOrders.length,
      deleted: 0,
      failed: 0,
      errors: [] as string[],
    };

    // 刪除每筆超時訂單
    for (const order of expiredOrders) {
      try {
        console.log(`處理訂單 ${order.orderNumber} (ID: ${order.id})`);

        // 刪除訂單項目
        await prisma.orderItem.deleteMany({
          where: { orderId: order.id },
        });

        // 刪除相關的支付記錄
        await prisma.payment.deleteMany({
          where: { orderId: order.id },
        });

        // 刪除訂單
        await prisma.order.delete({
          where: { id: order.id },
        });

        stats.deleted++;
        console.log(`✓ 已刪除訂單 ${order.orderNumber}`);
      } catch (error) {
        stats.failed++;
        const errorMsg = `刪除訂單 ${order.orderNumber} 失敗: ${error instanceof Error ? error.message : '未知錯誤'}`;
        stats.errors.push(errorMsg);
        console.error(`✗ ${errorMsg}`);
      }
    }

    console.log(`=== 清理完成 ===`);
    console.log(`總計: ${stats.total} 筆`);
    console.log(`成功: ${stats.deleted} 筆`);
    console.log(`失敗: ${stats.failed} 筆`);

    return NextResponse.json({
      success: true,
      message: `成功刪除 ${stats.deleted} 筆超時訂單`,
      stats,
      config: {
        timeoutHours: ORDER_TIMEOUT_HOURS,
        cutoffTime: timeoutDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('自動取消超時訂單失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: `處理失敗：${error instanceof Error ? error.message : '未知錯誤'}`,
      },
      { status: 500 }
    );
  }
}
