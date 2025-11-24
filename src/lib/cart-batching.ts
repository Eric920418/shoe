/**
 * 購物車智能分單服務
 * 處理7-11超商取貨的包裝限制和自動分單建議
 */

import { PrismaClient, CartItem, Product, PackagingVolume } from '@prisma/client'

// 包裝體積數值（用於計算）
const PACKAGING_VOLUME_VALUES: Record<PackagingVolume, number> = {
  SMALL: 1,
  STANDARD: 2,
  LARGE: 3,
  OVERSIZED: 4,
}

// 7-11超商取貨的最大總體積限制
const MAX_711_VOLUME = 6 // 相當於3雙標準鞋或2雙大型鞋

export interface CartBatch {
  batchNumber: number
  items: Array<CartItem & { product: Product }>
  totalQuantity: number
  totalVolume: number
  estimatedBoxCount: number
  canShipTogether: boolean
  shippingFee: number
  notes: string[]
}

export interface CartBatchingAnalysis {
  totalItems: number
  totalVolume: number
  requiresBatching: boolean
  canCombinePackaging: boolean
  batches: CartBatch[]
  suggestedPackagingOption: 'STANDARD' | 'COMBINED' | 'SEPARATE'
  estimatedShippingFee: number
  warnings: string[]
  suggestions: string[]
}

/**
 * 分析購物車並生成智能分單建議
 */
