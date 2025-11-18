/**
 * 查詢物流配送單 API
 * POST /api/admin/logistics/query-shipment
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { queryShipment } from '@/lib/logistics'

export async function POST(request: NextRequest) {
  try {
    // 驗證管理員權限
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: '未授權，請先登入' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '權限不足，僅管理員可以查詢物流資訊' },
        { status: 403 }
      )
    }

    // 取得請求參數
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: '請提供訂單 ID' },
        { status: 400 }
      )
    }

    // 查詢訂單資料
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json(
        { error: '找不到訂單' },
        { status: 404 }
      )
    }

    console.log('=== 查詢物流資訊 DEBUG ===')
    console.log('訂單 ID:', orderId)
    console.log('訂單編號:', order.orderNumber)
    console.log('========================')

    // 呼叫物流 API 查詢配送單
    const result = await queryShipment(order.orderNumber)

    console.log('查詢結果:', result)

    // 解析物流資訊（藍新會回傳加密資料）
    let logisticsInfo = null
    if (result.Status === 'SUCCESS' && result.Data) {
      logisticsInfo = result.Data
    }

    return NextResponse.json({
      success: true,
      message: '查詢成功',
      data: logisticsInfo,
      orderNumber: order.orderNumber,
    })
  } catch (error: any) {
    console.error('查詢物流資訊失敗:', error)

    return NextResponse.json(
      {
        error: error.message || '查詢物流資訊失敗，請稍後再試',
        details: error.toString(),
        code: 'LOGISTICS_QUERY_ERROR',
      },
      { status: 500 }
    )
  }
}
