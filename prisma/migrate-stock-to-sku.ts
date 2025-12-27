/**
 * 庫存遷移腳本
 * 將現有的 SizeChart.stock 資料遷移到 ProductSku 表
 *
 * 執行方式: npx ts-node prisma/migrate-stock-to-sku.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateStockToSku() {
  console.log('開始庫存遷移...')

  try {
    // 1. 獲取所有產品
    const products = await prisma.product.findMany({
      include: {
        variants: true,
        sizeCharts: true,
      },
    })

    console.log(`找到 ${products.length} 個產品`)

    let skuCount = 0
    let skippedCount = 0

    for (const product of products) {
      console.log(`\n處理產品: ${product.name} (${product.id})`)
      console.log(`  - 顏色變體: ${product.variants.length} 個`)
      console.log(`  - 尺碼: ${product.sizeCharts.length} 個`)

      // 如果沒有顏色或尺碼，跳過
      if (product.variants.length === 0) {
        console.log(`  ⚠️ 跳過：沒有顏色變體`)
        skippedCount++
        continue
      }

      if (product.sizeCharts.length === 0) {
        console.log(`  ⚠️ 跳過：沒有尺碼`)
        skippedCount++
        continue
      }

      // 為每個顏色 × 尺碼組合建立 SKU
      for (const variant of product.variants) {
        for (const sizeChart of product.sizeCharts) {
          // 檢查是否已存在
          const existingSku = await prisma.productSku.findUnique({
            where: {
              productId_variantId_sizeChartId: {
                productId: product.id,
                variantId: variant.id,
                sizeChartId: sizeChart.id,
              },
            },
          })

          if (existingSku) {
            console.log(`  - SKU 已存在: ${variant.color || variant.name} × ${sizeChart.size}`)
            continue
          }

          // 決定庫存數量
          // 如果 SizeChart 有 variantId 且匹配，使用該庫存
          // 否則將 SizeChart.stock 平均分配給所有顏色
          let stock = 0
          if (sizeChart.variantId === variant.id) {
            stock = sizeChart.stock
          } else if (!sizeChart.variantId) {
            // 沒有指定 variantId，平均分配
            stock = Math.floor(sizeChart.stock / product.variants.length)
          }

          // 建立 SKU
          await prisma.productSku.create({
            data: {
              productId: product.id,
              variantId: variant.id,
              sizeChartId: sizeChart.id,
              stock: stock,
              isActive: variant.isActive && sizeChart.isActive,
            },
          })

          skuCount++
          console.log(`  ✓ 建立 SKU: ${variant.color || variant.name} × ${sizeChart.size} = ${stock} 件`)
        }
      }
    }

    console.log('\n================================')
    console.log(`遷移完成！`)
    console.log(`  - 建立 SKU: ${skuCount} 個`)
    console.log(`  - 跳過產品: ${skippedCount} 個`)
    console.log('================================')

  } catch (error) {
    console.error('遷移失敗:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 執行遷移
migrateStockToSku()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
