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
  // 載入首頁所需的產品（精選和新品優先）
  const [configs, products, flashSale, todaysDeal, categoryDisplays] = await Promise.all([
    getHomepageConfig(),
    getHomepageProducts(30), // 載入 30 筆，確保精選和新品都能顯示
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
