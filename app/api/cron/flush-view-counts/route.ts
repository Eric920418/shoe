/**
 * Cron API：批次寫回緩衝的瀏覽次數到資料庫
 *
 * 使用方式：
 * 1. 本地開發：手動調用 GET /api/cron/flush-view-counts
 * 2. 生產環境：配置 cron job（例如每 5 分鐘執行一次）
 *
 * Vercel cron 配置範例（vercel.json）：
 * {
 *   "crons": [{
 *     "path": "/api/cron/flush-view-counts",
 *     "schedule": "0,5,10,15,20,25,30,35,40,45,50,55 * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { flushViewCounts } from '@/lib/redis'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // ✅ 安全檢查：僅允許來自 Vercel Cron 的請求（生產環境）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // 如果設定了 CRON_SECRET，必須驗證
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: '未授權的請求' },
        { status: 401 }
      )
    }

    // 批次寫回瀏覽次數
    const updatedCount = await flushViewCounts(prisma)

    return NextResponse.json({
      success: true,
      message: `成功寫回 ${updatedCount} 個產品的瀏覽次數`,
      updatedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('批次寫回瀏覽次數失敗:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// 支援 POST 方法（某些 cron 服務使用 POST）
export async function POST(request: NextRequest) {
  return GET(request)
}
