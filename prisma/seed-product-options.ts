/**
 * 產品選項種子資料腳本
 * 初始化鞋型、閉合方式、產品特性的默認選項
 * 執行：npx ts-node prisma/seed-product-options.ts
 * 或：pnpm tsx prisma/seed-product-options.ts
 */

import { PrismaClient, ProductOptionType } from '@prisma/client'

const prisma = new PrismaClient()

// 默認鞋型選項
const shoeTypes = ['運動鞋', '跑步鞋', '籃球鞋', '皮鞋', '休閒鞋', '涼鞋', '靴子', '拖鞋']

// 默認閉合方式選項
const closures = ['系帶', '魔術貼', '拉鍊', '套腳', '扣環']

// 默認產品特性選項
const features = ['防水', '透氣', '防滑', '減震', '輕量', '耐磨', '抗菌', '快乾']

async function main() {
  console.log('🌱 開始初始化產品選項...')

  // 創建鞋型選項
  console.log('👟 創建鞋型選項...')
  for (let i = 0; i < shoeTypes.length; i++) {
    const name = shoeTypes[i]
    await prisma.productOption.upsert({
      where: {
        type_name: {
          type: ProductOptionType.SHOE_TYPE,
          name,
        },
      },
      update: {},
      create: {
        type: ProductOptionType.SHOE_TYPE,
        name,
        sortOrder: i + 1,
        isActive: true,
      },
    })
    console.log(`  ✅ ${name}`)
  }

  // 創建閉合方式選項
  console.log('🔗 創建閉合方式選項...')
  for (let i = 0; i < closures.length; i++) {
    const name = closures[i]
    await prisma.productOption.upsert({
      where: {
        type_name: {
          type: ProductOptionType.CLOSURE,
          name,
        },
      },
      update: {},
      create: {
        type: ProductOptionType.CLOSURE,
        name,
        sortOrder: i + 1,
        isActive: true,
      },
    })
    console.log(`  ✅ ${name}`)
  }

  // 創建產品特性選項
  console.log('✨ 創建產品特性選項...')
  for (let i = 0; i < features.length; i++) {
    const name = features[i]
    await prisma.productOption.upsert({
      where: {
        type_name: {
          type: ProductOptionType.FEATURE,
          name,
        },
      },
      update: {},
      create: {
        type: ProductOptionType.FEATURE,
        name,
        sortOrder: i + 1,
        isActive: true,
      },
    })
    console.log(`  ✅ ${name}`)
  }

  console.log('')
  console.log('🎉 產品選項初始化完成！')
  console.log(`   - 鞋型: ${shoeTypes.length} 個選項`)
  console.log(`   - 閉合方式: ${closures.length} 個選項`)
  console.log(`   - 產品特性: ${features.length} 個選項`)
}

main()
  .catch((e) => {
    console.error('❌ 初始化失敗:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
