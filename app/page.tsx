'use client'

import React, { useEffect, useState } from 'react'
import { useQuery, gql } from '@apollo/client'
import MarketplaceHeader from '@/components/navigation/MarketplaceHeader'
import MarketplaceFooter from '@/components/common/MarketplaceFooter'
import MarketplaceHero from '@/components/sections/MarketplaceHero'
import FlashSale from '@/components/sections/FlashSale'
import CategoryGrid from '@/components/sections/CategoryGrid'
import DailyDeals from '@/components/sections/DailyDeals'
import SuperDeals from '@/components/sections/SuperDeals'
import PopularProducts from '@/components/sections/PopularProducts'
import GuaranteeBar from '@/components/sections/GuaranteeBar'
import AnnouncementWrapper from '@/components/common/AnnouncementWrapper'
import FloatingPromo from '@/components/common/FloatingPromo'
import SaleCountdown from '@/components/sections/SaleCountdown'

// GraphQL 查詢：獲取首頁配置
const GET_HOMEPAGE_CONFIG = gql`
  query GetHomepageConfig {
    homepageConfigs(isActive: true) {
      componentId
      componentType
      title
      subtitle
      isActive
      sortOrder
      settings
      mobileSettings
    }
  }
`

// 組件映射表
const COMPONENT_MAP = {
  HERO_SLIDER: MarketplaceHero,
  SALE_COUNTDOWN: SaleCountdown,
  GUARANTEE_BAR: GuaranteeBar,
  FLASH_SALE: FlashSale,
  CATEGORY_GRID: CategoryGrid,
  DAILY_DEALS: DailyDeals,
  SUPER_DEALS: SuperDeals,
  POPULAR_PRODUCTS: PopularProducts,
  // 可以添加更多組件映射
}

export default function HomePage() {
  const [componentsConfig, setComponentsConfig] = useState([])
  const { data, loading, error } = useQuery(GET_HOMEPAGE_CONFIG, {
    fetchPolicy: 'cache-and-network',
  })

  // 處理配置數據
  useEffect(() => {
    if (data?.homepageConfigs) {
      // 按照 sortOrder 排序
      const sortedConfigs = [...data.homepageConfigs]
        .filter(config => config.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
      setComponentsConfig(sortedConfigs)
    }
  }, [data])

  // 渲染動態組件
  const renderComponent = (config) => {
    const Component = COMPONENT_MAP[config.componentType]

    if (!Component) {
      console.warn(`未找到組件類型: ${config.componentType}`)
      return null
    }

    // 傳遞配置給組件
    return (
      <Component
        key={config.componentId}
        title={config.title}
        subtitle={config.subtitle}
        settings={config.settings}
        mobileSettings={config.mobileSettings}
      />
    )
  }

  // 檢查特定組件是否啟用
  const isComponentEnabled = (componentType) => {
    return componentsConfig.some(
      config => config.componentType === componentType && config.isActive
    )
  }

  // 載入中狀態
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  // 錯誤狀態
  if (error) {
    console.error('載入首頁配置失敗:', error)
    // 顯示預設佈局
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部促銷倒計時 - 動態控制 */}
      {isComponentEnabled('SALE_COUNTDOWN') && <SaleCountdown />}

      {/* 導航欄 - 始終顯示 */}
      <MarketplaceHeader />

      {/* 系統公告 - 始終顯示 */}
      <AnnouncementWrapper />

      {/* 主要內容區 */}
      <main className="max-w-[1400px] mx-auto px-2 sm:px-4">
        {/* 動態渲染所有啟用的組件 */}
        {componentsConfig.map(config => {
          // 跳過已經單獨處理的組件
          if (config.componentType === 'SALE_COUNTDOWN') return null

          return (
            <div key={config.componentId} className="homepage-component">
              {renderComponent(config)}
            </div>
          )
        })}

        {/* 如果沒有配置或載入失敗，顯示預設佈局 */}
        {componentsConfig.length === 0 && !loading && (
          <>
            <MarketplaceHero />
            <GuaranteeBar />
            <FlashSale />
            <CategoryGrid />
            <DailyDeals />
            <SuperDeals />
            <PopularProducts />
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