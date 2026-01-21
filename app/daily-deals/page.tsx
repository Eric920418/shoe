'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Calendar, Star, RefreshCw, Flame, Loader2
} from 'lucide-react'
import { useQuery } from '@apollo/client'
import { GET_HOMEPAGE_PRODUCTS } from '@/graphql/queries'
import { ProductCardImage } from '@/components/common/ProductImage'
import WishlistButton from '@/components/product/WishlistButton'

interface DealProduct {
  id: string
  slug: string
  name: string
  originalPrice: number
  dealPrice: number
  image: string
  discount: number
  stock: number
  soldCount: number
  rating: number
  dealType: string
}

export default function DailyDealsPage() {
  const [timeUntilRefresh, setTimeUntilRefresh] = useState({ hours: 0, minutes: 0, seconds: 0 })

  // 計算距離下次更新（每日 10:00）的時間
  useEffect(() => {
    const calculateTimeUntilNextUpdate = () => {
      const now = new Date()
      const nextUpdate = new Date()
      nextUpdate.setHours(10, 0, 0, 0)

      // 如果已過今天 10:00，設定為明天 10:00
      if (now >= nextUpdate) {
        nextUpdate.setDate(nextUpdate.getDate() + 1)
      }

      const diff = nextUpdate.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      return { hours, minutes, seconds }
    }

    setTimeUntilRefresh(calculateTimeUntilNextUpdate())

    const timer = setInterval(() => {
      setTimeUntilRefresh(calculateTimeUntilNextUpdate())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 查詢產品資料
  const { data, loading, error } = useQuery(GET_HOMEPAGE_PRODUCTS, {
    variables: {
      take: 50, // 取多一點，再過濾有折扣的
    },
  })

  // 過濾並處理有折扣的產品
  const dailyDeals: DealProduct[] = useMemo(() => {
    if (!data?.products) return []

    return data.products
      .filter((product: any) => {
        // 只顯示有折扣的產品（originalPrice > price）
        const price = parseFloat(product.price)
        const originalPrice = parseFloat(product.originalPrice) || price
        return originalPrice > price
      })
      .map((product: any) => {
        const price = parseFloat(product.price)
        const originalPrice = parseFloat(product.originalPrice) || price
        const discount = Math.round((1 - price / originalPrice) * 100)
        const soldCount = product.soldCount || 0
        const averageRating = product.averageRating ? parseFloat(product.averageRating) : 0
        const images = Array.isArray(product.images) ? product.images : []
        const image = images.length > 0 ? images[0] : '/api/placeholder/300/300'

        // 決定標籤
        let dealType = '特價'
        if (soldCount > 100) dealType = '爆款推薦'
        else if (soldCount > 50) dealType = '熱銷單品'
        else if (averageRating >= 4.5) dealType = '好評推薦'
        else if (discount >= 50) dealType = '限量特價'
        else if (soldCount < 10) dealType = '新品特價'

        return {
          id: product.id,
          slug: product.slug,
          name: product.name,
          originalPrice,
          dealPrice: price,
          image,
          discount,
          stock: product.stock || 0,
          soldCount,
          rating: averageRating,
          dealType,
        }
      })
      // 按折扣幅度排序
      .sort((a: any, b: any) => b.discount - a.discount)
  }, [data])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-lg font-medium">載入失敗</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex  sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Calendar className="text-white" size={28} />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">今日特價</h1>
                <p className="text-xs opacity-80">每日 10:00 更新</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 rounded-lg">
              <RefreshCw size={20} />
              <div>
                <p className="text-xs opacity-80">下次更新</p>
                <div className="flex gap-1 text-lg font-bold">
                  <span>{String(timeUntilRefresh.hours).padStart(2, '0')}</span>
                  <span>:</span>
                  <span>{String(timeUntilRefresh.minutes).padStart(2, '0')}</span>
                  <span>:</span>
                  <span>{String(timeUntilRefresh.seconds).padStart(2, '0')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-orange-500" size={40} />
          </div>
        ) : dailyDeals.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">目前沒有特價商品</p>
            <Link href="/products" className="text-orange-500 hover:underline mt-2 inline-block">
              瀏覽所有商品
            </Link>
          </div>
        ) : (
          <>
            {/* 特價商品數量提示 */}
            <div className="flex items-center gap-2 py-4">
              <Flame className="text-orange-500" size={20} />
              <span className="text-gray-700">
                共 <span className="font-bold text-orange-500">{dailyDeals.length}</span> 件特價商品
              </span>
            </div>

            {/* 特價商品網格 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pb-8">
              {dailyDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
                >
                  <Link href={`/products/${deal.slug}`}>
                    <div className="relative aspect-square bg-gray-100">
                      <ProductCardImage
                        src={deal.image}
                        alt={deal.name}
                        hoverScale
                      />

                      {/* 標籤 */}
                      <div className="absolute top-2 left-2">
                        <span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                          {deal.dealType}
                        </span>
                      </div>

                      {/* 折扣 */}
                      <div className="absolute top-10 right-2 bg-red-500 text-white px-2 py-1 rounded">
                        <span className="text-lg font-bold">{deal.discount}%</span>
                        <span className="text-xs block">OFF</span>
                      </div>

                      {/* 願望清單按鈕 */}
                      <div className="absolute top-2 right-2 z-20">
                        <WishlistButton productId={deal.id} size="sm" />
                      </div>

                      {/* 庫存進度 */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur p-2">
                        <div className="flex justify-end text-white text-[10px] mb-1">
                          <span>剩餘 {deal.stock}</span>
                        </div>
                        <div className="w-full bg-white/30 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                            style={{ width: `${Math.min(80, Math.max(20, 100 - (deal.stock / 50) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-1">
                        {deal.name}
                      </h3>

                      <div className="flex items-center gap-1 mb-2">
                        <Star className="text-yellow-400 fill-current" size={12} />
                        <span className="text-xs text-gray-600">
                          {deal.rating > 0 ? deal.rating.toFixed(1) : '暫無評價'}
                        </span>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] text-gray-400 line-through">
                            ${deal.originalPrice}
                          </p>
                          <p className="text-base font-bold text-red-500">
                            ${deal.dealPrice}
                          </p>
                        </div>
                        <button className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs">
                          搶
                        </button>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}