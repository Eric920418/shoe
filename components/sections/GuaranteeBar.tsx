'use client'

import React from 'react'
import { Shield, Truck, RefreshCw, HeadphonesIcon, CreditCard, Award, Star, Gift, Zap, Heart, CheckCircle, Clock } from 'lucide-react'
import { useQuery, gql } from '@apollo/client'

// GraphQL 查詢：獲取服務保證項目
const GET_GUARANTEE_ITEMS = gql`
  query GetGuaranteeItems {
    guaranteeItems {
      id
      icon
      title
      description
      sortOrder
      isActive
    }
  }
`

/**
 * 服務保證欄組件
 *
 * 優化說明：
 * ✅ 保留 GraphQL 查詢（支援後台動態管理）
 * ✅ fetchPolicy 改為 cache-first（優先使用快取）
 * ✅ 減少網路請求：首次載入後會快取結果，換頁返回時直接用快取
 *
 * 原 cache-and-network：每次都發請求 + 用快取
 * 新 cache-first：優先用快取，沒快取才發請求
 */

const GuaranteeBar = () => {
  // 查詢服務保證項目（優化：改用 cache-first）
  const { data } = useQuery(GET_GUARANTEE_ITEMS, {
    fetchPolicy: 'cache-first', // 👈 優化重點：優先使用快取
    nextFetchPolicy: 'cache-first',
  })

  // 圖標映射表
  const iconMap: { [key: string]: any } = {
    Shield,
    Truck,
    RefreshCw,
    HeadphonesIcon,
    CreditCard,
    Award,
    Star,
    Gift,
    Zap,
    Heart,
    CheckCircle,
    Clock
  }

  // 預設服務保證項目（後台未設定時使用）
  const defaultGuarantees = [
    {
      icon: 'Shield',
      title: '100%正品',
      description: '假一賠十',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: 'Truck',
      title: '全館免運',
      description: '滿$399即享',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: 'RefreshCw',
      title: '7天鑑賞',
      description: '不滿意包退',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: 'HeadphonesIcon',
      title: '24H客服',
      description: '隨時為您服務',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: 'CreditCard',
      title: '安全支付',
      description: '多元付款方式',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: 'Award',
      title: '會員優惠',
      description: 'VIP專屬折扣',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ]

  // 顏色配置（用於後台數據）
  const colorConfigs = [
    { color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { color: 'text-green-600', bgColor: 'bg-green-50' },
    { color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { color: 'text-red-600', bgColor: 'bg-red-50' },
    { color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
  ]

  // 使用後台數據或預設數據
  const guarantees = React.useMemo(() => {
    if (data?.guaranteeItems && data.guaranteeItems.length > 0) {
      return data.guaranteeItems
        .filter((item: any) => item.isActive)
        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        .slice(0, 6) // 最多顯示6個
        .map((item: any, index: number) => ({
          ...item,
          ...colorConfigs[index % colorConfigs.length] // 根據索引分配顏色
        }))
    }
    return defaultGuarantees
  }, [data])

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 my-3 sm:my-4">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
        {guarantees.map((item: any, index: number) => {
          const Icon = iconMap[item.icon] || Shield
          return (
            <div key={item.id || index} className="flex flex-col items-center text-center group cursor-pointer">
              <div className={`${item.bgColor} p-2 sm:p-3 rounded-full mb-1 sm:mb-2 group-hover:scale-110 transition-transform`}>
                <Icon className={item.color} size={18} />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-800">{item.title}</h4>
              <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{item.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default GuaranteeBar
