// 清理重複資料腳本
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('開始清理重複資料...')

  // 1. 清理輪播圖 - 只保留每個 sortOrder 最新的一個
  console.log('\n清理輪播圖...')
  const allSlides = await prisma.heroSlide.findMany({
    orderBy: { createdAt: 'desc' }
  })

  const uniqueSlides = new Map()
  const slidesToDelete: string[] = []

  for (const slide of allSlides) {
    const key = `${slide.title}-${slide.sortOrder}`
    if (!uniqueSlides.has(key)) {
      uniqueSlides.set(key, slide.id)
    } else {
      slidesToDelete.push(slide.id)
    }
  }

  if (slidesToDelete.length > 0) {
    const deleted = await prisma.heroSlide.deleteMany({
      where: { id: { in: slidesToDelete } }
    })
    console.log(`✓ 刪除了 ${deleted.count} 個重複的輪播圖`)
  } else {
    console.log('✓ 沒有重複的輪播圖')
  }

  // 2. 清理促銷倒計時 - 只保留最新的一個
  console.log('\n清理促銷倒計時...')
  const allCountdowns = await prisma.saleCountdown.findMany({
    orderBy: { createdAt: 'desc' }
  })

  if (allCountdowns.length > 1) {
    const countdownsToDelete = allCountdowns.slice(1).map(c => c.id)
    const deleted = await prisma.saleCountdown.deleteMany({
      where: { id: { in: countdownsToDelete } }
    })
    console.log(`✓ 刪除了 ${deleted.count} 個重複的促銷倒計時`)
  } else {
    console.log('✓ 沒有重複的促銷倒計時')
  }

  // 3. 清理限時搶購配置 - 只保留最新的一個
  console.log('\n清理限時搶購配置...')
  const allFlashSales = await prisma.flashSaleConfig.findMany({
    orderBy: { createdAt: 'desc' }
  })

  if (allFlashSales.length > 1) {
    const flashSalesToDelete = allFlashSales.slice(1).map(f => f.id)
    const deleted = await prisma.flashSaleConfig.deleteMany({
      where: { id: { in: flashSalesToDelete } }
    })
    console.log(`✓ 刪除了 ${deleted.count} 個重複的限時搶購配置`)
  } else {
    console.log('✓ 沒有重複的限時搶購配置')
  }

  // 4. 清理熱門產品配置 - 只保留最新的一個
  console.log('\n清理熱門產品配置...')
  const allPopularConfigs = await prisma.popularProductsConfig.findMany({
    orderBy: { createdAt: 'desc' }
  })

  if (allPopularConfigs.length > 1) {
    const configsToDelete = allPopularConfigs.slice(1).map(c => c.id)
    const deleted = await prisma.popularProductsConfig.deleteMany({
      where: { id: { in: configsToDelete } }
    })
    console.log(`✓ 刪除了 ${deleted.count} 個重複的熱門產品配置`)
  } else {
    console.log('✓ 沒有重複的熱門產品配置')
  }

  // 5. 清理浮動促銷按鈕 - 按 type 和 position 去重
  console.log('\n清理浮動促銷按鈕...')
  const allPromos = await prisma.floatingPromo.findMany({
    orderBy: { createdAt: 'desc' }
  })

  const uniquePromos = new Map()
  const promosToDelete: string[] = []

  for (const promo of allPromos) {
    const key = `${promo.type}-${promo.position}`
    if (!uniquePromos.has(key)) {
      uniquePromos.set(key, promo.id)
    } else {
      promosToDelete.push(promo.id)
    }
  }

  if (promosToDelete.length > 0) {
    const deleted = await prisma.floatingPromo.deleteMany({
      where: { id: { in: promosToDelete } }
    })
    console.log(`✓ 刪除了 ${deleted.count} 個重複的浮動促銷按鈕`)
  } else {
    console.log('✓ 沒有重複的浮動促銷按鈕')
  }

  console.log('\n✅ 重複資料清理完成！')
}

main()
  .catch((e) => {
    console.error('清理失敗:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
