'use client'

import React, { Suspense } from 'react'
import MarketplaceHeader from '@/components/navigation/MarketplaceHeader'
import MarketplaceFooter from '@/components/common/MarketplaceFooter'
import MarketplaceHero from '@/components/sections/MarketplaceHero'
import FlashSale from '@/components/sections/FlashSale'
import CategoryGrid from '@/components/sections/CategoryGrid'
import DailyDeals from '@/components/sections/DailyDeals'
import SuperDeals from '@/components/sections/SuperDeals'
import PopularProducts from '@/components/sections/PopularProducts'
import AnnouncementWrapper from '@/components/common/AnnouncementWrapper'
import FloatingPromo from '@/components/common/FloatingPromo'
import SaleCountdown from '@/components/sections/SaleCountdown'
import MobileProductFeed from '@/components/home/MobileProductFeed'

// 組件映射表
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  HERO_SLIDER: MarketplaceHero,
  SALE_COUNTDOWN: SaleCountdown,
  FLASH_SALE: FlashSale,
  CATEGORY_GRID: CategoryGrid,
  DAILY_DEALS: DailyDeals,
  SUPER_DEALS: SuperDeals,
  POPULAR_PRODUCTS: PopularProducts,
}

interface HomePageClientProps {
  componentsConfig: Array<{
    componentId: string
    componentType: string
    title?: string
    subtitle?: string
    isActive: boolean
    sortOrder: number
    settings?: any
    mobileSettings?: any
  }>
  products?: any[]
  flashSale?: any
  todaysDeal?: any
  categoryDisplays?: any[]
}

export default function HomePageClient({
  componentsConfig,
  products,
  flashSale,
  todaysDeal,
  categoryDisplays
}: HomePageClientProps) {
  // 渲染動態組件
  const renderComponent = (config: any) => {
    const Component = COMPONENT_MAP[config.componentType]

    if (!Component) {
      console.warn(`未找到組件類型: ${config.componentType}`)
      return null
    }

    // 根據組件類型傳遞不同的 props
    const componentProps: any = {
      key: config.componentId,
      title: config.title,
      subtitle: config.subtitle,
      settings: config.settings,
      mobileSettings: config.mobileSettings,
    }

    // 所有產品相關組件都傳遞伺服器數據，減少重複查詢
    if (config.componentType === 'FLASH_SALE' && products) {
      componentProps.serverProducts = products
      componentProps.serverFlashSale = flashSale
    }

    if (config.componentType === 'POPULAR_PRODUCTS' && products) {
      componentProps.serverProducts = products
    }

    if (config.componentType === 'DAILY_DEALS' && products) {
      componentProps.serverProducts = products
      componentProps.serverDealConfig = todaysDeal // ✅ 傳遞今日必搶配置
    }

    if (config.componentType === 'HERO_SLIDER' && products) {
      componentProps.serverProducts = products
    }

    if (config.componentType === 'CATEGORY_GRID' && categoryDisplays) {
      componentProps.serverCategoryDisplays = categoryDisplays
    }

    return <Component {...componentProps} />
  }

  // 檢查特定組件是否啟用
  const isComponentEnabled = (componentType: string) => {
    return componentsConfig.some(
      config => config.componentType === componentType && config.isActive
    )
  }

  // 分離 SaleCountdown 和其他組件
  const saleCountdownConfig = componentsConfig.find(
    config => config.componentType === 'SALE_COUNTDOWN' && config.isActive
  )
  const otherComponentsConfig = componentsConfig.filter(
    config => config.componentType !== 'SALE_COUNTDOWN'
  )

  // 定義手機版要顯示在上方的組件類型（按順序）
  const mobileTopComponents = ['HERO_SLIDER', 'SALE_COUNTDOWN', 'FLASH_SALE', 'CATEGORY_GRID', 'DAILY_DEALS', 'SUPER_DEALS']

  // 篩選出手機版上方要顯示的組件
  const mobileTopConfigs = mobileTopComponents
    .map(type => componentsConfig.find(c => c.componentType === type && c.isActive))
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 導航欄 - 始終顯示 */}
      <MarketplaceHeader />

      {/* 系統公告 - 始終顯示 */}
      <AnnouncementWrapper />

      {/* ===== 手機版佈局 ===== */}
      <div className="md:hidden">
        {/* 手機版上方促銷區塊 */}
        <div className="px-2">
          {mobileTopConfigs.length > 0 ? (
            mobileTopConfigs.map(config => renderComponent(config))
          ) : (
            // 預設佈局
            <>
              <MarketplaceHero serverProducts={products} />
              <FlashSale serverProducts={products} serverFlashSale={flashSale} />
              <CategoryGrid serverCategoryDisplays={categoryDisplays} />
              <DailyDeals serverProducts={products} serverDealConfig={todaysDeal} />
              <SuperDeals />
            </>
          )}
        </div>

        {/* 蝦皮風格商品瀑布流（含「猜你喜歡」標題和篩選器） */}
        <Suspense fallback={
          <div className="px-2 py-4">
            <div className="grid grid-cols-2 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-2 space-y-2">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        }>
          <MobileProductFeed serverProducts={products} />
        </Suspense>
      </div>

      {/* ===== 電腦版：原有組件佈局 ===== */}
      <div className="hidden md:block">
        {/* 限時特賣跑馬燈 - 在 header 正下方 */}
        {saleCountdownConfig && renderComponent(saleCountdownConfig)}

        {/* 主要內容區 */}
        <main className="max-w-[1400px] mx-auto px-2 sm:px-4">
          {/* 根據後台配置動態渲染組件（排除 SaleCountdown） */}
          {otherComponentsConfig.length > 0 ? (
            otherComponentsConfig.map(config => renderComponent(config))
          ) : (
            // 如果沒有配置或配置載入失敗，顯示預設佈局
            <>
              <MarketplaceHero serverProducts={products} />
              <FlashSale serverProducts={products} serverFlashSale={flashSale} />
              <DailyDeals serverProducts={products} serverDealConfig={todaysDeal} />
              <CategoryGrid />
              <SuperDeals />
              <PopularProducts serverProducts={products} />
            </>
          )}
        </main>

        {/* 浮動促銷按鈕 - 僅電腦版 */}
        <FloatingPromo />
      </div>

      {/* 頁尾 - 始終顯示 */}
      <MarketplaceFooter />
    </div>
  )
}
