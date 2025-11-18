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

    // 取得訂單編號
    const orderNumbers = orders.map((order) => order.orderNumber)

    console.log('=== 列印物流標籤 DEBUG ===')
    console.log('收到的 orderIds:', orderIds)
    console.log('查到的訂單數量:', orders.length)
    console.log('訂單編號:', orderNumbers)
    console.log('物流類型: B2C (大宗寄倉), 7-ELEVEN (1)')
    console.log('========================')

    // 呼叫物流 API 列印標籤
    // ⚠️ 目前硬指定為 B2C + 7-ELEVEN，待驗證成功後再改成從訂單讀取
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
        shippingMethod: 'SEVEN_B2C', // 7-ELEVEN 大宗寄倉
        shippingStatus: 'PROCESSING',
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
