/**
 * 會員等級管理工具（完全動態版本）
 *
 * 功能：
 * 1. 從資料庫讀取會員等級配置
 * 2. 根據總消費金額自動計算會員等級
 * 3. 計算訂單可獲得的積分
 * 4. 計算不同等級的折扣和權益
 */

import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from './prisma'

export interface MembershipTierConfig {
  id: string
  name: string
  slug: string
  minSpent: Decimal
  maxSpent: Decimal | null
  discount: Decimal
  pointsMultiplier: Decimal
  freeShippingThreshold: Decimal
  birthdayGift: Decimal
  sortOrder: number
  color: string | null
  icon: string | null
  description: string | null
  isActive: boolean
}

// 快取會員等級配置（避免頻繁查詢資料庫）
let cachedTiers: MembershipTierConfig[] | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 分鐘

/**
 * 獲取所有活躍的會員等級配置（從資料庫）
 */
export async function getAllMembershipTiers(
  forceRefresh = false
): Promise<MembershipTierConfig[]> {
  // 檢查快取
  const now = Date.now()
  if (!forceRefresh && cachedTiers && now - cacheTimestamp < CACHE_TTL) {
    return cachedTiers
  }

  // 從資料庫查詢
  const tiers = await prisma.membershipTierConfig.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  // 更新快取
  cachedTiers = tiers
  cacheTimestamp = now

  return tiers
}

/**
 * 根據 slug 獲取會員等級配置
 */
export async function getMembershipTierBySlug(
  slug: string
): Promise<MembershipTierConfig | null> {
  const tiers = await getAllMembershipTiers()
  return tiers.find((tier) => tier.slug === slug) || null
}

/**
 * 根據 ID 獲取會員等級配置
 */
export async function getMembershipTierById(
  id: string
): Promise<MembershipTierConfig | null> {
  return await prisma.membershipTierConfig.findUnique({
    where: { id },
  })
}

/**
 * 根據總消費金額計算會員等級
 * @param totalSpent 總消費金額
 * @returns 會員等級配置，如果找不到則返回最低等級
 */
export async function calculateMembershipTier(
  totalSpent: number | Decimal
): Promise<MembershipTierConfig> {
  const spent = typeof totalSpent === 'number' ? totalSpent : totalSpent.toNumber()
  const tiers = await getAllMembershipTiers()

  if (tiers.length === 0) {
    throw new Error('系統錯誤：找不到任何會員等級配置')
  }

  // 從高到低查找符合條件的等級
  for (let i = tiers.length - 1; i >= 0; i--) {
    const tier = tiers[i]
    const minSpent = tier.minSpent.toNumber()
    const maxSpent = tier.maxSpent?.toNumber()

    if (spent >= minSpent && (maxSpent === null || spent <= maxSpent)) {
      return tier
    }
  }

  // 如果沒有匹配，返回最低等級
  return tiers[0]
}

/**
 * 計算訂單可獲得的積分
 * 基礎規則：每消費 $10 = 1 積分
 * 會員等級加成：根據會員等級有不同的積分倍數
 *
 * 注意：積分僅用於記錄和展示，不可抵扣現金
 *
 * @param orderTotal 訂單總金額
 * @param tierConfig 會員等級配置
 * @returns 可獲得的積分
 */
export function calculatePointsEarned(
  orderTotal: number | Decimal,
  tierConfig: MembershipTierConfig
): number {
  const total = typeof orderTotal === 'number' ? orderTotal : orderTotal.toNumber()

  // 基礎積分：每 $10 = 1 積分
  const basePoints = Math.floor(total / 10)

  // 會員等級加成
  const multiplier = tierConfig.pointsMultiplier.toNumber()

  // 總積分（四捨五入）
  return Math.round(basePoints * multiplier)
}

/**
 * 獲取下一個會員等級
 * @param currentTierId 當前會員等級 ID
 * @returns 下一個會員等級，如果已經是最高等級則返回 null
 */
export async function getNextTier(
  currentTierId: string
): Promise<MembershipTierConfig | null> {
  const tiers = await getAllMembershipTiers()
  const currentIndex = tiers.findIndex((t) => t.id === currentTierId)

  if (currentIndex === -1 || currentIndex === tiers.length - 1) {
    return null // 找不到或已是最高等級
  }

  return tiers[currentIndex + 1]
}

/**
 * 計算距離下一個等級還需要消費多少
 * @param currentSpent 當前總消費
 * @param currentTierId 當前會員等級 ID
 * @returns 還需要消費的金額，如果已經是最高等級則返回 0
 */
export async function getSpentToNextTier(
  currentSpent: number | Decimal,
  currentTierId: string
): Promise<number> {
  const spent = typeof currentSpent === 'number' ? currentSpent : currentSpent.toNumber()
  const nextTier = await getNextTier(currentTierId)

  if (!nextTier) {
    return 0 // 已經是最高等級
  }

  const nextTierMinSpent = nextTier.minSpent.toNumber()
  const remaining = nextTierMinSpent - spent

  return remaining > 0 ? remaining : 0
}

/**
 * 計算訂單的會員折扣金額
 * @param orderSubtotal 訂單小計（未折扣前）
 * @param tierConfig 會員等級配置
 * @returns 折扣金額
 */
