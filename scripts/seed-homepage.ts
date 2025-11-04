// 首頁資料初始化腳本
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('開始初始化首頁資料...')

  // 1. 建立輪播圖
  console.log('建立輪播圖...')
  const slides = [
    {
      title: '雙11限時特賣',
      subtitle: '全場5折起',
      description: '買2送1，滿999免運',
      image: '/images/banner/sale.jpg',
      link: '/flash-sale',
      cta: '立即搶購',
      bgColor: 'from-red-500 to-orange-500',
      isActive: true,
      sortOrder: 1
    },
    {
      title: '新品上市',
      subtitle: '2024秋冬新款',
      description: '首購享85折優惠',
      image: '/images/banner/new.jpg',
      link: '/new-arrivals',
      cta: '立即選購',
      bgColor: 'from-purple-500 to-pink-500',
      isActive: true,
      sortOrder: 2
    },
    {
      title: '品牌特賣',
      subtitle: 'Nike/Adidas',
      description: '正品保證，假一賠十',
      image: '/images/banner/brand.jpg',
      link: '/brands',
      cta: '進入品牌館',
      bgColor: 'from-blue-500 to-cyan-500',
      isActive: true,
      sortOrder: 3
    }
  ]

  for (const slide of slides) {
    await prisma.heroSlide.upsert({
      where: {
        id: slide.title // 使用標題作為唯一標識
      },
      update: slide,
      create: slide
    })
  }

  // 2. 建立促銷倒計時
  console.log('建立促銷倒計時...')
  const endTime = new Date()
  endTime.setHours(endTime.getHours() + 24) // 24小時後結束

  await prisma.saleCountdown.create({
    data: {
      title: '限時特賣',
      description: '全場5折起！買越多省越多！',
      endTime: endTime,
      highlightText: '限時特賣 • SALE • 限時特賣 • SALE',
      isActive: true,
      soldCount: 12345
    }
  })

  // 3. 建立限時搶購
  console.log('建立限時搶購...')
  const flashSaleStart = new Date()
  const flashSaleEnd = new Date()
  flashSaleEnd.setHours(flashSaleEnd.getHours() + 2) // 2小時後結束

  await prisma.flashSaleConfig.create({
    data: {
      title: '限時搶購',
      description: '每2小時更新一次商品',
      startTime: flashSaleStart,
      endTime: flashSaleEnd,
      discountPercentage: 50,
      maxProducts: 6,
      isActive: true
    }
  })

  // 4. 建立服務保證項目
  console.log('建立服務保證項目...')
  const guaranteeItems = [
    {
      icon: 'Shield',
      title: '100%正品',
      description: '假一賠十',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      sortOrder: 1,
      isActive: true
    },
    {
      icon: 'Truck',
      title: '全館免運',
      description: '滿$399即享',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      sortOrder: 2,
      isActive: true
    },
    {
      icon: 'RefreshCw',
      title: '7天鑑賞',
      description: '不滿意包退',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      sortOrder: 3,
      isActive: true
    },
    {
      icon: 'HeadphonesIcon',
      title: '24H客服',
      description: '隨時為您服務',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      sortOrder: 4,
      isActive: true
    },
    {
      icon: 'CreditCard',
      title: '安全支付',
      description: '多元付款方式',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      sortOrder: 5,
      isActive: true
    },
    {
      icon: 'Award',
      title: '會員優惠',
      description: 'VIP專屬折扣',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      sortOrder: 6,
      isActive: true
    }
  ]

  for (const item of guaranteeItems) {
    await prisma.guaranteeItem.create({
      data: item
    })
  }

  // 5. 建立熱門產品配置
  console.log('建立熱門產品配置...')
  await prisma.popularProductsConfig.create({
    data: {
      title: '人氣精選',
      subtitle: '大家都在買',
      algorithm: 'SALES_VOLUME',
      maxProducts: 8,
      timeRange: 30,
      isActive: true
    }
  })

  // 6. 建立分類展示設定（如果有分類的話）
  console.log('建立分類展示設定...')
  const categories = await prisma.category.findMany({ take: 8 })

  const categoryIcons = ['👟', '👞', '👠', '🥾', '👡', '👶', '🏃', '💰']
  const categoryTags = ['HOT', 'NEW', null, null, '特價', null, null, '5折起']
  const categoryTagColors = ['bg-red-500', 'bg-purple-500', null, null, 'bg-orange-500', null, null, 'bg-red-500']

  for (let i = 0; i < categories.length; i++) {
    await prisma.categoryDisplay.upsert({
      where: { categoryId: categories[i].id },
      update: {
        icon: categoryIcons[i] || '📦',
        showOnHomepage: true,
        sortOrder: i + 1,
        highlightTag: categoryTags[i],
        highlightColor: categoryTagColors[i]
      },
      create: {
        categoryId: categories[i].id,
        icon: categoryIcons[i] || '📦',
        showOnHomepage: true,
        sortOrder: i + 1,
        highlightTag: categoryTags[i],
        highlightColor: categoryTagColors[i]
      }
    })
  }

  // 7. 建立浮動促銷按鈕
  console.log('建立浮動促銷按鈕...')
  await prisma.floatingPromo.create({
    data: {
      type: 'REFERRAL',
      text: '邀請好友',
      targetUrl: '/account/referral',
      icon: 'Gift',
      bgColor: 'bg-gradient-to-br from-purple-500 to-pink-600',
      textColor: 'text-white',
      position: 'LEFT',
      sortOrder: 1,
      isActive: true
    }
  })

  // 8. 建立首頁配置
  console.log('建立首頁配置...')
  const homepageComponents = [
    { componentId: 'hero-slider', componentType: 'HERO_SLIDER', title: '輪播圖', sortOrder: 1 },
    { componentId: 'sale-countdown', componentType: 'SALE_COUNTDOWN', title: '促銷倒計時', sortOrder: 2 },
    { componentId: 'guarantee-bar', componentType: 'GUARANTEE_BAR', title: '服務保證', sortOrder: 3 },
    { componentId: 'flash-sale', componentType: 'FLASH_SALE', title: '限時搶購', sortOrder: 4 },
    { componentId: 'category-grid', componentType: 'CATEGORY_GRID', title: '分類網格', sortOrder: 5 },
    { componentId: 'daily-deals', componentType: 'DAILY_DEALS', title: '每日特價', sortOrder: 6 },
    { componentId: 'super-deals', componentType: 'SUPER_DEALS', title: '超值優惠', sortOrder: 7 },
    { componentId: 'popular-products', componentType: 'POPULAR_PRODUCTS', title: '熱門產品', sortOrder: 8 }
  ]

  for (const component of homepageComponents) {
    await prisma.homepageConfig.upsert({
      where: { componentId: component.componentId },
      update: {
        isActive: true,
        sortOrder: component.sortOrder
      },
      create: {
        ...component,
        isActive: true
      }
    })
  }

  console.log('✅ 首頁資料初始化完成！')
}

main()
  .catch((e) => {
    console.error('初始化失敗:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })