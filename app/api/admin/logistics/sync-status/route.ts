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
  mapRetIdToShippingStatus,
  mapRetIdToOrderStatus,
  getRetIdMessage,
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

    // 先查詢所有訂單狀態分佈（用於除錯）
    const allOrders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        shippingMethod: true,
        shippingStatus: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    console.log('=== 最近 20 筆訂單狀態 ===')
    allOrders.forEach(o => {
      console.log(`${o.orderNumber}: paymentStatus=${o.paymentStatus}, shippingMethod=${o.shippingMethod}, shippingStatus=${o.shippingStatus}, status=${o.status}`)
    })

    // 查詢所有需要同步的訂單
    // 條件：超商取貨 + 物流狀態不是 DELIVERED + 未取消
    // 注意：貨到付款訂單的 paymentStatus 會是 PENDING 直到客戶取貨
    const orders = await prisma.order.findMany({
      where: {
        shippingMethod: 'CVS_PICKUP', // 只查超商取貨
        shippingStatus: {
          in: ['PENDING', 'PROCESSING', 'SHIPPED'], // 排除已送達
        },
        status: {
          notIn: ['CANCELLED', 'REFUNDED'], // 排除已取消和已退款
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
      // 提供更多資訊幫助除錯
      const statusCounts = {
        total: allOrders.length,
        paid: allOrders.filter(o => o.paymentStatus === 'PAID').length,
        pending: allOrders.filter(o => o.paymentStatus === 'PENDING').length,
        cvsPickup: allOrders.filter(o => o.shippingMethod === 'CVS_PICKUP').length,
        selfPickup: allOrders.filter(o => o.shippingMethod === 'SELF_PICKUP').length,
        homeDelivery: allOrders.filter(o => o.shippingMethod === 'HOME_DELIVERY').length,
        delivered: allOrders.filter(o => o.shippingStatus === 'DELIVERED').length,
        shippingPending: allOrders.filter(o => o.shippingStatus === 'PENDING').length,
      }

      return NextResponse.json({
        success: true,
        message: `沒有找到需要同步的訂單。最近 ${statusCounts.total} 筆訂單中：已付款 ${statusCounts.paid} 筆、待付款 ${statusCounts.pending} 筆、超商取貨 ${statusCounts.cvsPickup} 筆、郵局/其他 ${statusCounts.selfPickup} 筆、宅配 ${statusCounts.homeDelivery} 筆、物流待處理 ${statusCounts.shippingPending} 筆、已送達 ${statusCounts.delivered} 筆`,
        syncedCount: 0,
        results: [],
        debug: statusCounts,
      })
    }

    // 分類訂單：超商取貨 vs 其他配送方式
    const cvsOrders = orders.filter(o => o.shippingMethod === 'CVS_PICKUP')
    const otherOrders = orders.filter(o => o.shippingMethod !== 'CVS_PICKUP')

    console.log(`超商取貨訂單: ${cvsOrders.length} 筆, 其他配送方式: ${otherOrders.length} 筆`)

    const results: Array<{
      orderNumber: string
      oldStatus: string
      newStatus: string
      lgsState: string
      lgsStateMessage: string
      shippingMethod: string
      success: boolean
      error?: string
    }> = []

    // 處理非超商取貨訂單（無法透過藍新 API 查詢）
    for (const order of otherOrders) {
      results.push({
        orderNumber: order.orderNumber,
        oldStatus: order.shippingStatus,
        newStatus: order.shippingStatus,
        lgsState: '',
        lgsStateMessage: '非超商取貨訂單，無法透過藍新 API 查詢，請手動更新狀態',
        shippingMethod: order.shippingMethod || '未知',
        success: false,
        error: '非超商取貨訂單',
      })
    }

    // 逐筆查詢超商取貨訂單
    for (const order of cvsOrders) {
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
            shippingMethod: order.shippingMethod || 'CVS_PICKUP',
            success: false,
            error: response.Message,
          })
          continue
        }

        // 解密回應資料
        let shipmentData: any = null

        // 藍新 queryShipment 回傳的是 EncryptData，不是 Result
        if (response.EncryptData) {
          try {
            shipmentData = decryptLogisticsData(response.EncryptData)
            console.log(`解密後資料 (${order.orderNumber}):`, JSON.stringify(shipmentData, null, 2))
          } catch (decryptErr) {
            console.error(`解密失敗 (${order.orderNumber}):`, decryptErr)
            shipmentData = null
          }
        } else if (response.Result) {
          shipmentData = typeof response.Result === 'string'
            ? JSON.parse(response.Result)
            : response.Result
          console.log(`Result 資料 (${order.orderNumber}):`, JSON.stringify(shipmentData, null, 2))
        }

        // queryShipment API 回傳 RetId，與即時通知的 LgsState 格式不同
        const retId = shipmentData?.RetId?.toString() || ''
        const retString = shipmentData?.RetString || ''
        const lgsNo = shipmentData?.LgsNo || shipmentData?.StorePrintNo || ''

        if (!retId) {
          results.push({
            orderNumber: order.orderNumber,
            oldStatus: order.shippingStatus,
            newStatus: order.shippingStatus,
            lgsState: '',
            lgsStateMessage: '無物流狀態資料',
            shippingMethod: order.shippingMethod || 'CVS_PICKUP',
            success: false,
            error: '無物流狀態資料',
          })
          continue
        }

        // 轉換狀態（使用 RetId 映射函數）
        const newShippingStatus = mapRetIdToShippingStatus(retId)
        const newOrderStatus = mapRetIdToOrderStatus(retId)
        // 優先使用藍新回傳的中文說明，否則使用我們的映射
        const lgsStateMessage = retString || getRetIdMessage(retId)

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

        // 根據 RetId 狀態更新時間
        // RetId '5' = 商品送達取貨門市（已出貨）
        // RetId '6' = 買家取貨完成（已送達）
        if (retId === '5' && !order.shippedAt) {
          updateData.shippedAt = new Date()
        } else if (retId === '6' && !order.deliveredAt) {
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
          lgsState: retId,  // 使用 RetId 作為狀態碼
          lgsStateMessage,
          shippingMethod: order.shippingMethod || 'CVS_PICKUP',
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
          lgsStateMessage: err.message,
          shippingMethod: order.shippingMethod || 'CVS_PICKUP',
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
