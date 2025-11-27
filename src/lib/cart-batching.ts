/**
 * 購物車智能配送服務
 * 處理7-11超商取貨（貨到付款）的包裝限制
 *
 * 規則：
 * 1. 限制只適用於「貨到付款」（7-11取貨付款），其他付款方式沒有限制
 * 2. 單獨包裝 + 貨到付款：只能一件（一雙鞋）
 * 3. 合併包裝 + 貨到付款：取購物車中所有商品的「合併包裝最大數量」的最小值
 */

import { PrismaClient, CartItem, Product } from '@prisma/client'

// 數量調整建議
export interface QuantityAdjustment {
  cartItemId: string
  productName: string
  currentQuantity: number
  suggestedQuantity: number
  reason: string
}

// 購物車配送分析結果
export interface CartDeliveryAnalysis {
  // 基本資訊
  totalItems: number
  totalProducts: number // 不同商品的數量

  // 合併包裝相關
  canCombinePackaging: boolean // 是否所有商品都允許合併包裝
  maxCombinedLimit: number // 合併包裝時的最大數量限制（取所有商品的最小值）

  // 貨到付款限制分析
  codStandardLimit: number // 貨到付款 + 單獨包裝的限制（固定為1）
  codCombinedLimit: number // 貨到付款 + 合併包裝的限制

  // 超出限制的情況
  exceedsStandardLimit: boolean // 是否超過單獨包裝限制
  exceedsCombinedLimit: boolean // 是否超過合併包裝限制

  // 數量調整建議（用於貨到付款）
  standardPackagingAdjustments: QuantityAdjustment[] // 單獨包裝的調整建議
  combinedPackagingAdjustments: QuantityAdjustment[] // 合併包裝的調整建議

  // 建議
  warnings: string[]
  suggestions: string[]
}

/**
 * 分析購物車配送限制
 * 主要用於判斷貨到付款時的數量限制
 */
export async function analyzeCartDelivery(
  prisma: PrismaClient,
  userId: string
): Promise<CartDeliveryAnalysis> {
  // 獲取購物車項目及其產品資訊
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: 'asc' },
  })

  const warnings: string[] = []
  const suggestions: string[] = []

  if (cartItems.length === 0) {
    return {
      totalItems: 0,
      totalProducts: 0,
      canCombinePackaging: true,
      maxCombinedLimit: 0,
      codStandardLimit: 1,
      codCombinedLimit: 0,
      exceedsStandardLimit: false,
      exceedsCombinedLimit: false,
      standardPackagingAdjustments: [],
      combinedPackagingAdjustments: [],
      warnings: [],
      suggestions: [],
    }
  }

  // 計算總數量
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalProducts = cartItems.length

  // 檢查所有商品是否都允許合併包裝
  const canCombinePackaging = cartItems.every(item => item.product.canCombinePackaging)

  // 計算合併包裝的最大數量限制（取所有商品的 maxCombinedQuantity 最小值）
  const maxCombinedLimit = canCombinePackaging
    ? Math.min(...cartItems.map(item => item.product.maxCombinedQuantity))
    : 0

  // 貨到付款限制
  const codStandardLimit = 1 // 單獨包裝固定只能一件
  const codCombinedLimit = maxCombinedLimit

  // 判斷是否超過限制
  const exceedsStandardLimit = totalItems > codStandardLimit
  const exceedsCombinedLimit = totalItems > codCombinedLimit

  // ====== 計算單獨包裝的調整建議 ======
  const standardPackagingAdjustments: QuantityAdjustment[] = []

  if (exceedsStandardLimit) {
    // 單獨包裝只能一件，所以保留第一個商品的第一件，其他都建議移除
    let keptOne = false

    for (const item of cartItems) {
      if (!keptOne) {
        // 保留第一個商品，但數量只能是1
        if (item.quantity > 1) {
          standardPackagingAdjustments.push({
            cartItemId: item.id,
            productName: item.product.name,
            currentQuantity: item.quantity,
            suggestedQuantity: 1,
            reason: '貨到付款 + 單獨包裝限制：只能購買一件商品',
          })
        }
        keptOne = true
      } else {
        // 其他商品都建議移除
        standardPackagingAdjustments.push({
          cartItemId: item.id,
          productName: item.product.name,
          currentQuantity: item.quantity,
          suggestedQuantity: 0,
          reason: '貨到付款 + 單獨包裝限制：只能購買一件商品',
        })
      }
    }

    warnings.push('貨到付款 + 單獨包裝：只能購買一件商品')
    suggestions.push('如需購買多件，請選擇「合併包裝」或其他付款方式')
  }

  // ====== 計算合併包裝的調整建議 ======
  const combinedPackagingAdjustments: QuantityAdjustment[] = []

  if (exceedsCombinedLimit && canCombinePackaging) {
    // 需要減少數量到 maxCombinedLimit
    let remainingAllowance = codCombinedLimit

    for (const item of cartItems) {
      if (remainingAllowance <= 0) {
        // 已達上限，建議移除
        combinedPackagingAdjustments.push({
          cartItemId: item.id,
          productName: item.product.name,
          currentQuantity: item.quantity,
          suggestedQuantity: 0,
          reason: `貨到付款 + 合併包裝限制：訂單最多 ${codCombinedLimit} 件`,
        })
      } else if (item.quantity > remainingAllowance) {
        // 需要減少數量
        combinedPackagingAdjustments.push({
          cartItemId: item.id,
          productName: item.product.name,
          currentQuantity: item.quantity,
          suggestedQuantity: remainingAllowance,
          reason: `貨到付款 + 合併包裝限制：訂單最多 ${codCombinedLimit} 件`,
        })
        remainingAllowance = 0
      } else {
        // 不需要調整
        remainingAllowance -= item.quantity
      }
    }

    warnings.push(`貨到付款 + 合併包裝：訂單最多 ${codCombinedLimit} 件商品`)
    suggestions.push('如需購買更多，請選擇其他付款方式（無數量限制）')
  }

  // 如果不能合併包裝
  if (!canCombinePackaging && totalItems > 1) {
    warnings.push('購物車中有商品不支援合併包裝')
    suggestions.push('貨到付款時，不支援合併包裝的商品只能單獨購買')
  }

  return {
    totalItems,
    totalProducts,
    canCombinePackaging,
    maxCombinedLimit,
    codStandardLimit,
    codCombinedLimit,
    exceedsStandardLimit,
    exceedsCombinedLimit,
    standardPackagingAdjustments,
    combinedPackagingAdjustments,
    warnings,
    suggestions,
  }
}

