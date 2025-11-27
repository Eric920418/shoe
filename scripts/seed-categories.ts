/**
 * 建立初始分類資料與 CategoryDisplay 設定
 *
 * 執行方式：
 * npx ts-node scripts/seed-categories.ts
 * 或
 * npx tsx scripts/seed-categories.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 分類與對應的圖示設定
const categories = [
  {
    name: '運動鞋',
    slug: 'sports-shoes',
    image: null,
    sortOrder: 0,
    display: {
      icon: '👟',
      displayName: '運動鞋',
      sortOrder: 0,
      isHighlighted: true,
      showOnHomepage: true,
      bgColor: null,
      textColor: null,
    }
  },
  {
    name: '休閒鞋',
    slug: 'casual-shoes',
    image: null,
    sortOrder: 1,
    display: {
      icon: '👞',
      displayName: '休閒鞋',
      sortOrder: 1,
      isHighlighted: false,
      showOnHomepage: true,
      bgColor: null,
      textColor: null,
    }
  },
  {
    name: '高跟鞋',
    slug: 'high-heels',
    image: null,
    sortOrder: 2,
    display: {
      icon: '👠',
      displayName: '高跟鞋',
      sortOrder: 2,
      isHighlighted: true,
      showOnHomepage: true,
      bgColor: null,
      textColor: null,
    }
  },
  {
    name: '靴子',
    slug: 'boots',
    image: null,
    sortOrder: 3,
    display: {
      icon: '🥾',
      displayName: '靴子',
      sortOrder: 3,
      isHighlighted: false,
      showOnHomepage: true,
      bgColor: null,
      textColor: null,
    }
  },
  {
    name: '涼鞋拖鞋',
    slug: 'sandals',
    image: null,
    sortOrder: 4,
    display: {
      icon: '👡',
      displayName: '涼鞋拖鞋',
      sortOrder: 4,
      isHighlighted: true,
      showOnHomepage: true,
      bgColor: null,
      textColor: null,
    }
  },
  {
    name: '童鞋',
    slug: 'kids-shoes',
    image: null,
    sortOrder: 5,
    display: {
      icon: '👶',
      displayName: '童鞋',
      sortOrder: 5,
      isHighlighted: false,
      showOnHomepage: true,
      bgColor: null,
      textColor: null,
    }
  },
  {
    name: '專業運動',
    slug: 'professional-sports',
    image: null,
    sortOrder: 6,
    display: {
      icon: '🏃',
      displayName: '專業運動',
      sortOrder: 6,
      isHighlighted: false,
      showOnHomepage: true,
      bgColor: null,
      textColor: null,
    }
  },
  {
    name: '特價專區',
    slug: 'sale',
    image: null,
    sortOrder: 7,
    display: {
      icon: '💰',
      displayName: '特價專區',
      sortOrder: 7,
      isHighlighted: true,
      showOnHomepage: true,
      bgColor: null,
      textColor: null,
    }
  }
]

async function main() {
  console.log('🔄 開始建立分類資料...')

  // 檢查現有分類數量
  const existingCount = await prisma.category.count()
  console.log(`📊 現有分類數量: ${existingCount}`)

  if (existingCount > 0) {
    console.log('⚠️  資料庫中已有分類資料')
    console.log('是否要更新現有分類的 CategoryDisplay 設定？')
    console.log('執行以下指令來更新：')
    console.log('  1. 手動刪除舊的分類：DELETE FROM categories;')
    console.log('  2. 重新執行此腳本')
  }

  for (const categoryData of categories) {
    // 使用 upsert 來建立或更新分類
    const category = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {
        name: categoryData.name,
        sortOrder: categoryData.sortOrder,
        isActive: true,
      },
      create: {
        name: categoryData.name,
        slug: categoryData.slug,
        image: categoryData.image,
        sortOrder: categoryData.sortOrder,
        isActive: true,
      },
    })

    console.log(`✅ 分類已建立/更新: ${category.name} (${category.slug})`)

    // 建立或更新 CategoryDisplay
    const display = await prisma.categoryDisplay.upsert({
      where: { categoryId: category.id },
      update: {
        ...categoryData.display,
      },
      create: {
        categoryId: category.id,
        ...categoryData.display,
      },
    })

    console.log(`   └─ 顯示設定已建立/更新: 圖示=${display.icon}, 顯示名稱=${display.displayName}`)
  }

  // 顯示最終統計
  const finalCount = await prisma.category.count()
  const displayCount = await prisma.categoryDisplay.count({ where: { showOnHomepage: true } })

  console.log('\n📈 建立完成！')
  console.log(`   - 總分類數: ${finalCount}`)
  console.log(`   - 首頁顯示分類數: ${displayCount}`)

  // 顯示每個分類的產品數量
  console.log('\n📦 各分類產品數量:')
  const categoriesWithCount = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { sortOrder: 'asc' }
  })

  for (const cat of categoriesWithCount) {
    console.log(`   - ${cat.name}: ${cat._count.products} 件商品`)
  }
}

main()
  .catch((e) => {
    console.error('❌ 錯誤:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
