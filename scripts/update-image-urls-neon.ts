/**
 * 更新 Neon 資料庫中的圖片 URL
 * 將 /uploads/... 替換為 R2 URL
 *
 * 使用方式：pnpm tsx scripts/update-image-urls-neon.ts
 */

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

// 使用 Neon 資料庫
const DATABASE_URL = 'postgresql://neondb_owner:npg_bZsHC6edq3ac@ep-lucky-math-a1gqirvv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
})

const R2_PUBLIC_DOMAIN = 'pub-255d7bef84ad4918a06b3575880ce109.r2.dev'
const OLD_PREFIX = '/uploads/'
const NEW_PREFIX = `https://${R2_PUBLIC_DOMAIN}/uploads/`

async function main() {
  console.log('🚀 開始更新 Neon 資料庫中的圖片 URL...\n')
  console.log(`舊格式: ${OLD_PREFIX}...`)
  console.log(`新格式: ${NEW_PREFIX}...\n`)

  try {
    // 1. 更新產品圖片 (JSON 陣列)
    console.log('📦 更新產品圖片...')
    const products = await prisma.product.findMany({
      select: { id: true, images: true },
    })

    let productCount = 0
    for (const product of products) {
      const images = product.images as string[]
      if (Array.isArray(images) && images.length > 0) {
        const hasOldUrl = images.some((img: string) => img.startsWith(OLD_PREFIX))
        if (hasOldUrl) {
          const updatedImages = images.map((img: string) => {
            if (img.startsWith(OLD_PREFIX)) {
              return img.replace(OLD_PREFIX, NEW_PREFIX)
            }
            return img
          })

          await prisma.product.update({
            where: { id: product.id },
            data: { images: updatedImages },
          })
          productCount++
        }
      }
    }
    console.log(`  ✅ 更新了 ${productCount} 個產品的圖片`)

    // 2. 更新產品變體顏色圖片
    console.log('📦 更新產品變體圖片...')
    const variantsResult = await prisma.$executeRaw`
      UPDATE product_variants
      SET "colorImage" = REPLACE("colorImage", ${OLD_PREFIX}, ${NEW_PREFIX})
      WHERE "colorImage" LIKE ${OLD_PREFIX + '%'}
    `
    console.log(`  ✅ 更新了變體的顏色圖片`)

    // 3. 更新品牌 Logo
    console.log('📦 更新品牌 Logo...')
    const brandsResult = await prisma.$executeRaw`
      UPDATE brands
      SET logo = REPLACE(logo, ${OLD_PREFIX}, ${NEW_PREFIX})
      WHERE logo LIKE ${OLD_PREFIX + '%'}
    `
    console.log(`  ✅ 更新了品牌的 Logo`)

    // 4. 更新分類圖片
    console.log('📦 更新分類圖片...')
    const categoriesResult = await prisma.$executeRaw`
      UPDATE categories
      SET image = REPLACE(image, ${OLD_PREFIX}, ${NEW_PREFIX})
      WHERE image LIKE ${OLD_PREFIX + '%'}
    `
    console.log(`  ✅ 更新了分類的圖片`)

    // 5. 更新 Hero Slides 圖片
    console.log('📦 更新輪播圖...')
    const heroResult = await prisma.$executeRaw`
      UPDATE hero_slides
      SET image = REPLACE(image, ${OLD_PREFIX}, ${NEW_PREFIX})
      WHERE image LIKE ${OLD_PREFIX + '%'}
    `
    console.log(`  ✅ 更新了輪播圖`)

    // 6. 更新用戶頭像
    console.log('📦 更新用戶頭像...')
    const usersResult = await prisma.$executeRaw`
      UPDATE users
      SET avatar = REPLACE(avatar, ${OLD_PREFIX}, ${NEW_PREFIX})
      WHERE avatar LIKE ${OLD_PREFIX + '%'}
    `
    console.log(`  ✅ 更新了用戶頭像`)

    // 7. 更新訂單項目圖片
    console.log('📦 更新訂單項目圖片...')
    const orderItemsResult = await prisma.$executeRaw`
      UPDATE order_items
      SET "productImage" = REPLACE("productImage", ${OLD_PREFIX}, ${NEW_PREFIX})
      WHERE "productImage" LIKE ${OLD_PREFIX + '%'}
    `
    console.log(`  ✅ 更新了訂單項目圖片`)

    // 8. 更新套裝組合圖片
    console.log('📦 更新套裝組合圖片...')
    const bundlesResult = await prisma.$executeRaw`
      UPDATE product_bundles
      SET image = REPLACE(image, ${OLD_PREFIX}, ${NEW_PREFIX})
      WHERE image LIKE ${OLD_PREFIX + '%'}
    `
    console.log(`  ✅ 更新了套裝組合圖片`)

    console.log('\n🎉 資料庫 URL 更新完成！')

  } catch (error) {
    console.error('❌ 更新失敗:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
