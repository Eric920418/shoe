/**
 * 列印物流標籤 API
 * POST /api/admin/logistics/print-label
 *
 * 支援超商取貨付款（CVSCOM）訂單
 * - 使用訂單中儲存的門市資訊（從 CustomerURL 回調取得）
 * - 支援貨到付款訂單（paymentStatus = PENDING）
 */

// 強制使用 Node.js runtime（需要 crypto 模組）
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { printLogisticsLabel, createShipment, getShipTypeByStoreName } from '@/lib/logistics'

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

    // 查詢訂單資料（包含用戶 email）
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
      },
      include: {
        payment: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    })

    if (orders.length === 0) {
      return NextResponse.json(
        { error: '找不到訂單' },
        { status: 404 }
      )
    }

    // 過濾出超商取貨訂單（支援 CVS_PICKUP 和舊的 SEVEN_ELEVEN）
    const cvsOrders = orders.filter(
      (order) => order.shippingMethod === 'CVS_PICKUP' || order.shippingMethod === 'SEVEN_ELEVEN'
    )

    if (cvsOrders.length === 0) {
      return NextResponse.json(
        { error: '只有超商取貨的訂單需要列印物流標籤' },
        { status: 400 }
      )
    }

    // 檢查訂單是否有門市資訊
    // 門市資訊儲存在：shippingCity = 門市名稱, shippingStreet = 門市地址, shippingZipCode = 門市代號
    const ordersWithoutStore = cvsOrders.filter(
      (order) => !order.shippingZipCode || !order.shippingCity
    )

    if (ordersWithoutStore.length > 0) {
      return NextResponse.json(
        {
          error: `以下訂單尚未選擇超商門市：${ordersWithoutStore.map((o) => o.orderNumber).join(', ')}`,
        },
        { status: 400 }
      )
    }

    console.log('=== 列印物流標籤 DEBUG ===')
    console.log('收到的 orderIds:', orderIds)
    console.log('查到的訂單數量:', orders.length)
    console.log('超商取貨訂單數量:', cvsOrders.length)
    console.log('物流類型: C2C (店到店)')

    // 處理每個訂單
    const results = []

    for (const order of cvsOrders) {
      console.log(`\n--- 處理訂單: ${order.orderNumber} ---`)
      console.log('門市代號:', order.shippingZipCode)
      console.log('門市名稱:', order.shippingCity)
      console.log('門市地址:', order.shippingStreet)

      // 取得 Payment 中的 merchantOrderNo（藍新金流使用的訂單編號）
      const merchantOrderNo = order.payment?.merchantOrderNo || order.orderNumber

      try {
        // 先建立物流單（如果已存在會回傳錯誤，但不影響後續列印）
        console.log('嘗試建立物流單...')
        console.log('使用的 merchantOrderNo:', merchantOrderNo)

        // 取得用戶 email（必填欄位）
        const userEmail = order.user?.email || 'noreply@example.com'
        console.log('取件人 email:', userEmail)

        await createShipment({
          merchantOrderNo: merchantOrderNo,
          userName: order.shippingName,              // 取件人姓名
          userTel: order.shippingPhone,              // 取件人手機號碼
          userEmail: userEmail,                      // 取件人電子信箱
          storeId: order.shippingZipCode!,           // 超商門市代碼
          amt: Number(order.total),                  // 訂單金額
          itemDesc: `訂單 ${order.orderNumber}`,     // 產品名稱說明（選填）
          storeName: order.shippingCity!,            // 門市名稱（用於判斷物流廠商）
        })
        console.log('✅ 物流單建立成功')
      } catch (createError: any) {
        // 如果物流單已存在，會回傳錯誤，但可以繼續列印
        console.log('建立物流單失敗（可能已存在）:', createError.message)
      }

      // 根據門市名稱判斷物流廠商
      const shipType = getShipTypeByStoreName(order.shippingCity || '')
      console.log(`訂單 ${order.orderNumber} 物流廠商判斷：${order.shippingCity} → ShipType=${shipType}`)

      results.push({
        orderId: order.id,
        orderNumber: order.orderNumber,
        merchantOrderNo: merchantOrderNo,
        storeName: order.shippingCity,
        storeId: order.shippingZipCode,
        shipType: shipType,
      })
    }

    // 按物流廠商分組（藍新要求同一批列印必須是同一個物流商）
    const ordersByShipType: Record<string, typeof results> = {}
    for (const r of results) {
      const shipType = r.shipType
      if (!ordersByShipType[shipType]) {
        ordersByShipType[shipType] = []
      }
      ordersByShipType[shipType].push(r)
    }

    console.log('\n按物流廠商分組:', Object.keys(ordersByShipType).map(k => `${k}=${ordersByShipType[k].length}筆`).join(', '))

    // 如果有多個物流廠商，目前只能一次列印一種
    const shipTypes = Object.keys(ordersByShipType) as ('1' | '2' | '3' | '4')[]
    if (shipTypes.length > 1) {
      return NextResponse.json(
        { error: `選取的訂單包含多個物流廠商，請分開列印。目前選取：${shipTypes.map(t => ({ '1': '7-ELEVEN', '2': '全家', '3': '萊爾富', '4': 'OK' }[t])).join('、')}` },
        { status: 400 }
      )
    }

    const shipType = shipTypes[0]
    const merchantOrderNos = results.map((r) => r.merchantOrderNo)
    console.log('\n呼叫 printLogisticsLabel，訂單編號:', merchantOrderNos, 'ShipType:', shipType)

    const result = await printLogisticsLabel(merchantOrderNos, shipType)

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
        shippingStatus: 'PROCESSING',
      },
    })

    return NextResponse.json({
      success: true,
      message: printUrl ? '已生成物流標籤列印頁面' : '列印標籤請求已發送',
      data: result,
      printUrl,
      orders: results,
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
