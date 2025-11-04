// 簡化版種子資料
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('開始初始化資料...')

  // 1. 建立輪播圖
  console.log('建立輪播圖...')
  await prisma.heroSlide.create({
    data: {
      title: '雙11限時特賣',
      subtitle: '全場5折起',
      description: '買2送1，滿999免運',
      image: '/images/banner/sale.jpg',
      link: '/flash-sale',
      cta: '立即搶購',
      bgColor: 'from-red-500 to-orange-500',
      isActive: true,
      sortOrder: 1
    }
  })

  await prisma.heroSlide.create({
    data: {
      title: '新品上市',
      subtitle: '2024秋冬新款',
      description: '首購享85折優惠',
      image: '/images/banner/new.jpg',
      link: '/new-arrivals',
      cta: '立即選購',
      bgColor: 'from-purple-500 to-pink-500',
      isActive: true,
      sortOrder: 2
    }
  })

  // 2. 建立促銷倒計時
  console.log('建立促銷倒計時...')
  const endTime = new Date()
  endTime.setHours(endTime.getHours() + 24) // 24小時後結束

  await prisma.saleCountdown.create({
    data: {
      title: '限時特賣',
      subtitle: '全場5折起！買越多省越多！',
      endTime: endTime,
      bgColor: '#FF0000',
      textColor: '#FFFFFF',
      link: '/flash-sale',
      isActive: true
    }
  })

  console.log('✅ 資料初始化完成！')
}

main()
  .catch((e) => {
    console.error('初始化失敗:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })