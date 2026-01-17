/**
 * 藍新物流 - 貨態更新即時通知 API
 *
 * POST /api/newebpay/logistics-notify
 *
 * 功能：
 * 1. 接收藍新物流的貨態更新通知
 * 2. 驗證並解密回傳資料
 * 3. 更新訂單的物流狀態 (shippingStatus)
 * 4. 更新訂單狀態 (status)
 * 5. 記錄出貨時間 (shippedAt) 和送達時間 (deliveredAt)
 *
 * 藍新物流狀態代碼 (LgsState):
 *   0: 建單成功
 *   3: 配送中/已寄件
 *   4: 到店
 *   5: 已取件/取件完成
 *   6: 退回原寄 (7-ELEVEN)
 *   9: 異常/被退回
 *
 * 注意：
 * - 這個端點會被藍新物流伺服器呼叫
 * - 必須返回 200 狀態碼，否則藍新會重複發送通知
 * - 需要在藍新後台設定「物流貨態更新即時通知URL」為此端點
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  decryptLogisticsData,
  verifyLogisticsHash,
  mapLgsStateToShippingStatus,
  mapLgsStateToOrderStatus,
  getLgsStateMessage,
} from '@/lib/logistics'
import { sendOrderShippingNotification } from '@/lib/notification'

// ============================================
// Route Config
// ============================================
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================
// 型別定義
// ============================================
interface LogisticsNotifyData {
  MerchantID?: string
  MerchantOrderNo: string
  LgsNo?: string           // 藍新物流單號
  ShipType: string         // 物流廠商：1=統一, 2=全家, 4=OK
  LgsType?: string         // 物流類型：C2C
  TradeType?: string       // 取貨類別：1=取貨付款, 3=取貨不付款
  LgsState: string         // 物流狀態代碼
  CloseState?: string      // 結案狀態
  StoreName?: string       // 門市名稱
  StoreAddr?: string       // 門市地址
  StoreID?: string         // 門市代號
  ReceiverName?: string    // 收件人姓名
  ReceiverPhone?: string   // 收件人電話
  Amt?: string             // 金額
  TimeStamp?: string       // 時間戳記
}

// ============================================
// GET /api/newebpay/logistics-notify (健康檢查)
// ============================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '藍新物流貨態即時通知 API',
    method: 'POST',
    description: '此端點接收藍新物流的貨態更新通知，請在藍新後台設定「物流貨態更新即時通知URL」指向此端點',
  })
}

// ============================================
// POST /api/newebpay/logistics-notify
// ============================================

export async function POST(request: NextRequest) {
  console.log('=== 藍新物流貨態通知請求開始 ===')
  console.log('請求時間:', new Date().toISOString())
  console.log('來源 IP:', request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown')

  try {
    // 解析請求資料
    let encryptData: string | null = null
    let hashData: string | null = null

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/x-www-form-urlencoded')) {
      try {
        const formData = await request.formData()
        encryptData = formData.get('EncryptData_') as string
        hashData = formData.get('HashData_') as string
        console.log('使用 formData() 解析成功')
      } catch (error) {
        console.error('formData() 解析失敗:', error)
        const bodyText = await request.text()
        console.log('原始請求體 (前300字):', bodyText.substring(0, 300))

        const params = new URLSearchParams(bodyText)
        encryptData = params.get('EncryptData_')
        hashData = params.get('HashData_')
      }
    } else {
      const bodyText = await request.text()
      console.log('原始請求體 (前300字):', bodyText.substring(0, 300))

      const params = new URLSearchParams(bodyText)
      encryptData = params.get('EncryptData_')
      hashData = params.get('HashData_')
    }

    console.log('=== 解析後的物流通知資料 ===')
    console.log('EncryptData_ 長度:', encryptData?.length || 0)
    console.log('HashData_ 長度:', hashData?.length || 0)

    // 驗證必要參數
    if (!encryptData || !hashData) {
      console.error('❌ 物流通知缺少必要參數')
      // 即使缺參數也要回 200 避免重送
      return NextResponse.json(
        { success: false, error: '缺少必要參數 EncryptData_ 或 HashData_' },
        { status: 200 }
      )
    }

    // 驗證 Hash（防止資料被竄改）
    if (!verifyLogisticsHash(encryptData, hashData)) {
      console.error('❌ 物流通知 Hash 驗證失敗')
      return NextResponse.json(
        { success: false, error: 'Hash 驗證失敗' },
        { status: 200 }
      )
    }

    console.log('✅ Hash 驗證通過')

    // 解密資料
    let decryptedData: LogisticsNotifyData
    try {
      decryptedData = decryptLogisticsData(encryptData) as LogisticsNotifyData
      console.log('✅ 解密成功')
      console.log('=== 物流通知解密後資料 ===')
      console.log(JSON.stringify(decryptedData, null, 2))
    } catch (decryptError) {
      console.error('❌ 解密失敗:', decryptError)
      return NextResponse.json(
        { success: false, error: '解密失敗' },
        { status: 200 }
      )
    }

    // 提取關鍵欄位
    const {
      MerchantOrderNo,
      LgsNo,
      ShipType,
      LgsState,
      CloseState,
      StoreName,
      StoreAddr,
      StoreID,
    } = decryptedData

    if (!MerchantOrderNo || !LgsState) {
      console.error('❌ 缺少關鍵欄位 MerchantOrderNo 或 LgsState')
      return NextResponse.json(
        { success: false, error: '缺少關鍵欄位' },
        { status: 200 }
      )
    }

    console.log('=== 物流狀態資訊 ===')
    console.log('商店訂單編號:', MerchantOrderNo)
    console.log('藍新物流單號:', LgsNo)
    console.log('物流廠商 (ShipType):', ShipType, ShipType === '1' ? '(統一)' : ShipType === '2' ? '(全家)' : ShipType === '4' ? '(OK)' : '')
    console.log('物流狀態 (LgsState):', LgsState, '-', getLgsStateMessage(LgsState, ShipType))
    console.log('結案狀態 (CloseState):', CloseState)

    // 查找對應的訂單
    // 1. 先透過 Payment 的 merchantOrderNo 找
    let order = await prisma.order.findFirst({
      where: {
        payment: {
          merchantOrderNo: MerchantOrderNo,
        },
      },
      include: {
        payment: true,
        user: {
          select: {
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // 2. 如果找不到，嘗試用 orderNumber 匹配
    if (!order) {
      order = await prisma.order.findFirst({
        where: {
          orderNumber: MerchantOrderNo,
        },
        include: {
          payment: true,
          user: {
            select: {
              email: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      })
    }

    if (!order) {
      console.error(`❌ 找不到訂單: ${MerchantOrderNo}`)
      // 仍然回傳 200，避免藍新重複發送
      return NextResponse.json(
        { success: false, error: `找不到訂單: ${MerchantOrderNo}` },
        { status: 200 }
      )
    }

    console.log(`✅ 找到訂單: ${order.orderNumber} (ID: ${order.id})`)
    console.log('當前訂單狀態:', order.status)
    console.log('當前物流狀態:', order.shippingStatus)

    // 轉換狀態
    const newShippingStatus = mapLgsStateToShippingStatus(LgsState, ShipType)
    const newOrderStatus = mapLgsStateToOrderStatus(LgsState)

    console.log('=== 狀態轉換 ===')
    console.log('新物流狀態:', newShippingStatus)
    console.log('新訂單狀態:', newOrderStatus)

    // 準備更新資料
    const updateData: any = {
      shippingStatus: newShippingStatus,
      updatedAt: new Date(),
    }

    // 更新訂單狀態（如果有對應）
    if (newOrderStatus) {
      updateData.status = newOrderStatus
    }

    // 更新物流單號
    if (LgsNo) {
      updateData.trackingNumber = LgsNo
    }

    // 根據物流狀態更新時間欄位
    if (LgsState === '3') {
      // 已寄件 - 記錄出貨時間
      if (!order.shippedAt) {
        updateData.shippedAt = new Date()
      }
    } else if (LgsState === '5') {
      // 已取件 - 記錄送達時間
      if (!order.deliveredAt) {
        updateData.deliveredAt = new Date()
      }
    }

    // 更新門市資訊（如果有新資訊）
    if (StoreName && !order.shippingCity) {
      updateData.shippingCity = StoreName
    }
    if (StoreAddr && !order.shippingStreet) {
      updateData.shippingStreet = StoreAddr
    }
    if (StoreID && !order.shippingZipCode) {
      updateData.shippingZipCode = StoreID
    }

    // 執行更新
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    })

    console.log('✅ 訂單更新成功')
    console.log('更新後訂單狀態:', updatedOrder.status)
    console.log('更新後物流狀態:', updatedOrder.shippingStatus)

    // 發送物流狀態通知給客戶
    try {
      const customerEmail = order.user?.email || order.guestEmail
      const statusMessage = getLgsStateMessage(LgsState, ShipType)

      // 如果是重要狀態變更（到店、已取件），發送通知
      if ((LgsState === '4' || LgsState === '5') && customerEmail) {
        await sendOrderShippingNotification(customerEmail, {
          orderNumber: order.orderNumber,
          shippingStatus: statusMessage,
          trackingNumber: LgsNo || order.trackingNumber || undefined,
          storeName: StoreName || order.shippingCity || undefined,
          storeAddr: StoreAddr || order.shippingStreet || undefined,
          items: order.items.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
          })),
        })
        console.log(`📧 物流狀態通知已發送至: ${customerEmail}`)
      }
    } catch (notifyError) {
      // 通知發送失敗不影響主流程
      console.error('發送物流通知失敗:', notifyError)
    }

    // 如果訂單完成（取件完成），處理會員升級和購物金回饋
    if (newOrderStatus === 'COMPLETED' && order.userId) {
      try {
        console.log('🎉 訂單完成，處理會員回饋...')

        // 這裡可以觸發會員升級和購物金回饋邏輯
        // 由於這些邏輯可能已經在 orderResolvers 的 updateOrderStatus 中實作
        // 這裡僅記錄日誌，避免重複處理
        // 如果需要，可以呼叫共用的處理函數

        console.log(`✅ 訂單 ${order.orderNumber} 已完成`)
      } catch (rewardError) {
        console.error('處理會員回饋失敗:', rewardError)
      }
    }

    // 返回成功
    return NextResponse.json(
      {
        success: true,
        message: '物流狀態更新成功',
        orderNumber: order.orderNumber,
        newShippingStatus,
        newOrderStatus,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('處理物流通知失敗:', error)
    // 即使發生錯誤也返回 200，避免藍新重複發送
    return NextResponse.json(
      {
        success: false,
        error: `處理物流通知失敗：${error instanceof Error ? error.message : '未知錯誤'}`,
      },
      { status: 200 }
    )
  }
}
