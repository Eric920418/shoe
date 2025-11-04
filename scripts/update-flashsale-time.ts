import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateFlashSaleTime() {
  try {
    // 設定新的開始和結束時間
    const now = new Date()
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0) // 今天 00:00
    const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59) // 明天 23:59

    console.log('開始時間:', startTime.toISOString())
    console.log('結束時間:', endTime.toISOString())

    // 更新最新的 FlashSale 配置
    const result = await prisma.flashSaleConfig.updateMany({
      where: {
        isActive: true,
      },
      data: {
        startTime,
        endTime,
      },
    })

    console.log(`✅ 成功更新 ${result.count} 個 FlashSale 配置`)

    // 查詢更新後的數據
    const updated = await prisma.flashSaleConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    console.log('\n更新後的 FlashSale 配置:')
    console.log('ID:', updated?.id)
    console.log('名稱:', updated?.name)
    console.log('開始時間:', updated?.startTime)
    console.log('結束時間:', updated?.endTime)
    console.log('產品配置:', updated?.products)
  } catch (error) {
    console.error('❌ 更新失敗:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateFlashSaleTime()
