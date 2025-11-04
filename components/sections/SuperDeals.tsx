'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, TrendingUp, Award, Zap, Package } from 'lucide-react'
import { useQuery, gql } from '@apollo/client'

// GraphQL 查詢：獲取首頁展示的組合套裝（最多3個）
const GET_HOMEPAGE_BUNDLES = gql`
  query GetHomepageBundles {
    homepageBundles {
      id
      name
      slug
      description
      originalPrice
      bundlePrice
      discount
      discountPercent
      image
      isFeatured
      items {
        id
        quantity
        product {
          id
          name
          images
        }
      }
    }
  }
`

const SuperDeals = () => {
  // 查詢組合套裝數據
  const { data, loading } = useQuery(GET_HOMEPAGE_BUNDLES, {
    fetchPolicy: 'cache-and-network',
  })

  const bundleDeals = data?.homepageBundles?.slice(0, 3) || []

  const superDeals = [
    {
      id: 1,
      title: '邀請好友',
      subtitle: '好友首購送購物金',
      image: '/api/placeholder/400/200',
      bgColor: 'from-purple-500 to-pink-500',
      link: '/account/referral'
    },
    {
      id: 2,
      title: '滿額折扣',
      subtitle: '滿$1999現折$300',
      image: '/api/placeholder/400/200',
      bgColor: 'from-blue-500 to-cyan-500',
      link: '/deals/discount'
    },
    {
      id: 3,
      title: '會員升級',
      subtitle: '升級享更多優惠',
      image: '/api/placeholder/400/200',
      bgColor: 'from-orange-500 to-red-500',
      link: '/account'
    }
  ]

  return (
    <div className="my-4 sm:my-6 space-y-4 sm:space-y-6">
      {/* 大型優惠橫幅 */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-xl font-bold text-gray-800 flex items-center gap-1.5 sm:gap-2">
            <Sparkles className="text-yellow-500" size={20} />
            超值優惠
            <span className="text-xs sm:text-sm font-normal text-gray-500 ml-1 sm:ml-2 hidden sm:inline">省錢就是賺錢</span>
          </h2>
          <Link href="/super-deals" className="text-orange-600 hover:text-orange-700 font-medium text-sm sm:text-base">
            探索更多 →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {superDeals.map((deal) => (
            <Link
              key={deal.id}
              href={deal.link}
              className="relative overflow-hidden rounded-lg group cursor-pointer"
            >
              <div className={`h-32 sm:h-40 bg-gradient-to-r ${deal.bgColor} p-4 sm:p-6 flex flex-col justify-center relative`}>
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">{deal.title}</h3>
                <p className="text-sm sm:text-base text-white/90">{deal.subtitle}</p>
                <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4">
                  <span className="bg-white/20 backdrop-blur text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm">
                    立即查看 →
                  </span>
                </div>
                <div className="absolute -right-10 -top-10 w-20 h-20 sm:w-32 sm:h-32 bg-white/10 rounded-full" />
              </div>
            </Link>
          ))}
        </div>

        {/* 套裝優惠 - 只在有數據時顯示 */}
        {!loading && bundleDeals.length > 0 && (
          <div className="border-t pt-4 sm:pt-6">
            <h3 className="font-bold text-sm sm:text-lg text-gray-800 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Zap className="text-orange-500" size={18} />
              組合套裝
              <span className="bg-red-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">限時優惠</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {bundleDeals.map((bundle) => (
                <Link
                  key={bundle.id}
                  href={`/bundles/${bundle.slug}`}
                  className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-yellow-50 to-orange-50 block"
                >
                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex-shrink-0 relative">
                      {bundle.image ? (
                        <Image
                          src={bundle.image}
                          alt={bundle.name}
                          fill
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={32} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base truncate">
                        {bundle.name}
                        {bundle.isFeatured && (
                          <span className="ml-2 text-[10px] bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full">
                            熱門
                          </span>
                        )}
                      </h4>
                      <ul className="text-[10px] sm:text-xs text-gray-600 space-y-0.5 sm:space-y-1 mb-2 sm:mb-3">
                        {bundle.items.slice(0, 3).map((item) => (
                          <li key={item.id} className="flex items-center gap-1 truncate">
                            <span className="text-orange-500 flex-shrink-0">✓</span>
                            <span className="truncate">{item.product.name} x{item.quantity}</span>
                          </li>
                        ))}
                        {bundle.items.length > 3 && (
                          <li className="text-gray-500">...還有 {bundle.items.length - 3} 項</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500 line-through">
                        ${parseFloat(bundle.originalPrice).toFixed(0)}
                      </p>
                      <p className="text-base sm:text-xl font-bold text-red-500">
                        ${parseFloat(bundle.bundlePrice).toFixed(0)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] sm:text-xs text-green-600 font-medium whitespace-nowrap">
                        省 ${parseFloat(bundle.discount || 0).toFixed(0)}
                      </p>
                      <span className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 sm:px-3 rounded text-xs sm:text-sm font-medium transition-colors mt-1 whitespace-nowrap">
                        查看詳情
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 載入中狀態 */}
        {loading && (
          <div className="border-t pt-4 sm:pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          </div>
        )}
      </div>

      {/* 獎勵提示橫幅 */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-lg p-3 sm:p-4 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <Award className="text-white flex-shrink-0" size={24} />
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-lg mb-0.5 sm:mb-1">購物送積分，積分當現金</h3>
              <p className="text-xs sm:text-sm opacity-90">每消費$100即可獲得10積分</p>
            </div>
          </div>
          <Link
            href="/rewards"
            className="bg-white text-orange-600 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-medium hover:shadow-lg transition-shadow text-xs sm:text-sm text-center whitespace-nowrap flex-shrink-0"
          >
            了解更多
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SuperDeals