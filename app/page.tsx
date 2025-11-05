import React from 'react'
import {
  getHomepageConfig,
  getHomepageProducts,
  getActiveFlashSale,
  getTodaysDeal,
  getCategoryDisplays
} from '@/lib/server-queries'
import HomePageClient from '@/components/home/HomePageClient'

export const revalidate = 300 // 5分鐘重新驗證一次

export default async function HomePage() {
  // ✅ 性能優化：減少查詢數量，從 30 筆降為 15 筆
  // FlashSale 最多顯示 6 筆，DailyDeals 最多 4 筆，其他區塊共用剩餘的
  const [configs, products, flashSale, todaysDeal, categoryDisplays] = await Promise.all([
    getHomepageConfig(),
    getHomepageProducts(15), // 降低為 15 筆，減少資料傳輸
    getActiveFlashSale(),
    getTodaysDeal(), // ✅ 新增：預先載入今日必搶配置
    getCategoryDisplays(),
  ])

  // 將配置序列化為可傳遞給客戶端的格式
  const componentsConfig = configs.map(config => ({
    componentId: config.id,
    componentType: config.componentType,
    title: config.title || '',
    subtitle: config.subtitle || '',
    isActive: config.isActive,
    sortOrder: config.sortOrder,
    settings: typeof config.settings === 'string' ? JSON.parse(config.settings || '{}') : config.settings,
    mobileSettings: typeof config.mobileSettings === 'string' ? JSON.parse(config.mobileSettings || '{}') : config.mobileSettings,
  }))

  return (
    <HomePageClient
      componentsConfig={componentsConfig}
      products={products}
      flashSale={flashSale}
      todaysDeal={todaysDeal}
      categoryDisplays={categoryDisplays}
    />
  )
}
