'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, Gift, Package, Users, ShoppingBag, Zap, Heart, TrendingUp } from 'lucide-react'

export default function SuperDealsPage() {
  const [activeTab, setActiveTab] = useState('bundles')

  const bundleDeals = [
    {
      id: 1,
      title: '情侶套裝',
      description: '男女各一雙，甜蜜出行',
      items: ['男款運動鞋 x1', '女款運動鞋 x1', '專屬購物袋 x2'],
      originalPrice: 4999,
      bundlePrice: 2999,
      saved: 2000,
      image: '/api/placeholder/400/300',
      tag: '情人節特惠'
    },
    {
      id: 2,
      title: '家庭套餐',
      description: '全家都有新鞋穿',
      items: ['成人鞋 x2', '童鞋 x1', '清潔套裝 x1'],
      originalPrice: 5999,
      bundlePrice: 3499,
      saved: 2500,
      image: '/api/placeholder/400/300',
      tag: '限量100套'
    }
  ]

  const referralBenefits = [
    { icon: '💰', title: '邀請獎勵', desc: '每邀請一位好友購買，獲得$100購物金' },
    { icon: '🎁', title: '首購優惠', desc: '好友首次購買享85折優惠' },
    { icon: '📈', title: '累積獎勵', desc: '邀請越多，獎勵越豐厚' },
    { icon: '♾️', title: '永久有效', desc: '邀請碼永不過期，持續賺取獎勵' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-8 text-center">
          <Sparkles className="mx-auto mb-3 animate-pulse" size={40} />
          <h1 className="text-3xl font-bold mb-2">超值優惠專區</h1>
          <p className="opacity-90">套裝優惠 · 滿額贈禮 · 邀請獎勵</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 標籤切換 */}
        <div className="bg-white rounded-lg shadow-sm p-1 mb-6 flex">
          {['bundles', 'referral', 'membership'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab === 'bundles' && '套裝優惠'}
              {tab === 'referral' && '邀請好友'}
              {tab === 'membership' && '會員專屬'}
            </button>
          ))}
        </div>

        {/* 套裝優惠 */}
        {activeTab === 'bundles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bundleDeals.map((bundle) => (
              <div key={bundle.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg">
                <div className="h-48 bg-gradient-to-r from-purple-100 to-pink-100 p-6">
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    省 ${bundle.saved}
                  </span>
                  <h3 className="text-2xl font-bold text-gray-800 mt-3">{bundle.title}</h3>
                  <p className="text-gray-600 mt-1">{bundle.description}</p>
                </div>
                <div className="p-6">
                  <ul className="space-y-2 mb-4">
                    {bundle.items.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Package size={16} className="text-purple-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-gray-400 line-through">${bundle.originalPrice}</p>
                      <p className="text-2xl font-bold text-purple-600">${bundle.bundlePrice}</p>
                    </div>
                    <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium">
                      立即搶購
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 邀請好友 */}
        {activeTab === 'referral' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-8">
              <Users className="mx-auto text-purple-500 mb-4" size={64} />
              <h2 className="text-2xl font-bold mb-2">邀請好友，賺取獎勵</h2>
              <p className="text-gray-600">分享你的專屬邀請碼，好友購買你就賺</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {referralBenefits.map((benefit, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-4xl mb-2">{benefit.icon}</div>
                  <h4 className="font-bold text-gray-800">{benefit.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{benefit.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-purple-50 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">你的專屬邀請碼</p>
              <div className="bg-white rounded-lg p-4 text-2xl font-bold text-purple-600 mb-4">
                SHOE2024
              </div>
              <button className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-lg font-medium">
                複製邀請連結
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}