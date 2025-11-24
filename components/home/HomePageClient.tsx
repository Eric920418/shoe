'use client'

import React from 'react'
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 導航欄 - 始終顯示 */}
      <MarketplaceHeader />

      {/* 系統公告 - 始終顯示 */}
      <AnnouncementWrapper />

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
            <CategoryGrid serverCategoryDisplays={categoryDisplays} />
            <SuperDeals />
            <PopularProducts serverProducts={products} />
          </>
        )}
      </main>

      {/* 頁尾 - 始終顯示 */}
      <MarketplaceFooter />

      {/* 浮動促銷按鈕 - 動態控制 */}
      <FloatingPromo />
    </div>
  )
}
