/**
 * 取得寄件代碼 API
 * POST /api/admin/logistics/get-shipment-no
 *
 * 讓管理員取得寄件代碼，到超商機台（ibon、FamiPort 等）輸入印出標籤
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getShipmentNo } from '@/lib/logistics'

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
        { error: '權限不足，僅管理員可以取得寄件代碼' },
        { status: 403 }
      )
    }

    // 取得請求參數
    const body = await request.json()
    const { orderIds } = body

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: '請提供訂單 ID' },
        { status: 400 }
      )
    }

    if (orderIds.length > 10) {
      return NextResponse.json(
        { error: '一次最多只能查詢 10 筆訂單' },
        { status: 400 }
      )
    }

    // 查詢訂單資料
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
      },
      include: {
        payment: true,
      },
    })

    if (orders.length === 0) {
      return NextResponse.json(
        { error: '找不到訂單' },
        { status: 404 }
      )
    }

    // 過濾出超商取貨訂單
    const cvsOrders = orders.filter(
      (order) => order.shippingMethod === 'CVS_PICKUP' || order.shippingMethod === 'SEVEN_ELEVEN'
    )

    if (cvsOrders.length === 0) {
      return NextResponse.json(
        { error: '只有超商取貨的訂單可以取得寄件代碼' },
        { status: 400 }
      )
    }

    console.log('=== 取得寄件代碼 DEBUG ===')
    console.log('收到的 orderIds:', orderIds)
    console.log('超商取貨訂單數量:', cvsOrders.length)

    // 取得 merchantOrderNo 列表
    const merchantOrderNos = cvsOrders.map(
      (order) => order.payment?.merchantOrderNo || order.orderNumber
    )

    console.log('查詢的 merchantOrderNos:', merchantOrderNos)

    // 呼叫藍新 API 取得寄件代碼
    const result = await getShipmentNo(merchantOrderNos)

    // 整理回傳結果
    const shipmentCodes = result.Results?.map((item) => {
      const order = cvsOrders.find(
        (o) => (o.payment?.merchantOrderNo || o.orderNumber) === item.MerchantOrderNo
      )
      return {
        orderId: order?.id,
        orderNumber: order?.orderNumber,
        merchantOrderNo: item.MerchantOrderNo,
        shipmentNo: item.ShipmentNo,  // 寄件代碼
        shipType: item.ShipType,
        shipTypeName: {
          '1': '7-ELEVEN (ibon)',
          '2': '全家 (FamiPort)',
          '3': '萊爾富 (Life-ET)',
          '4': 'OK (OK·go)',
        }[item.ShipType] || '未知',
        storeName: order?.shippingCity,
      }
    }) || []

    return NextResponse.json({
      success: true,
      message: '成功取得寄件代碼',
      data: shipmentCodes,
      instructions: [
        '1. 帶著包裹前往對應的超商',
        '2. 在機台上選擇「寄件服務」或「交貨便」',
        '3. 輸入上方的寄件代碼',
        '4. 機台會印出小白單',
        '5. 拿小白單到櫃台，店員會印出標籤貼紙',
      ],
    })
  } catch (error: any) {
    console.error('取得寄件代碼失敗:', error)

    return NextResponse.json(
      {
        error: error.message || '取得寄件代碼失敗，請稍後再試',
        code: 'LOGISTICS_API_ERROR',
      },
      { status: 500 }
    )
  }
}
