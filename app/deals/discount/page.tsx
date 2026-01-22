'use client'

import React, { useState } from 'react'
import { useQuery, gql } from '@apollo/client'
import { ShoppingCart, Check, Percent } from 'lucide-react'

const GET_DISCOUNT_PAGE_CONFIG = gql`
  query GetDiscountPageConfig {
    discountPageConfig {
      tiers {
        id
        minAmount
        discount
        title
        description
        benefits
        bgColor
      }
      additionalOffers {
        id
        icon
        title
        description
      }
    }
  }
`

// 預設資料（當資料庫沒有資料時使用）
const defaultTiers = [
  {
    id: 'default-1',
    minAmount: '999',
    discount: '50',
    title: '滿$999',
    description: '立減$50',
    benefits: ['免運費', '會員積分x1.2'],
    bgColor: 'from-green-500 to-teal-500'
  },
  {
    id: 'default-2',
    minAmount: '1999',
    discount: '200',
    title: '滿$1999',
    description: '立減$200',
    benefits: ['免運費', '會員積分x1.5', '贈品牌購物袋'],
    bgColor: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'default-3',
    minAmount: '2999',
    discount: '400',
    title: '滿$2999',
    description: '立減$400',
    benefits: ['免運費', '會員積分x2', '贈品牌購物袋', '優先發貨'],
    bgColor: 'from-purple-500 to-pink-500'
  },
  {
    id: 'default-4',
    minAmount: '4999',
    discount: '800',
    title: '滿$4999',
    description: '立減$800',
    benefits: ['免運費', '會員積分x3', '贈品牌購物袋', '優先發貨', 'VIP客服'],
    bgColor: 'from-orange-500 to-red-500'
  }
]

const defaultOffers = [
  { id: 'default-1', icon: '🎁', title: '生日月特惠', description: '生日月份額外95折' },
  { id: 'default-2', icon: '👥', title: '團購優惠', description: '3人以上團購享額外折扣' },
  { id: 'default-3', icon: '📱', title: 'APP專屬', description: 'APP下單額外減$20' },
  { id: 'default-4', icon: '💳', title: '信用卡優惠', description: '指定信用卡再享5%回饋' }
]

export default function DiscountPage() {
  const [selectedTier, setSelectedTier] = useState(0)
  const [orderAmount, setOrderAmount] = useState('')
  const [calculatedDiscount, setCalculatedDiscount] = useState<number | null>(null)

  const { data, loading } = useQuery(GET_DISCOUNT_PAGE_CONFIG)

  // 使用資料庫數據，如果沒有則使用預設數據
  const discountTiers = data?.discountPageConfig?.tiers?.length > 0
    ? data.discountPageConfig.tiers
    : defaultTiers

  const additionalOffers = data?.discountPageConfig?.additionalOffers?.length > 0
    ? data.discountPageConfig.additionalOffers
    : defaultOffers

  // 計算折扣
  const calculateDiscount = () => {
    const amount = parseFloat(orderAmount)
    if (isNaN(amount) || amount <= 0) {
      setCalculatedDiscount(null)
      return
    }

    // 找到適用的最高折扣階梯
    let discount = 0
    for (const tier of [...discountTiers].sort((a, b) => parseFloat(b.minAmount) - parseFloat(a.minAmount))) {
      if (amount >= parseFloat(tier.minAmount)) {
        discount = parseFloat(tier.discount)
        break
      }
    }

    setCalculatedDiscount(discount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="text-center">
            <Percent className="mx-auto mb-2 md:mb-3" size={32} />
            <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">滿額折扣</h1>
            <p className="opacity-90 text-sm md:text-base">買越多，省越多</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 折扣階梯 */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          {discountTiers.map((tier: any, index: number) => (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(index)}
              className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                selectedTier === index ? 'ring-2 md:ring-4 ring-orange-500 shadow-lg' : 'shadow-sm'
              }`}
            >
              <div className={`h-24 md:h-32 bg-gradient-to-r ${tier.bgColor} p-3 md:p-4 text-white`}>
                <h3 className="text-lg md:text-2xl font-bold">{tier.title}</h3>
                <p className="text-xl md:text-3xl font-bold mt-1 md:mt-2">{tier.description}</p>
              </div>
              <div className="bg-white p-3 md:p-4">
                <ul className="space-y-1 md:space-y-2">
                  {(tier.benefits || []).map((benefit: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-700">
                      <Check size={14} className="text-green-500 shrink-0" />
                      <span className="truncate">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {selectedTier === index && (
                <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-yellow-400 text-black px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold">
                  選擇
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 計算器 */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center gap-2">
            <ShoppingCart className="text-orange-500" size={20} />
            折扣計算器
          </h2>
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <input
              type="number"
              value={orderAmount}
              onChange={(e) => setOrderAmount(e.target.value)}
              placeholder="輸入訂單金額"
              className="flex-1 px-3 md:px-4 py-2.5 md:py-3 border rounded-lg text-sm md:text-base"
            />
            <button
              onClick={calculateDiscount}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-lg font-medium text-sm md:text-base whitespace-nowrap"
            >
              計算折扣
            </button>
          </div>
          {calculatedDiscount !== null && (
            <div className="mt-4 p-4 bg-orange-50 rounded-lg">
              <p className="text-lg font-semibold text-orange-800">
                {calculatedDiscount > 0 ? (
                  <>
                    可折扣 <span className="text-2xl text-orange-600">${calculatedDiscount}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      (實付 ${(parseFloat(orderAmount) - calculatedDiscount).toLocaleString()})
                    </span>
                  </>
                ) : (
                  <span className="text-gray-600">未達滿額折扣門檻</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* 額外優惠 */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">額外優惠</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            {additionalOffers.map((offer: any) => (
              <div key={offer.id} className="text-center p-2 md:p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl md:text-3xl mb-1 md:mb-2">{offer.icon}</div>
                <h4 className="font-medium text-gray-800 text-sm md:text-base">{offer.title}</h4>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">{offer.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
