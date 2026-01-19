/**
 * 批量同步物流狀態 API
 *
 * POST /api/admin/logistics/sync-status
 *
 * 功能：
 * 1. 查詢所有已付款但物流狀態為 PENDING 的超商取貨訂單
 * 2. 向藍新物流 API 查詢每筆訂單的物流狀態
 * 3. 更新訂單的 shippingStatus、status、shippedAt、deliveredAt
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import {
  queryShipment,
  mapLgsStateToShippingStatus,
  mapLgsStateToOrderStatus,
  getLgsStateMessage,
  decryptLogisticsData,
} from '@/lib/logistics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  console.log('=== 開始批量同步物流狀態 ===')

  try {
    // 驗證管理員權限
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: '未授權，請先登入' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: '權限不足' }, { status: 403 })
    }

    // 查詢所有需要同步的訂單
    // 條件：已付款 + 超商取貨 + 物流狀態不是 DELIVERED
    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
        shippingMethod: 'CVS_PICKUP',
        shippingStatus: {
          not: 'DELIVERED',
        },
      },
      include: {
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // 限制一次最多處理 50 筆，避免 API 過載
    })

    console.log(`找到 ${orders.length} 筆需要同步的訂單`)

    if (orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: '沒有需要同步的訂單',
        syncedCount: 0,
        results: [],
      })
    }

    const results: Array<{
      orderNumber: string
      oldStatus: string
      newStatus: string
      lgsState: string
      lgsStateMessage: string
      success: boolean
      error?: string
    }> = []

    // 逐筆查詢並更新
    for (const order of orders) {
      const merchantOrderNo = order.payment?.merchantOrderNo || order.orderNumber

      try {
        console.log(`查詢訂單 ${order.orderNumber} (${merchantOrderNo})`)

        // 向藍新查詢物流狀態
        const response = await queryShipment(merchantOrderNo)

        console.log(`藍新回應:`, JSON.stringify(response, null, 2))

        // 檢查回應狀態
        if (response.Status !== 'SUCCESS') {
          results.push({
            orderNumber: order.orderNumber,
            oldStatus: order.shippingStatus,
            newStatus: order.shippingStatus,
            lgsState: '',
            lgsStateMessage: response.Message || '查詢失敗',
            success: false,
            error: response.Message,
          })
          continue
        }

        // 解密回應資料
        let shipmentData: any = response.Result
        if (typeof response.Result === 'string') {
          try {
            shipmentData = decryptLogisticsData(response.Result)
          } catch {
            shipmentData = response.Result
          }
        }

        const lgsState = shipmentData?.LgsState?.toString() || ''
        const shipType = shipmentData?.ShipType?.toString() || '1'
        const lgsNo = shipmentData?.LgsNo || ''

        if (!lgsState) {
          results.push({
            orderNumber: order.orderNumber,
            oldStatus: order.shippingStatus,
            newStatus: order.shippingStatus,
            lgsState: '',
            lgsStateMessage: '無物流狀態資料',
            success: false,
            error: '無物流狀態資料',
          })
          continue
        }

        // 轉換狀態
        const newShippingStatus = mapLgsStateToShippingStatus(lgsState, shipType)
        const newOrderStatus = mapLgsStateToOrderStatus(lgsState)
        const lgsStateMessage = getLgsStateMessage(lgsState, shipType)

        // 準備更新資料
        const updateData: any = {
          shippingStatus: newShippingStatus,
        }

        if (newOrderStatus) {
          updateData.status = newOrderStatus
        }

        if (lgsNo) {
          updateData.trackingNumber = lgsNo
        }

        // 根據狀態更新時間
        if (lgsState === '3' && !order.shippedAt) {
          updateData.shippedAt = new Date()
        } else if (lgsState === '5' && !order.deliveredAt) {
          updateData.deliveredAt = new Date()
        }

        // 更新門市資訊
        if (shipmentData?.StoreName && !order.shippingCity) {
          updateData.shippingCity = shipmentData.StoreName
        }
        if (shipmentData?.StoreAddr && !order.shippingStreet) {
          updateData.shippingStreet = shipmentData.StoreAddr
        }
        if (shipmentData?.StoreID && !order.shippingZipCode) {
          updateData.shippingZipCode = shipmentData.StoreID
        }

        // 只有狀態有變化才更新
        if (newShippingStatus !== order.shippingStatus) {
          await prisma.order.update({
            where: { id: order.id },
            data: updateData,
          })

          console.log(`✅ 訂單 ${order.orderNumber} 狀態已更新: ${order.shippingStatus} → ${newShippingStatus}`)
        }

        results.push({
          orderNumber: order.orderNumber,
          oldStatus: order.shippingStatus,
          newStatus: newShippingStatus,
          lgsState,
          lgsStateMessage,
          success: true,
        })

        // 避免 API 請求過於頻繁
        await new Promise(resolve => setTimeout(resolve, 300))

      } catch (err: any) {
        console.error(`查詢訂單 ${order.orderNumber} 失敗:`, err)
        results.push({
          orderNumber: order.orderNumber,
          oldStatus: order.shippingStatus,
          newStatus: order.shippingStatus,
          lgsState: '',
          lgsStateMessage: '',
          success: false,
          error: err.message,
        })
      }
    }

    const syncedCount = results.filter(r => r.success && r.oldStatus !== r.newStatus).length
    const unchangedCount = results.filter(r => r.success && r.oldStatus === r.newStatus).length
    const failedCount = results.filter(r => !r.success).length

    console.log(`=== 同步完成 ===`)
    console.log(`更新: ${syncedCount}, 無變化: ${unchangedCount}, 失敗: ${failedCount}`)

    return NextResponse.json({
      success: true,
      message: `同步完成！更新 ${syncedCount} 筆，無變化 ${unchangedCount} 筆，失敗 ${failedCount} 筆`,
      syncedCount,
      unchangedCount,
      failedCount,
      results,
    })

  } catch (error: any) {
    console.error('批量同步物流狀態失敗:', error)
    return NextResponse.json(
      { error: `同步失敗: ${error.message}` },
      { status: 500 }
    )
  }
}
