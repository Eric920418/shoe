'use client'

import React, { useState } from 'react'
import { Tag, ShoppingCart, Check, TrendingUp, Gift, Percent } from 'lucide-react'

export default function DiscountPage() {
  const [selectedTier, setSelectedTier] = useState(0)

  const discountTiers = [
    {
      minAmount: 999,
      discount: 50,
      title: '滿$999',
      description: '立減$50',
      benefits: ['免運費', '會員積分x1.2'],
      bgColor: 'from-green-500 to-teal-500'
    },
    {
      minAmount: 1999,
      discount: 200,
      title: '滿$1999',
      description: '立減$200',
      benefits: ['免運費', '會員積分x1.5', '贈品牌購物袋'],
      bgColor: 'from-blue-500 to-cyan-500'
    },
    {
      minAmount: 2999,
      discount: 400,
      title: '滿$2999',
      description: '立減$400',
      benefits: ['免運費', '會員積分x2', '贈品牌購物袋', '優先發貨'],
      bgColor: 'from-purple-500 to-pink-500'
    },
    {
      minAmount: 4999,
      discount: 800,
      title: '滿$4999',
      description: '立減$800',
      benefits: ['免運費', '會員積分x3', '贈品牌購物袋', '優先發貨', 'VIP客服'],
      bgColor: 'from-orange-500 to-red-500'
    }
  ]

  const additionalOffers = [
    { icon: '🎁', title: '生日月特惠', desc: '生日月份額外95折' },
    { icon: '👥', title: '團購優惠', desc: '3人以上團購享額外折扣' },
    { icon: '📱', title: 'APP專屬', desc: 'APP下單額外減$20' },
    { icon: '💳', title: '信用卡優惠', desc: '指定信用卡再享5%回饋' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Percent className="mx-auto mb-3" size={40} />
            <h1 className="text-3xl font-bold mb-2">滿額折扣</h1>
            <p className="opacity-90">買越多，省越多</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 折扣階梯 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {discountTiers.map((tier, index) => (
            <div
              key={index}
              onClick={() => setSelectedTier(index)}
              className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                selectedTier === index ? 'ring-4 ring-orange-500 shadow-lg scale-105' : 'shadow-sm'
              }`}
            >
              <div className={`h-32 bg-gradient-to-r ${tier.bgColor} p-4 text-white`}>
                <h3 className="text-2xl font-bold">{tier.title}</h3>
                <p className="text-3xl font-bold mt-2">{tier.description}</p>
              </div>
              <div className="bg-white p-4">
                <ul className="space-y-2">
                  {tier.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check size={16} className="text-green-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              {selectedTier === index && (
                <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold">
                  當前選擇
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 計算器 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShoppingCart className="text-orange-500" />
            折扣計算器
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="number"
              placeholder="輸入訂單金額"
              className="flex-1 px-4 py-3 border rounded-lg"
            />
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium">
              計算折扣
            </button>
          </div>
        </div>

        {/* 額外優惠 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">額外優惠</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {additionalOffers.map((offer, idx) => (
              <div key={idx} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">{offer.icon}</div>
                <h4 className="font-medium text-gray-800">{offer.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{offer.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}