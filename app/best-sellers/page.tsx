'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Star, Trophy, TrendingUp } from 'lucide-react'
import { useQuery, gql } from '@apollo/client'
import WishlistButton from '@/components/product/WishlistButton'
import Breadcrumb from '@/components/common/Breadcrumb'
import QuickAddToCartModal from '@/components/product/QuickAddToCartModal'

// GraphQL 查詢：獲取熱銷產品
const GET_BEST_SELLERS = gql`
  query GetBestSellers($take: Int) {
    products(take: $take, orderBy: { soldCount: DESC }) {
      id
      slug
      name
      price
      originalPrice
      images
      soldCount
      averageRating
      reviewCount
      stock
      category {
        name
        slug
      }
      brand {
        name
        slug
      }
    }
  }
`

export default function BestSellersPage() {
  const [modalProduct, setModalProduct] = useState<{ id: string; name: string } | null>(null)

  const { data, loading, error } = useQuery(GET_BEST_SELLERS, {
    variables: {
      take: 50,
    },
  })

  const products = React.useMemo(() => {
    if (!data?.products) return []

    return data.products.map((product: any, idx: number) => {
      const price = parseFloat(product.price)
      const originalPrice = parseFloat(product.originalPrice) || price
      const soldCount = product.soldCount || 0
      const averageRating = product.averageRating ? Number(product.averageRating) : 0
      const images = Array.isArray(product.images) ? product.images : []
      const image = images.length > 0 ? images[0] : '/api/placeholder/200/200'
      const discount = originalPrice > price ? ((originalPrice - price) / originalPrice) * 100 : 0

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price,
        originalPrice,
        sales: soldCount > 1000 ? `${(soldCount / 1000).toFixed(1)}k` : soldCount.toString(),
        rating: averageRating,
        image,
        discount,
        rank: idx + 1,
        category: product.category,
        brand: product.brand,
      }
    })
  }, [data])

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-orange-400'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400'
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500'
    return 'bg-gray-500'
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">載入熱銷產品失敗</p>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 麵包屑導航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: '熱銷排行' }]} />
        </div>
      </div>

      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-3">
            <Trophy size={32} />
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">熱銷排行榜</h1>
              <p className="opacity-90">最受歡迎的熱銷商品</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 統計資訊 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 text-gray-700">
            <TrendingUp className="text-orange-500" size={20} />
            <span className="font-medium">
              {loading ? '載入中...' : `共 ${products.length} 件熱銷商品`}
            </span>
          </div>
        </div>

        {/* 商品網格 */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="border rounded-lg overflow-hidden bg-white animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-6 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="group border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white"
              >
                <Link href={`/products/${product.slug}`}>
                  {/* 圖片區 */}
                  <div className="relative aspect-square bg-gray-50">
                    {/* 排名標誌 */}
                    {product.rank <= 10 && (
                      <div className={`absolute top-2 left-2 z-10 ${getRankBadge(product.rank)} text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md`}>
                        {product.rank}
                      </div>
                    )}

                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />

                    {/* 願望清單按鈕 - 右上角 */}
                    <div className="absolute top-2 right-2 z-20">
                      <WishlistButton productId={product.id} size="sm" />
                    </div>

                    {/* 快速操作 */}
                    <div className="hidden md:block absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setModalProduct({ id: product.id, name: product.name })
                          }}
                          className="bg-orange-500 text-white px-3 py-2 rounded-full hover:bg-orange-600 flex items-center gap-1"
                        >
                          <ShoppingCart size={16} />
                          <span className="text-xs">加入</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 商品信息 */}
                  <div className="p-3">
                    <h3 className="font-medium text-gray-800 mb-2 line-clamp-2 text-sm min-h-[40px]">
                      {product.name}
                    </h3>

                    <div className="flex items-center justify-between mb-2 text-xs">
                      <span className="text-gray-500">已售 {product.sales}</span>
                      {product.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="text-yellow-400 fill-current" size={12} />
                          <span className="text-gray-600">
                            {typeof product.rating === 'number' ? product.rating.toFixed(1) : Number(product.rating || 0).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-1">
                      <div className="flex flex-col">
                        <span className="text-red-500 font-bold text-base">${product.price}</span>
                        {product.originalPrice > product.price && (
                          <span className="text-gray-400 text-xs line-through">${product.originalPrice}</span>
                        )}
                      </div>
                      {product.discount > 0 && (
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
                          {Math.round(product.discount)}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* 無商品提示 */}
        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">目前沒有熱銷商品</p>
          </div>
        )}
      </div>

      {/* 快速加入購物車 Modal */}
      {modalProduct && (
        <QuickAddToCartModal
          productId={modalProduct.id}
          productName={modalProduct.name}
          onClose={() => setModalProduct(null)}
        />
      )}
    </div>
  )
}
