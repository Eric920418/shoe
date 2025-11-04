import React from 'react'
import {
  getHomepageConfig,
  getHomepageProducts,
  getActiveFlashSale,
  getCategoryDisplays
} from '@/lib/server-queries'
import HomePageClient from '@/components/home/HomePageClient'

export const revalidate = 300 // 5分鐘重新驗證一次

export default async function HomePage() {
  // 在伺服器端並行查詢所有資料
  const [configs, products, flashSale, categoryDisplays] = await Promise.all([
    getHomepageConfig(),
    getHomepageProducts(30), // 查詢30個產品用於所有區塊
    getActiveFlashSale(),
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
      categoryDisplays={categoryDisplays}
    />
  )
}