/**
 * 套用單獨包裝的數量調整
 */
export async function applyStandardPackagingAdjustments(
  prisma: PrismaClient,
  userId: string
): Promise<{ success: boolean; adjustedItems: number; removedItems: number; message: string }> {
  const analysis = await analyzeCartDelivery(prisma, userId)

  if (analysis.standardPackagingAdjustments.length === 0) {
    return {
      success: true,
      adjustedItems: 0,
      removedItems: 0,
      message: '購物車已符合單獨包裝限制',
    }
  }

  let adjustedItems = 0
  let removedItems = 0

  for (const adjustment of analysis.standardPackagingAdjustments) {
    if (adjustment.suggestedQuantity === 0) {
      await prisma.cartItem.delete({
        where: { id: adjustment.cartItemId },
      })
      removedItems++
    } else {
      await prisma.cartItem.update({
        where: { id: adjustment.cartItemId },
        data: { quantity: adjustment.suggestedQuantity },
      })
      adjustedItems++
    }
  }

  return {
    success: true,
    adjustedItems,
    removedItems,
    message: `已調整購物車，保留 1 件商品（貨到付款 + 單獨包裝限制）`,
  }
}

/**
 * 套用合併包裝的數量調整
 */
export async function applyCombinedPackagingAdjustments(
  prisma: PrismaClient,
  userId: string
): Promise<{ success: boolean; adjustedItems: number; removedItems: number; message: string }> {
  const analysis = await analyzeCartDelivery(prisma, userId)

  if (analysis.combinedPackagingAdjustments.length === 0) {
    return {
      success: true,
      adjustedItems: 0,
      removedItems: 0,
      message: '購物車已符合合併包裝限制',
    }
  }

  let adjustedItems = 0
  let removedItems = 0

  for (const adjustment of analysis.combinedPackagingAdjustments) {
    if (adjustment.suggestedQuantity === 0) {
      await prisma.cartItem.delete({
        where: { id: adjustment.cartItemId },
      })
      removedItems++
    } else {
      await prisma.cartItem.update({
        where: { id: adjustment.cartItemId },
        data: { quantity: adjustment.suggestedQuantity },
      })
      adjustedItems++
    }
  }

  return {
    success: true,
    adjustedItems,
    removedItems,
    message: `已調整購物車至 ${analysis.codCombinedLimit} 件（貨到付款 + 合併包裝限制）`,
  }
}

// ============ 保留舊的介面以維持向後相容 ============

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
  quantityAdjustments: QuantityAdjustment[]
  adjustedTotalItems: number
  adjustedTotalVolume: number
  // 新增欄位
  codStandardLimit: number
  codCombinedLimit: number
  exceedsStandardLimit: boolean
  exceedsCombinedLimit: boolean
  standardPackagingAdjustments: QuantityAdjustment[]
  combinedPackagingAdjustments: QuantityAdjustment[]
}

/**
 * 分析購物車（向後相容的介面）
 */
export async function analyzeCartForBatching(
  prisma: PrismaClient,
  userId: string
): Promise<CartBatchingAnalysis> {
  const delivery = await analyzeCartDelivery(prisma, userId)

  return {
    totalItems: delivery.totalItems,
    totalVolume: delivery.totalItems, // 簡化：1件=1體積
    requiresBatching: delivery.exceedsCombinedLimit,
    canCombinePackaging: delivery.canCombinePackaging,
    batches: [], // 不再使用分批邏輯
    suggestedPackagingOption: delivery.canCombinePackaging ? 'COMBINED' : 'STANDARD',
    estimatedShippingFee: 60, // 7-11 取貨運費
    warnings: delivery.warnings,
    suggestions: delivery.suggestions,
    quantityAdjustments: delivery.combinedPackagingAdjustments,
    adjustedTotalItems: delivery.codCombinedLimit,
    adjustedTotalVolume: delivery.codCombinedLimit,
    // 新增欄位
    codStandardLimit: delivery.codStandardLimit,
    codCombinedLimit: delivery.codCombinedLimit,
    exceedsStandardLimit: delivery.exceedsStandardLimit,
    exceedsCombinedLimit: delivery.exceedsCombinedLimit,
    standardPackagingAdjustments: delivery.standardPackagingAdjustments,
    combinedPackagingAdjustments: delivery.combinedPackagingAdjustments,
  }
}

/**
 * 套用數量調整（向後相容）
 */
export async function applyQuantityAdjustments(
  prisma: PrismaClient,
  userId: string
): Promise<{ success: boolean; adjustedItems: number; removedItems: number }> {
  // 預設套用合併包裝的調整
  const result = await applyCombinedPackagingAdjustments(prisma, userId)
  return {
    success: result.success,
    adjustedItems: result.adjustedItems,
    removedItems: result.removedItems,
  }
}
