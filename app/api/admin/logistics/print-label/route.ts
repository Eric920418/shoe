/**
 * 列印物流標籤 API
 * POST /api/admin/logistics/print-label
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { printLogisticsLabel } from '@/lib/logistics'

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
        { error: '權限不足，僅管理員可以列印物流標籤' },
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

    // 檢查訂單是否已付款
    const unpaidOrders = orders.filter((order) => order.paymentStatus !== 'PAID')
    if (unpaidOrders.length > 0) {
      return NextResponse.json(
        {
          error: `以下訂單尚未付款，無法列印標籤：${unpaidOrders.map((o) => o.orderNumber).join(', ')}`,
        },
        { status: 400 }
      )
    }

    // 只處理 7-11 取貨的訂單
    const sevenElevenOrders = orders.filter((order) => order.shippingMethod === 'SEVEN_ELEVEN')
    if (sevenElevenOrders.length === 0) {
      return NextResponse.json(
        {
          error: '只有 7-11 取貨的訂單需要列印物流標籤',
        },
        { status: 400 }
      )
    }

    // 取得訂單編號
    const orderNumbers = sevenElevenOrders.map((order) => order.orderNumber)

    console.log('=== 列印物流標籤 DEBUG ===')
    console.log('收到的 orderIds:', orderIds)
    console.log('查到的訂單數量:', orders.length)
    console.log('訂單編號:', orderNumbers)
    console.log('物流類型: C2C (店到店)')
    console.log('========================')

    // ⚠️ C2C 店到店需要先建立物流單（提供測試用的超商資訊）
    // 在列印前先嘗試建立物流單（如果已存在會回傳錯誤，但不影響列印）
    const order = sevenElevenOrders[0]

    try {
      console.log('嘗試建立物流單...')
      const { createShipment } = await import('@/lib/logistics')

      // 測試用超商資訊（實際應該由客戶選擇）
      await createShipment({
        merchantOrderNo: order.orderNumber,
        receiverName: order.shippingName,
        receiverPhone: order.shippingPhone,
        receiverStoreId: '991182', // 測試用：7-ELEVEN 門市代號
        receiverStoreName: '測試門市',
        goodsName: `訂單 ${order.orderNumber}`,
        goodsAmount: Number(order.total),
        senderName: '鞋店',
        senderPhone: '0912345678',
      })
      console.log('✅ 物流單建立成功')
    } catch (createError: any) {
      // 如果物流單已存在，會回傳錯誤，但可以繼續列印
      console.log('建立物流單失敗（可能已存在）:', createError.message)
    }

    // 呼叫物流 API 列印標籤
    const result = await printLogisticsLabel(orderNumbers)

    // 提取列印網址（藍新會回傳 PrintUrl）
    const printUrl =
      result.PrintUrl ||
      (Array.isArray(result.Results) && result.Results[0]?.PrintUrl) ||
      null

    console.log('提取到的列印網址:', printUrl)

    // 更新訂單物流狀態
    await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
      },
      data: {
        shippingStatus: 'PROCESSING', // 不需要更新 shippingMethod，已經是 SEVEN_ELEVEN
      },
    })

    return NextResponse.json({
      success: true,
      message: printUrl ? '已生成物流標籤列印頁面' : '列印標籤請求已發送',
      data: result,
      printUrl, // 提供給前端用來開啟列印頁面
      orderNumbers,
    })
  } catch (error: any) {
    console.error('列印物流標籤失敗:', error)

    // 特別處理「查無合作商店」錯誤
    let errorMessage = error.message || '列印物流標籤失敗，請稍後再試'
    let helpText = ''

    if (error.message && error.message.includes('查無合作商店')) {
      helpText = `

⚠️ 可能的原因：
1. 藍新金流物流服務尚未開通（需向藍新金流申請）
2. 物流服務的商店代號與金流不同（需確認 NEWEBPAY_LOGISTICS_MERCHANT_ID）
3. 物流服務的 HashKey/HashIV 與金流不同（需設定 NEWEBPAY_LOGISTICS_HASH_KEY 和 NEWEBPAY_LOGISTICS_HASH_IV）
4. 目前使用的是測試環境憑證，但 API 指向正式環境（或相反）

🔧 解決方式：
1. 聯絡藍新金流客服，確認物流服務是否已開通
2. 索取物流服務專用的商店代號、HashKey 和 HashIV
3. 在 .env 檔案中設定正確的物流 API 憑證
`
    }

    return NextResponse.json(
      {
        error: errorMessage + helpText,
        details: error.toString(),
        code: 'LOGISTICS_API_ERROR',
      },
      { status: 500 }
    )
  }
}