export async function analyzeCartForBatching(
  prisma: PrismaClient,
  userId: string
): Promise<CartBatchingAnalysis> {
  // 獲取購物車項目及其產品資訊
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: 'asc' },
  })

  if (cartItems.length === 0) {
    return {
      totalItems: 0,
      totalVolume: 0,
      requiresBatching: false,
      canCombinePackaging: true,
      batches: [],
      suggestedPackagingOption: 'STANDARD',
      estimatedShippingFee: 0,
      warnings: [],
      suggestions: [],
    }
  }

  const warnings: string[] = []
  const suggestions: string[] = []
  let totalItems = 0
  let totalVolume = 0
  const batches: CartBatch[] = []

  // 計算每個商品的總體積和數量
  const itemsWithVolume = cartItems.map((item) => {
    const volumeValue = PACKAGING_VOLUME_VALUES[item.product.packagingVolume]
    const itemTotalVolume = volumeValue * item.quantity
    totalItems += item.quantity
    totalVolume += itemTotalVolume

    // 檢查單個商品是否超過限制
    if (item.quantity > item.product.maxQuantityPerOrder) {
      warnings.push(
        `"${item.product.name}" 超過單筆訂單限制 (目前：${item.quantity}，限制：${item.product.maxQuantityPerOrder})`
      )
    }

    return {
      item,
      unitVolume: volumeValue,
      totalVolume: itemTotalVolume,
      canCombine: item.product.canCombinePackaging,
    }
  })

  // 判斷是否需要分批
  const requiresBatching = totalVolume > MAX_711_VOLUME

  // 檢查所有商品是否都允許合併包裝
  const allCanCombine = itemsWithVolume.every((item) => item.canCombine)

  // 決定建議的包裝方式
  let suggestedPackagingOption: 'STANDARD' | 'COMBINED' | 'SEPARATE' = 'STANDARD'
  if (allCanCombine && totalVolume <= MAX_711_VOLUME) {
    suggestedPackagingOption = 'COMBINED'
    suggestions.push('建議選擇合併包裝，可以減少包裝盒數量和運費')
  }

  // 智能分批算法
  if (requiresBatching) {
    suggestions.push('由於商品總量超過7-11超商取貨限制，建議分批下單')

    let currentBatch: CartBatch = createNewBatch(1)
    let batchNumber = 1

    // 先處理不能合併的商品
    const nonCombinableItems = itemsWithVolume.filter((item) => !item.canCombine)
    const combinableItems = itemsWithVolume.filter((item) => item.canCombine)

    // 分配不能合併的商品
    for (const itemData of nonCombinableItems) {
      const { item, unitVolume, totalVolume } = itemData

      // 如果單個商品就超過限制，需要拆分數量
      if (totalVolume > MAX_711_VOLUME) {
        const maxQuantityPerBatch = Math.floor(MAX_711_VOLUME / unitVolume)
        let remainingQuantity = item.quantity

        while (remainingQuantity > 0) {
          const quantityInBatch = Math.min(remainingQuantity, maxQuantityPerBatch)
          const batchVolume = quantityInBatch * unitVolume

          if (currentBatch.totalVolume + batchVolume > MAX_711_VOLUME && currentBatch.items.length > 0) {
            batches.push(currentBatch)
            batchNumber++
            currentBatch = createNewBatch(batchNumber)
          }

          // 創建一個分批的項目副本
          const batchItem = { ...item, quantity: quantityInBatch }
          currentBatch.items.push(batchItem)
          currentBatch.totalQuantity += quantityInBatch
          currentBatch.totalVolume += batchVolume

          remainingQuantity -= quantityInBatch

          if (currentBatch.totalVolume >= MAX_711_VOLUME) {
            batches.push(currentBatch)
            batchNumber++
            currentBatch = createNewBatch(batchNumber)
          }
        }
      } else {
        // 正常添加到批次
        if (currentBatch.totalVolume + totalVolume > MAX_711_VOLUME && currentBatch.items.length > 0) {
          batches.push(currentBatch)
          batchNumber++
          currentBatch = createNewBatch(batchNumber)
        }

        currentBatch.items.push(item)
        currentBatch.totalQuantity += item.quantity
        currentBatch.totalVolume += totalVolume
      }
    }

    // 分配可以合併的商品（使用更優化的算法）
    for (const itemData of combinableItems) {
      const { item, unitVolume, totalVolume } = itemData

      // 嘗試找到最適合的批次
      let bestBatch = currentBatch
      let bestFit = MAX_711_VOLUME - currentBatch.totalVolume - totalVolume

      for (const batch of batches) {
        const fit = MAX_711_VOLUME - batch.totalVolume - totalVolume
        if (fit >= 0 && fit < bestFit) {
          bestBatch = batch
          bestFit = fit
        }
      }

      if (bestFit >= 0) {
        // 可以放入現有批次
        if (bestBatch === currentBatch) {
          currentBatch.items.push(item)
          currentBatch.totalQuantity += item.quantity
          currentBatch.totalVolume += totalVolume
        } else {
          bestBatch.items.push(item)
          bestBatch.totalQuantity += item.quantity
          bestBatch.totalVolume += totalVolume
        }
      } else {
        // 需要新批次
        if (currentBatch.items.length > 0) {
          batches.push(currentBatch)
          batchNumber++
          currentBatch = createNewBatch(batchNumber)
        }
        currentBatch.items.push(item)
        currentBatch.totalQuantity += item.quantity
        currentBatch.totalVolume += totalVolume
      }
    }

    // 添加最後一個批次
    if (currentBatch.items.length > 0) {
      batches.push(currentBatch)
    }

    // 為每個批次計算詳細資訊
    batches.forEach((batch) => {
      batch.estimatedBoxCount = calculateBoxCount(batch)
      batch.canShipTogether = batch.totalVolume <= MAX_711_VOLUME
      batch.shippingFee = calculateShippingFee(batch)

      if (!batch.canShipTogether) {
        batch.notes.push('此批次商品超過7-11取貨限制')
      }

      if (batch.estimatedBoxCount > 1) {
        batch.notes.push(`預計需要 ${batch.estimatedBoxCount} 個包裝盒`)
      }
    })

    // 更新購物車項目的建議批次號
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      for (const item of batch.items) {
        await prisma.cartItem.update({
          where: { id: item.id },
          data: { suggestedBatch: i + 1 },
        })
      }
    }
  } else {
    // 不需要分批，所有商品放在同一批
    const singleBatch: CartBatch = {
      batchNumber: 1,
      items: cartItems,
      totalQuantity: totalItems,
      totalVolume: totalVolume,
      estimatedBoxCount: calculateBoxCount({
        items: cartItems,
        totalVolume: totalVolume,
      }),
      canShipTogether: true,
      shippingFee: 65, // 標準運費
      notes: [],
    }

    if (allCanCombine && totalItems > 2) {
      singleBatch.notes.push('可選擇合併包裝以減少包裝材料')
    }

    batches.push(singleBatch)

    // 更新所有購物車項目的批次號為1
    await prisma.cartItem.updateMany({
      where: { userId },
      data: { suggestedBatch: 1 },
    })
  }

  // 計算總運費
  const estimatedShippingFee = batches.reduce((sum, batch) => sum + batch.shippingFee, 0)

  // 添加額外的建議
  if (batches.length > 1) {
    suggestions.push(`建議分 ${batches.length} 批下單，每批單獨計算運費`)
  }

  if (totalVolume > MAX_711_VOLUME * 2) {
    suggestions.push('商品數量較多，建議考慮宅配服務')
  }

  return {
    totalItems,
    totalVolume,
    requiresBatching,
    canCombinePackaging: allCanCombine,
    batches,
    suggestedPackagingOption,
    estimatedShippingFee,
    warnings,
    suggestions,
  }
}

