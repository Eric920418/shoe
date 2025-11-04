'use client'

import { useQuery, useMutation } from '@apollo/client'
import { GET_MY_WISHLIST, REMOVE_FROM_WISHLIST, CLEAR_WISHLIST } from '@/graphql/queries'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import WishlistButton from '@/components/product/WishlistButton'

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // 獲取願望清單
  const { data, loading, error, refetch } = useQuery(GET_MY_WISHLIST, {
    skip: !user,
    fetchPolicy: 'network-only',
  })

  // 清空願望清單
  const [clearWishlist, { loading: clearing }] = useMutation(CLEAR_WISHLIST, {
    onCompleted: () => {
      toast.success('已清空願望清單')
      refetch()
    },
    onError: (error) => {
      toast.error(`清空失敗：${error.message}`)
    },
  })

  // 如果未登入，重定向到登入頁
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('請先登入')
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-red-900 mb-2">載入失敗</h3>
            <p className="text-red-700 mb-4">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              重試
            </button>
          </div>
        </div>
      </div>
    )
  }

  const wishlistItems = data?.myWishlist || []
  const isEmpty = wishlistItems.length === 0

  const handleClearWishlist = () => {
    if (window.confirm('確定要清空願望清單嗎？此操作無法復原。')) {
      clearWishlist()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">我的願望清單</h1>
              <p className="text-gray-600 mt-2">
                {isEmpty ? '還沒有收藏任何商品' : `共 ${wishlistItems.length} 件商品`}
              </p>
            </div>

            {!isEmpty && (
              <button
                onClick={handleClearWishlist}
                disabled={clearing}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {clearing ? '清空中...' : '清空願望清單'}
              </button>
            )}
          </div>

          {/* Breadcrumb */}
          <nav className="flex text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900">
              首頁
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">願望清單</span>
          </nav>
        </div>

        {/* Empty State */}
        {isEmpty && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="w-24 h-24 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">願望清單是空的</h3>
            <p className="text-gray-600 mb-6">
              瀏覽我們的商品，點擊愛心圖示收藏您喜歡的商品吧！
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              開始購物
            </Link>
          </div>
        )}

        {/* Wishlist Grid */}
        {!isEmpty && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item: any) => {
              const product = item.product
              const images = Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]')
              const mainImage = images[0] || '/placeholder-product.png'
              const isOutOfStock = product.stock === 0

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                >
                  <Link href={`/products/${product.slug}`} className="block relative">
                    {/* Product Image */}
                    <div className="relative aspect-square bg-gray-100">
                      <Image
                        src={mainImage}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Wishlist Button */}
                      <div className="absolute top-2 right-2 z-10">
                        <WishlistButton productId={product.id} size="sm" />
                      </div>

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-2">
                        {isOutOfStock && (
                          <span className="px-2 py-1 bg-gray-900 text-white text-xs font-semibold rounded">
                            售完
                          </span>
                        )}
                        {product.isFeatured && !isOutOfStock && (
                          <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">
                            精選
                          </span>
                        )}
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
                            特價
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      {/* Brand */}
                      {product.brand && (
                        <p className="text-xs text-gray-500 mb-1">{product.brand.name}</p>
                      )}

                      {/* Product Name */}
                      <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                        {product.name}
                      </h3>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-gray-900">
                          NT$ {Number(product.price).toLocaleString()}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-gray-500 line-through">
                            NT$ {Number(product.originalPrice).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Category & Gender */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        {product.category && (
                          <span className="px-2 py-1 bg-gray-100 rounded">{product.category.name}</span>
                        )}
                        {product.gender && (
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            {product.gender === 'MEN'
                              ? '男款'
                              : product.gender === 'WOMEN'
                              ? '女款'
                              : product.gender === 'UNISEX'
                              ? '中性'
                              : '兒童'}
                          </span>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          router.push(`/products/${product.slug}`)
                        }}
                        disabled={isOutOfStock}
                        className={`
                          w-full py-2 rounded-lg text-sm font-medium transition-colors
                          ${
                            isOutOfStock
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-900 text-white hover:bg-gray-800'
                          }
                        `}
                      >
                        {isOutOfStock ? '已售完' : '查看商品'}
                      </button>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        {/* Continue Shopping Link */}
        {!isEmpty && (
          <div className="mt-12 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>繼續購物</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
