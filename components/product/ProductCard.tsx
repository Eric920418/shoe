'use client'

import Link from 'next/link'
import Image from 'next/image'
import WishlistButton from './WishlistButton'

interface ProductCardProps {
  product: {
    id: string
    slug: string
    name: string
    price: number
    originalPrice?: number
    images: string | string[]
    stock?: number
    category?: {
      name: string
      slug: string
    }
    brand?: {
      name: string
      logo?: string
    }
    isFeatured?: boolean
    isNewArrival?: boolean
  }
  showWishlist?: boolean
  className?: string
}

export default function ProductCard({
  product,
  showWishlist = true,
  className = ''
}: ProductCardProps) {
  // 解析圖片
  const images = typeof product.images === 'string'
    ? JSON.parse(product.images || '[]')
    : product.images
  const mainImage = images[0] || '/placeholder-product.png'

  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const isOutOfStock = product.stock === 0

  return (
    <div className={`group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden ${className}`}>
      {/* 產品圖片區 */}
      <div className="relative aspect-square bg-gray-100">
        <Link href={`/products/${product.slug}`}>
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* 願望清單按鈕 - 右上角 */}
        {showWishlist && (
          <div className="absolute top-2 right-2 z-20">
            <WishlistButton productId={product.id} size="sm" />
          </div>
        )}

        {/* 徽章 */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
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
          {product.isNewArrival && !isOutOfStock && (
            <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded">
              新品
            </span>
          )}
          {hasDiscount && !isOutOfStock && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
              特價
            </span>
          )}
        </div>
      </div>

      {/* 產品資訊 */}
      <Link href={`/products/${product.slug}`} className="block p-4">
        {/* 品牌 */}
        {product.brand && (
          <p className="text-xs text-gray-500 mb-1">{product.brand.name}</p>
        )}

        {/* 產品名稱 */}
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* 價格 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">
            NT$ {Number(product.price).toLocaleString()}
          </span>
          {hasDiscount && (
            <>
              <span className="text-sm text-gray-500 line-through">
                NT$ {Number(product.originalPrice).toLocaleString()}
              </span>
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                {Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)}% OFF
              </span>
            </>
          )}
        </div>

        {/* 分類 */}
        {product.category && (
          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
            {product.category.name}
          </span>
        )}
      </Link>
    </div>
  )
}