export function calculateMembershipDiscount(
  orderSubtotal: number | Decimal,
  tierConfig: MembershipTierConfig
): number {
  const subtotal = typeof orderSubtotal === 'number' ? orderSubtotal : orderSubtotal.toNumber()
  const discountRate = tierConfig.discount.toNumber()

  return Math.round(subtotal * discountRate * 100) / 100 // 四捨五入到小數點後兩位
}

/**
 * 檢查是否符合免運費條件
 * @param orderSubtotal 訂單小計
 * @param tierConfig 會員等級配置
 * @returns 是否免運費
 */
export function isFreeShipping(
  orderSubtotal: number | Decimal,
  tierConfig: MembershipTierConfig
): boolean {
  const subtotal = typeof orderSubtotal === 'number' ? orderSubtotal : orderSubtotal.toNumber()
  const threshold = tierConfig.freeShippingThreshold.toNumber()

  return subtotal >= threshold
}

/**
 * 清除快取（當會員等級配置被修改時調用）
 */
export function clearMembershipTierCache(): void {
  cachedTiers = null
  cacheTimestamp = 0
}

/**
 * 重新計算用戶的會員等級
 * @param userId 用戶 ID
 * @returns 更新後的會員等級配置
 */
export async function recalculateUserMembershipTier(
  userId: string
): Promise<MembershipTierConfig> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalSpent: true },
  })

  if (!user) {
    throw new Error(`找不到用戶：${userId}`)
  }

  const newTier = await calculateMembershipTier(user.totalSpent)

  // 更新用戶的會員等級
  await prisma.user.update({
    where: { id: userId },
    data: { membershipTierId: newTier.id },
  })

  return newTier
}

/**
 * 批量重新計算所有用戶的會員等級
 *
 * ⚠️ 優化：使用批次更新避免鎖表
 * - 原本：逐個 UPDATE，1000 個用戶 = 1000 次資料庫寫入（30-60 秒）
 * - 現在：按等級分組批次 UPDATE，1000 個用戶 = 5-10 次寫入（< 5 秒）
 *
 * @returns 更新的用戶數量
 */
export async function recalculateAllUsersMembershipTiers(): Promise<number> {
  console.log('🔄 開始重新計算所有用戶的會員等級...')

  // 1. 獲取所有用戶的消費金額
  const users = await prisma.user.findMany({
    select: { id: true, totalSpent: true },
  })

  console.log(`📊 總共 ${users.length} 個用戶需要計算`)

  // 2. 獲取所有會員等級配置（一次查詢）
  const tiers = await getAllMembershipTiers()

  if (tiers.length === 0) {
    console.warn('⚠️ 沒有找到會員等級配置，跳過更新')
    return 0
  }

  // 3. 按等級分組用戶
  const tierGroups = new Map<string, string[]>()

  for (const user of users) {
    const totalSpent = user.totalSpent.toNumber()
    const tier = calculateTierSync(totalSpent, tiers)

    if (!tierGroups.has(tier.id)) {
      tierGroups.set(tier.id, [])
    }
    tierGroups.get(tier.id)!.push(user.id)
  }

  console.log(`📋 分為 ${tierGroups.size} 個等級組`)

  // 4. 批次更新（每個等級一次查詢，避免鎖表）
  const BATCH_SIZE = 500 // 每批最多 500 個用戶
  let updatedCount = 0

  for (const [tierId, userIds] of tierGroups) {
    const tierInfo = tiers.find(t => t.id === tierId)
    console.log(`  📌 更新等級 ${tierInfo?.name || tierId}：${userIds.length} 個用戶`)

    // 分批更新（避免一次更新過多造成長時間鎖表）
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE)

      await prisma.user.updateMany({
        where: { id: { in: batch } },
        data: { membershipTierId: tierId },
      })

      updatedCount += batch.length
      console.log(`    ✅ 已更新 ${updatedCount}/${users.length}`)

      // 避免長時間鎖表，每批之間休息 10ms
      if (i + BATCH_SIZE < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
  }

  console.log(`✨ 完成！總共更新了 ${updatedCount} 個用戶的會員等級`)
  return updatedCount
}

/**
 * 同步計算會員等級（不查詢資料庫，用於批次處理）
 * @param totalSpent 總消費金額
 * @param tiers 會員等級列表（預先載入）
 * @returns 會員等級
 */
function calculateTierSync(
  totalSpent: number,
  tiers: Array<{
    id: string
    name: string
    minSpent: any
    maxSpent: any
    sortOrder: number
  }>
): { id: string; name: string } {
  // 按 sortOrder 升序排序（從低到高）
  const sortedTiers = [...tiers].sort((a, b) => a.sortOrder - b.sortOrder)

  for (const tier of sortedTiers) {
    const min = tier.minSpent.toNumber()
    const max = tier.maxSpent?.toNumber() || Infinity

    if (totalSpent >= min && totalSpent < max) {
      return { id: tier.id, name: tier.name }
    }
  }

  // 如果沒有匹配，返回最低等級
  const lowestTier = sortedTiers[0]
  return { id: lowestTier.id, name: lowestTier.name }
}
