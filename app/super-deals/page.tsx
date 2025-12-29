'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, Gift, Package, Users, ShoppingBag, Zap, Heart, TrendingUp } from 'lucide-react'
import { useQuery, gql } from '@apollo/client'
import Breadcrumb from '@/components/common/Breadcrumb'

// GraphQL 查詢：獲取正在進行中的組合套裝
const GET_ACTIVE_BUNDLES = gql`
  query GetActiveBundles {
    activeBundles {
      id
      name
      slug
      description
      originalPrice
      bundlePrice
      discount
      discountPercent
      image
      images
      isFeatured
      items {
        id
        quantity
        product {
          id
          name
          price
          images
        }
      }
    }
  }
`

export default function SuperDealsPage() {
  const [activeTab, setActiveTab] = useState('bundles')

  // 查詢真實的組合套裝數據
  const { data, loading, error } = useQuery(GET_ACTIVE_BUNDLES, {
    fetchPolicy: 'cache-and-network',
  })

  const bundleDeals = data?.activeBundles || []

  const referralBenefits = [
    { icon: '💰', title: '邀請獎勵', desc: '每邀請一位好友購買，獲得$100購物金' },
    { icon: '🎁', title: '持續獎勵', desc: '好友每次購買你都能獲得獎勵' },
    { icon: '📈', title: '累積獎勵', desc: '邀請越多，獎勵越豐厚' },
    { icon: '♾️', title: '永久有效', desc: '邀請碼永不過期，持續賺取獎勵' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 麵包屑導航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: '超值優惠' }]} />
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-8 text-center">
          <Sparkles className="mx-auto mb-3 animate-pulse" size={40} />
          <h1 className="text-3xl font-bold mb-2">超值優惠專區</h1>
          <p className="opacity-90">套裝優惠 · 滿額贈禮 · 邀請獎勵</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-3">
        {/* 標籤切換 */}
        <div className="bg-white rounded-lg shadow-sm p-1 mb-2 flex">
          {['bundles', 'referral', 'membership'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 rounded-lg font-medium transition-colors ${
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
          <div>
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                <p className="mt-4 text-gray-600">載入中...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600">載入套裝優惠失敗: {error.message}</p>
              </div>
            )}

            {!loading && !error && bundleDeals.length === 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                <Package className="mx-auto text-gray-400 mb-4" size={64} />
                <p className="text-gray-600 text-lg">目前沒有進行中的套裝優惠</p>
                <p className="text-gray-500 text-sm mt-2">敬請期待更多優惠組合！</p>
              </div>
            )}

            {!loading && !error && bundleDeals.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bundleDeals.map((bundle) => (
                  <Link
                    key={bundle.id}
                    href={`/bundles/${bundle.slug}`}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="h-48 bg-gradient-to-r from-purple-100 to-pink-100 p-6 relative">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        省 ${parseFloat(bundle.discount || 0).toFixed(0)}
                      </span>
                      {bundle.isFeatured && (
                        <span className="absolute top-6 right-6 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold">
                          熱門
                        </span>
                      )}
                      <h3 className="text-2xl font-bold text-gray-800 mt-3">{bundle.name}</h3>
                      {bundle.description && (
                        <p className="text-gray-600 mt-1 line-clamp-2">{bundle.description}</p>
                      )}
                    </div>
                    <div className="p-6">
                      <ul className="space-y-2 mb-4">
                        {bundle.items.map((item) => (
                          <li key={item.id} className="flex items-center gap-2 text-sm">
                            <Package size={16} className="text-purple-500 flex-shrink-0" />
                            <span className="truncate">
                              {item.product.name} x{item.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-gray-400 line-through text-sm">
                            ${parseFloat(bundle.originalPrice).toFixed(0)}
                          </p>
                          <p className="text-2xl font-bold text-purple-600">
                            ${parseFloat(bundle.bundlePrice).toFixed(0)}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            省 {parseFloat(bundle.discountPercent || 0).toFixed(0)}%
                          </p>
                        </div>
                        <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                          立即搶購
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
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