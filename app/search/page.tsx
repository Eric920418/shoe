'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery, gql } from '@apollo/client'
import {
  Search, Filter, Star, Heart, ShoppingBag,
  ChevronDown, TrendingUp, Package, Sparkles
} from 'lucide-react'
import WishlistButton from '@/components/product/WishlistButton'
import Breadcrumb from '@/components/common/Breadcrumb'

// GraphQL 查詢
const SEARCH_PRODUCTS = gql`
  query SearchProducts(
    $search: String
    $take: Int
    $skip: Int
    $categoryId: String
    $brandId: String
    $minPrice: Float
    $maxPrice: Float
    $gender: ProductGender
  ) {
    products(
      search: $search
      take: $take
      skip: $skip
      categoryId: $categoryId
      brandId: $brandId
      minPrice: $minPrice
      maxPrice: $maxPrice
      gender: $gender
    ) {
      id
      name
      slug
      price
      originalPrice
      images
      stock
      soldCount
      averageRating
      reviewCount
      category {
        id
        name
      }
      brand {
        id
        name
      }
    }
  }
`

const GET_BRANDS = gql`
  query GetBrands {
    brands {
      id
      name
      slug
    }
  }
`

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      slug
    }
  }
`

function SearchPageContent() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') || ''

  const [sortBy, setSortBy] = useState('relevance')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // 查詢產品
  const { data: productsData, loading: productsLoading, error: productsError } = useQuery(SEARCH_PRODUCTS, {
    variables: {
      search: searchQuery,
      take: 50,
      brandId: selectedBrand !== 'all' ? selectedBrand : undefined,
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
      minPrice: priceRange === '0-999' ? 0 : priceRange === '1000-1999' ? 1000 : priceRange === '2000-2999' ? 2000 : priceRange === '3000+' ? 3000 : undefined,
      maxPrice: priceRange === '0-999' ? 999 : priceRange === '1000-1999' ? 1999 : priceRange === '2000-2999' ? 2999 : undefined,
    },
    skip: !searchQuery,
  })

  // 查詢品牌列表
  const { data: brandsData } = useQuery(GET_BRANDS)

  // 查詢分類列表
  const { data: categoriesData } = useQuery(GET_CATEGORIES)

  const products = productsData?.products || []
  const brands = brandsData?.brands || []
  const categories = categoriesData?.categories || []

  // 排序產品
  const sortedProducts = React.useMemo(() => {
    if (!products.length) return []

    const sorted = [...products]

    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
      case 'price-high':
        return sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
      case 'rating':
        return sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      case 'sales':
        return sorted.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      case 'newest':
        return sorted.reverse()
      default:
        return sorted
    }
  }, [products, sortBy])

  const priceRanges = [
    { value: 'all', label: '全部價格' },
    { value: '0-999', label: '$999以下' },
    { value: '1000-1999', label: '$1000-$1999' },
    { value: '2000-2999', label: '$2000-$2999' },
    { value: '3000+', label: '$3000以上' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 麵包屑導航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: '搜尋結果' }]} />
        </div>
      </div>

      {/* 搜尋標題 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="text-center">
            <Search className="mx-auto mb-2" size={32} />
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {searchQuery ? `搜尋: "${searchQuery}"` : '搜尋商品'}
            </h1>
            {!productsLoading && products.length > 0 && (
              <p className="text-sm sm:text-base opacity-90">
                找到 {products.length} 件商品
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4">
        {/* 篩選區 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 品牌篩選 */}
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">品牌</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedBrand('all')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedBrand === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  全部品牌
                </button>
                {brands.slice(0, 6).map((brand: any) => (
                  <button
                    key={brand.id}
                    onClick={() => setSelectedBrand(brand.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedBrand === brand.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 分類篩選 */}
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">分類</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  全部分類
                </button>
                {categories.slice(0, 5).map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 排序和價格 */}
            <div className="flex gap-2">
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                {priceRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                <option value="relevance">最相關</option>
                <option value="sales">銷量優先</option>
                <option value="price-low">價格低到高</option>
                <option value="price-high">價格高到低</option>
                <option value="rating">評價最高</option>
                <option value="newest">最新上架</option>
              </select>

              <div className="flex rounded-lg border">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading 狀態 */}
        {productsLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">搜尋中...</p>
            </div>
          </div>
        )}

        {/* Error 狀態 */}
        {productsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">載入失敗：{productsError.message}</p>
          </div>
        )}

        {/* 沒有搜尋關鍵字 */}
        {!searchQuery && !productsLoading && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <Search className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-gray-600 text-lg">請輸入搜尋關鍵字</p>
            <p className="text-gray-500 text-sm mt-2">試試熱門關鍵字：Nike、運動鞋、限時特價</p>
          </div>
        )}

        {/* 沒有搜尋結果 */}
        {searchQuery && !productsLoading && !productsError && sortedProducts.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <Package className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-gray-600 text-lg">找不到 "{searchQuery}" 的相關商品</p>
            <p className="text-gray-500 text-sm mt-2">試試其他關鍵字或瀏覽熱門商品</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link href="/" className="text-blue-500 hover:text-blue-600">
                返回首頁
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/flash-sale" className="text-blue-500 hover:text-blue-600">
                限時搶購
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/new-arrivals" className="text-blue-500 hover:text-blue-600">
                新品上市
              </Link>
            </div>
          </div>
        )}

        {/* 產品網格/列表 */}
        {!productsLoading && !productsError && sortedProducts.length > 0 && (
          <div className={viewMode === 'grid'
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
            : "space-y-4"
          }>
            {sortedProducts.map((product: any) => {
              const images = Array.isArray(product.images) ? product.images : []
              const image = images.length > 0 ? images[0] : '/api/placeholder/300/300'
              const price = parseFloat(product.price)
              const originalPrice = parseFloat(product.originalPrice) || price
              const hasDiscount = originalPrice > price
              const discount = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0

              return viewMode === 'grid' ? (
                // 網格視圖
                <div
                  key={product.id}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
                >
                  <Link href={`/products/${product.slug}`}>
                    <div className="relative aspect-square bg-gray-100">
                      <Image
                        src={image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />

                      {/* 折扣標籤 */}
                      {hasDiscount && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                            {discount}% OFF
                          </span>
                        </div>
                      )}

                      {/* 願望清單按鈕 */}
                      <div className="absolute top-2 right-2 z-20">
                        <WishlistButton productId={product.id} size="sm" />
                      </div>
                    </div>

                    <div className="p-3">
                      <p className="text-xs text-gray-500 mb-1">
                        {product.brand?.name || product.category?.name}
                      </p>
                      <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2">
                        {product.name}
                      </h3>

                      {/* 評分 */}
                      {product.averageRating > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="text-yellow-400 fill-current" size={12} />
                          <span className="text-xs text-gray-600">{product.averageRating.toFixed(1)}</span>
                          <span className="text-xs text-gray-400">({product.reviewCount})</span>
                        </div>
                      )}

                      {/* 價格 */}
                      <div className="flex items-end justify-between">
                        <div>
                          {hasDiscount && (
                            <p className="text-xs text-gray-400 line-through">
                              ${originalPrice}
                            </p>
                          )}
                          <p className={`text-lg font-bold ${hasDiscount ? 'text-red-500' : 'text-gray-800'}`}>
                            ${price}
                          </p>
                        </div>
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">
                          <ShoppingBag size={14} className="inline mr-1" />
                          選購
                        </button>
                      </div>
                    </div>
                  </Link>
                </div>
              ) : (
                // 列表視圖
                <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
                  <Link href={`/products/${product.slug}`}>
                    <div className="flex gap-4">
                      <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                        {hasDiscount && (
                          <span className="absolute top-1 left-1 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                            {discount}% OFF
                          </span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              {product.brand?.name} · {product.category?.name}
                            </p>
                            <h3 className="font-medium text-gray-800 mb-2">{product.name}</h3>
                            {product.averageRating > 0 && (
                              <div className="flex items-center gap-3 text-sm mb-2">
                                <div className="flex items-center gap-1">
                                  <Star className="text-yellow-400 fill-current" size={14} />
                                  <span>{product.averageRating.toFixed(1)}</span>
                                </div>
                                <span className="text-gray-400">|</span>
                                <span className="text-gray-600">{product.reviewCount} 則評價</span>
                                <span className="text-gray-400">|</span>
                                <span className="text-gray-600">已售 {product.soldCount}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {hasDiscount && (
                              <p className="text-sm text-gray-400 line-through mb-1">
                                ${originalPrice}
                              </p>
                            )}
                            <p className={`text-2xl font-bold mb-2 ${hasDiscount ? 'text-red-500' : 'text-gray-800'}`}>
                              ${price}
                            </p>
                            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                              加入購物車
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
