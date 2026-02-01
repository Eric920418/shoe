'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, gql } from '@apollo/client'
import {
  Filter, Star,
  Grid3X3, List, SlidersHorizontal, Loader2
} from 'lucide-react'
import { ProductCardImage } from '@/components/common/ProductImage'
import WishlistButton from '@/components/product/WishlistButton'

// GraphQL 查詢：透過 slug 取得分類資訊
const GET_CATEGORY_BY_SLUG = gql`
  query GetCategoryBySlug($slug: String!) {
    category(slug: $slug) {
      id
      name
      slug
      productCount
    }
  }
`

// GraphQL 查詢：取得分類產品
const GET_PRODUCTS_BY_CATEGORY = gql`
  query GetProductsByCategory(
    $categoryId: String!
    $skip: Int
    $take: Int
    $minPrice: Float
    $maxPrice: Float
    $genders: [ProductGender!]
  ) {
    products(
      categoryId: $categoryId
      skip: $skip
      take: $take
      minPrice: $minPrice
      maxPrice: $maxPrice
      genders: $genders
    ) {
      id
      name
      slug
      price
      originalPrice
      images
      totalStock
      averageRating
      reviewCount
      soldCount
      isNewArrival
      isFeatured
    }
  }
`

export default function CategoryPage() {
  const params = useParams()
  const categorySlug = decodeURIComponent(params.category as string)

  const [sortBy, setSortBy] = useState('popular')
  const [priceRange, setPriceRange] = useState('all')
  const [selectedGenders, setSelectedGenders] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  // 查詢分類資訊
  const { data: categoryData, loading: categoryLoading, error: categoryError } = useQuery(GET_CATEGORY_BY_SLUG, {
    variables: { slug: categorySlug },
  })

  // 解析價格範圍
  const getPriceFilter = () => {
    switch (priceRange) {
      case '0-999':
        return { minPrice: 0, maxPrice: 999 }
      case '1000-1999':
        return { minPrice: 1000, maxPrice: 1999 }
      case '2000-2999':
        return { minPrice: 2000, maxPrice: 2999 }
      case '3000+':
        return { minPrice: 3000, maxPrice: undefined }
      default:
        return { minPrice: undefined, maxPrice: undefined }
    }
  }

  const priceFilter = getPriceFilter()

  const toggleGender = (gender: string) => {
    setSelectedGenders(prev =>
      prev.includes(gender)
        ? prev.filter(g => g !== gender)
        : [...prev, gender]
    )
  }

  // 查詢產品列表（依賴分類資訊）
  const { data: productsData, loading: productsLoading, error: productsError } = useQuery(GET_PRODUCTS_BY_CATEGORY, {
    variables: {
      categoryId: categoryData?.category?.id || '',
      skip: 0,
      take: 10000, // 顯示所有產品
      ...priceFilter,
      genders: selectedGenders.length > 0 ? selectedGenders : undefined,
    },
    skip: !categoryData?.category?.id,
  })

  const category = categoryData?.category
  const products = productsData?.products || []

  // 前端排序
  const sortedProducts = [...products].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'newest':
        return -1 // 假設 ID 越大越新
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'rating':
        return (b.averageRating || 0) - (a.averageRating || 0)
      case 'popular':
      default:
        return (b.soldCount || 0) - (a.soldCount || 0)
    }
  })

  const priceRanges = [
    { value: 'all', label: '全部價格' },
    { value: '0-999', label: '$999以下' },
    { value: '1000-1999', label: '$1000-$1999' },
    { value: '2000-2999', label: '$2000-$2999' },
    { value: '3000+', label: '$3000以上' }
  ]

  const genderOptions = [
    { value: 'MEN', label: '男款' },
    { value: 'WOMEN', label: '女款' },
    { value: 'UNISEX', label: '中性' },
    { value: 'KIDS', label: '童鞋' },
  ]

  // 載入狀態
  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-orange-500" size={48} />
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  // 錯誤狀態
  if (categoryError || !category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">找不到此分類</h2>
          <p className="text-gray-600 mb-4">分類「{categorySlug}」不存在或已被移除</p>
          <Link
            href="/all-categories"
            className="inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            瀏覽所有分類
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 麵包屑導航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">首頁</Link>
            <span className="text-gray-400">/</span>
            <Link href="/all-categories" className="text-gray-500 hover:text-gray-700">全部分類</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-800 font-medium">{category.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4">
        <div className="flex gap-4">
          {/* 側邊篩選器 - 桌面版 */}
          <div className="hidden lg:block w-64 bg-white rounded-lg shadow-sm p-4 h-fit sticky top-4">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <SlidersHorizontal size={18} />
              篩選條件
            </h3>

            {/* 性別篩選（多選） */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">性別</h4>
              <div className="space-y-2">
                {genderOptions.map(option => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGenders.includes(option.value)}
                      onChange={() => toggleGender(option.value)}
                      className="text-orange-500 rounded"
                    />
                    <span className="text-sm text-gray-600">{option.label}</span>
                  </label>
                ))}
              </div>
              {selectedGenders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedGenders([])}
                  className="text-xs text-orange-600 hover:text-orange-700 mt-2"
                >
                  清除篩選
                </button>
              )}
            </div>

            {/* 價格範圍 */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">價格範圍</h4>
              <div className="space-y-2">
                {priceRanges.map(range => (
                  <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      value={range.value}
                      checked={priceRange === range.value}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="text-orange-500"
                    />
                    <span className="text-sm text-gray-600">{range.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 主要內容區 */}
          <div className="flex-1">
            {/* 頂部工具列 */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-800">{category.name}</h1>
                  <p className="text-sm text-gray-500">共 {sortedProducts.length} 件商品</p>
                </div>

                <div className="flex items-center gap-3">
                  {/* 手機版篩選按鈕 */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
                  >
                    <Filter size={16} />
                    篩選
                  </button>

                  {/* 排序 */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 border rounded-lg text-sm"
                  >
                    <option value="popular">熱門推薦</option>
                    <option value="newest">最新上架</option>
                    <option value="price-low">價格低到高</option>
                    <option value="price-high">價格高到低</option>
                    <option value="rating">評價最高</option>
                  </select>

                  {/* 視圖切換 */}
                  <div className="hidden sm:flex rounded-lg border">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-600'}`}
                    >
                      <Grid3X3 size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-gray-600'}`}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 手機版篩選面板 */}
              {showFilters && (
                <div className="lg:hidden mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    {/* 性別（多選） */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 text-sm">性別</h4>
                      <div className="flex flex-wrap gap-1">
                        {genderOptions.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleGender(option.value)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              selectedGenders.includes(option.value)
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* 價格 */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 text-sm">價格範圍</h4>
                      <select
                        value={priceRange}
                        onChange={(e) => setPriceRange(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-sm"
                      >
                        {priceRanges.map(range => (
                          <option key={range.value} value={range.value}>{range.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 載入產品中 */}
            {productsLoading && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Loader2 className="animate-spin mx-auto mb-4 text-orange-500" size={32} />
                <p className="text-gray-600">載入產品中...</p>
              </div>
            )}

            {/* 產品錯誤 */}
            {productsError && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-gray-600">載入產品時發生錯誤，請重新整理頁面</p>
              </div>
            )}

            {/* 無產品 */}
            {!productsLoading && !productsError && sortedProducts.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">此分類暫無商品</h3>
                <p className="text-gray-600 mb-4">請嘗試其他篩選條件或瀏覽其他分類</p>
                <Link
                  href="/products"
                  className="inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  瀏覽所有商品
                </Link>
              </div>
            )}

            {/* 產品網格/列表 */}
            {!productsLoading && !productsError && sortedProducts.length > 0 && (
              <div className={
                viewMode === 'grid'
                  ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                  : "space-y-4"
              }>
                {sortedProducts.map((product: any) => {
                  const mainImage = Array.isArray(product.images) && product.images.length > 0
                    ? product.images[0]
                    : '/placeholder-product.png'
                  const discount = product.originalPrice
                    ? Math.round((1 - product.price / product.originalPrice) * 100)
                    : 0

                  return viewMode === 'grid' ? (
                    // 網格視圖
                    <div
                      key={product.id}
                      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
                    >
                      <Link href={`/products/${product.slug}`}>
                        <div className="relative aspect-square bg-gray-100">
                          <ProductCardImage
                            src={mainImage}
                            alt={product.name}
                            hoverScale
                          />

                          {product.isNewArrival && (
                            <span className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                              新品
                            </span>
                          )}

                          {discount > 0 && (
                            <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                              {discount}% OFF
                            </span>
                          )}

                          <div className="absolute top-2 right-2 z-20">
                            <WishlistButton productId={product.id} size="sm" />
                          </div>
                        </div>

                        <div className="p-3">
                          <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2">
                            {product.name}
                          </h3>

                          {product.averageRating > 0 && (
                            <div className="flex items-center gap-1 mb-2">
                              <Star className="text-yellow-400 fill-current" size={12} />
                              <span className="text-xs text-gray-600">{product.averageRating?.toFixed(1)}</span>
                              <span className="text-xs text-gray-400">({product.reviewCount || 0})</span>
                            </div>
                          )}

                          <div className="flex items-end justify-between">
                            <div>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <p className="text-xs text-gray-400 line-through">
                                  ${product.originalPrice.toLocaleString()}
                                </p>
                              )}
                              <p className="text-lg font-bold text-orange-600">
                                ${product.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ) : (
                    // 列表視圖
                    <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
                      <Link href={`/products/${product.slug}`}>
                        <div className="flex gap-4">
                          <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <ProductCardImage
                              src={mainImage}
                              alt={product.name}
                              hoverScale={false}
                            />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-gray-800 mb-2">{product.name}</h3>
                                {product.averageRating > 0 && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center gap-1">
                                      <Star className="text-yellow-400 fill-current" size={14} />
                                      <span className="text-sm">{product.averageRating?.toFixed(1)}</span>
                                    </div>
                                    <span className="text-gray-400">|</span>
                                    <span className="text-sm text-gray-600">{product.reviewCount || 0} 則評價</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                {product.originalPrice && product.originalPrice > product.price && (
                                  <p className="text-sm text-gray-400 line-through">
                                    ${product.originalPrice.toLocaleString()}
                                  </p>
                                )}
                                <p className="text-xl font-bold text-orange-600">
                                  ${product.price.toLocaleString()}
                                </p>
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
      </div>
    </div>
  )
}