/**
 * 創建新批次
 */
function createNewBatch(batchNumber: number): CartBatch {
  return {
    batchNumber,
    items: [],
    totalQuantity: 0,
    totalVolume: 0,
    estimatedBoxCount: 0,
    canShipTogether: true,
    shippingFee: 65, // 基本運費
    notes: [],
  }
}

/**
 * 計算預估包裝盒數量
 */
function calculateBoxCount(batch: { items: any[]; totalVolume: number }): number {
  // 基於體積和是否可合併來計算
  const canCombineItems = batch.items.filter((item) => item.product?.canCombinePackaging ?? true)
  const cannotCombineItems = batch.items.filter((item) => item.product?.canCombinePackaging === false)

  let boxCount = cannotCombineItems.length // 不能合併的商品各需一盒

  // 可合併的商品根據體積計算
  if (canCombineItems.length > 0) {
    const combinedVolume = canCombineItems.reduce((sum, item) => {
      const volume = PACKAGING_VOLUME_VALUES[item.product?.packagingVolume || 'STANDARD']
      return sum + volume * item.quantity
    }, 0)

    // 假設標準盒子可裝2個體積單位
    boxCount += Math.ceil(combinedVolume / 2)
  }

  return Math.max(1, boxCount)
}

/**
 * 計算運費
 */
function calculateShippingFee(batch: CartBatch): number {
  // 基本運費65元
  let fee = 65

  // 如果需要多個包裝盒，可能需要額外費用
  if (batch.estimatedBoxCount > 2) {
    fee += (batch.estimatedBoxCount - 2) * 20 // 每多一盒加20元
  }

  // 超大型商品可能需要額外費用
  const hasOversized = batch.items.some(
    (item) => item.product?.packagingVolume === 'OVERSIZED'
  )
  if (hasOversized) {
    fee += 30
  }

  return fee
}

/**
 * 驗證訂單是否符合數量限制
 */
export function validateOrderQuantityLimits(
  items: Array<{ product: Product; quantity: number }>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  items.forEach((item) => {
    if (item.quantity > item.product.maxQuantityPerOrder) {
      errors.push(
        `"${item.product.name}" 超過單筆訂單最大數量限制（${item.product.maxQuantityPerOrder}雙）`
      )
    }
  })

  // 檢查總體積是否超過7-11限制
  const totalVolume = items.reduce((sum, item) => {
    const volume = PACKAGING_VOLUME_VALUES[item.product.packagingVolume]
    return sum + volume * item.quantity
  }, 0)

  if (totalVolume > MAX_711_VOLUME) {
    const totalCombinedQuantity = items.reduce((sum, item) => {
      return sum + Math.min(item.quantity, item.product.maxCombinedQuantity)
    }, 0)

    if (totalCombinedQuantity > MAX_711_VOLUME) {
      errors.push('商品總數量超過7-11超商取貨限制，請分批下單或選擇宅配')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}