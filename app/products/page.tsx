'use client'

import React, { useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery, gql } from '@apollo/client'
import {
  Star, ShoppingBag, Grid3X3, List, Filter, SlidersHorizontal, Loader2
} from 'lucide-react'
import WishlistButton from '@/components/product/WishlistButton'
import QuickAddToCartModal from '@/components/product/QuickAddToCartModal'

// GraphQL 查詢
const GET_PRODUCTS = gql`
  query GetProducts(
    $take: Int
    $skip: Int
    $categoryIds: [String!]
    $brandId: String
    $minPrice: Float
    $maxPrice: Float
    $gender: ProductGender
  ) {
    products(
      take: $take
      skip: $skip
      categoryIds: $categoryIds
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
      isFeatured
      isNewArrival
      category {
        id
        name
        slug
      }
      brand {
        id
        name
        slug
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

function ProductsPageContent() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category') || ''
  const brandParam = searchParams.get('brand') || ''

  const [sortBy, setSortBy] = useState('popular')
  const [manualBrand, setManualBrand] = useState<string | null>(null)
  const [manualCategories, setManualCategories] = useState<string[] | null>(null)
  const [priceRange, setPriceRange] = useState('all')
  const [selectedGender, setSelectedGender] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [modalProduct, setModalProduct] = useState<{ id: string; name: string } | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // 查詢品牌列表
  const { data: brandsData } = useQuery(GET_BRANDS)

  // 查詢分類列表
  const { data: categoriesData } = useQuery(GET_CATEGORIES)

  const brands = brandsData?.brands || []
  const categories = categoriesData?.categories || []

  // 計算當前選中的分類 ID（優先用手動選擇，否則從 URL 參數轉換）
  const selectedCategories = React.useMemo(() => {
    if (manualCategories !== null) return manualCategories
    if (!categoryParam || categories.length === 0) return []

    const category = categories.find(
      (c: { id: string; slug: string; name: string }) =>
        c.slug === categoryParam || c.id === categoryParam || c.name === categoryParam
    )
    return category ? [category.id] : []
  }, [manualCategories, categoryParam, categories])

  // 計算當前選中的品牌 ID
  const selectedBrand = React.useMemo(() => {
    if (manualBrand !== null) return manualBrand
    if (!brandParam || brands.length === 0) return 'all'

    const brand = brands.find(
      (b: { id: string; slug: string; name: string }) =>
        b.slug === brandParam || b.id === brandParam || b.name === brandParam
    )
    return brand ? brand.id : 'all'
  }, [manualBrand, brandParam, brands])

  const toggleCategory = (categoryId: string) => {
    const current = manualCategories ?? selectedCategories
    if (current.includes(categoryId)) {
      setManualCategories(current.filter(id => id !== categoryId))
    } else {
      setManualCategories([...current, categoryId])
    }
  }

  const setSelectedBrand = (brandId: string) => {
    setManualBrand(brandId)
  }

  // 是否準備好查詢（有 URL 參數時需等待數據加載）
  const isReady = (!categoryParam || categories.length > 0) && (!brandParam || brands.length > 0)

  const { data: productsData, loading: productsLoading, error: productsError } = useQuery(GET_PRODUCTS, {
    variables: {
      take: 100,
      brandId: selectedBrand !== 'all' ? selectedBrand : undefined,
      categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
      minPrice: priceRange === '0-999' ? 0 : priceRange === '1000-1999' ? 1000 : priceRange === '2000-2999' ? 2000 : priceRange === '3000+' ? 3000 : undefined,
      maxPrice: priceRange === '0-999' ? 999 : priceRange === '1000-1999' ? 1999 : priceRange === '2000-2999' ? 2999 : undefined,
      gender: selectedGender !== 'all' ? selectedGender : undefined,
    },
    skip: !isReady,
  })

  const products = productsData?.products || []

  const sortedProducts = React.useMemo(() => {
    if (!products.length) return []

    const sorted = [...products]

    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
      case 'price-high':
        return sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
      case 'rating':
        return sorted.sort((a, b) => {
          const ratingA = a.averageRating ? Number(a.averageRating) : 0
          const ratingB = b.averageRating ? Number(b.averageRating) : 0
          return ratingB - ratingA
        })
      case 'newest':
        return sorted.sort((a, b) => -1)
      case 'popular':
      default:
        return sorted.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
    }
  }, [products, sortBy])

  const priceRanges = [
    { value: 'all', label: '全部價格' },
    { value: '0-999', label: '$999以下' },
    { value: '1000-1999', label: '$1000-$1999' },
    { value: '2000-2999', label: '$2000-$2999' },
    { value: '3000+', label: '$3000以上' }
  ]

  const genderOptions = [
    { value: 'all', label: '全部' },
    { value: 'MEN', label: '男款' },
    { value: 'WOMEN', label: '女款' },
    { value: 'UNISEX', label: '中性' },
    { value: 'KIDS', label: '童鞋' },
  ]

  const currentCategoryName = selectedCategories.length === 1
    ? categories.find((c: { id: string; name: string }) => c.id === selectedCategories[0])?.name
    : selectedCategories.length > 1
      ? `${selectedCategories.length} 個分類`
      : null

  const currentBrandName = selectedBrand !== 'all'
    ? brands.find((b: { id: string; name: string }) => b.id === selectedBrand)?.name
    : null

  const pageTitle = currentCategoryName || currentBrandName || '所有商品'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 麵包屑導航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">首頁</Link>
            <span className="text-gray-400">/</span>
            {currentCategoryName ? (
              <>
                <Link href="/all-categories" className="text-gray-500 hover:text-gray-700">全部分類</Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-800 font-medium">{currentCategoryName}</span>
              </>
            ) : currentBrandName ? (
              <>
                <Link href="/brands" className="text-gray-500 hover:text-gray-700">品牌專區</Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-800 font-medium">{currentBrandName}</span>
              </>
            ) : (
              <span className="text-gray-800 font-medium">所有商品</span>
            )}
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

            {/* 性別篩選 */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">性別</h4>
              <div className="space-y-2">
                {genderOptions.map(option => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={option.value}
                      checked={selectedGender === option.value}
                      onChange={(e) => setSelectedGender(e.target.value)}
                      className="text-orange-500"
                    />
                    <span className="text-sm text-gray-600">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 分類篩選 */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">分類</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categories.map((cat: { id: string; name: string }) => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="text-orange-500 rounded"
                    />
                    <span className="text-sm text-gray-600">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 品牌篩選 */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">品牌</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="brand"
                    value="all"
                    checked={selectedBrand === 'all'}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="text-orange-500"
                  />
                  <span className="text-sm text-gray-600">全部品牌</span>
                </label>
                {brands.map((brand: { id: string; name: string }) => (
                  <label key={brand.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="brand"
                      value={brand.id}
                      checked={selectedBrand === brand.id}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="text-orange-500"
                    />
                    <span className="text-sm text-gray-600">{brand.name}</span>
                  </label>
                ))}
              </div>
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
                  <h1 className="text-xl font-bold text-gray-800">{pageTitle}</h1>
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
                    {/* 性別 */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 text-sm">性別</h4>
                      <select
                        value={selectedGender}
                        onChange={(e) => setSelectedGender(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-sm"
                      >
                        {genderOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* 品牌 */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 text-sm">品牌</h4>
                      <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-sm"
                      >
                        <option value="all">全部品牌</option>
                        {brands.map((brand: { id: string; name: string }) => (
                          <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* 價格 */}
                    <div className="col-span-2">
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
                <p className="text-gray-600">載入產品時發生錯誤：{productsError.message}</p>
              </div>
            )}

            {/* 無產品 */}
            {!productsLoading && !productsError && sortedProducts.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">暫無符合條件的商品</h3>
                <p className="text-gray-600 mb-4">請嘗試其他篩選條件或瀏覽其他分類</p>
                <Link
                  href="/"
                  className="inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  返回首頁
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
                {sortedProducts.map((product: { id: string; name: string; slug: string; price: string; originalPrice: string; images: string[]; stock: number; soldCount: number; averageRating: number; reviewCount: number; isFeatured: boolean; isNewArrival: boolean; category: { id: string; name: string; slug: string }; brand: { id: string; name: string; slug: string } }) => {
                  const images = Array.isArray(product.images) ? product.images : []
                  const mainImage = images.length > 0 ? images[0] : '/placeholder-product.png'
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
                            src={mainImage}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
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
                          <p className="text-xs text-gray-500 mb-1">{product.brand?.name || '無品牌'}</p>
                          <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2">
                            {product.name}
                          </h3>

                          {product.averageRating && Number(product.averageRating) > 0 && (
                            <div className="flex items-center gap-1 mb-2">
                              <Star className="text-yellow-400 fill-current" size={12} />
                              <span className="text-xs text-gray-600">{Number(product.averageRating).toFixed(1)}</span>
                              <span className="text-xs text-gray-400">({product.reviewCount || 0})</span>
                            </div>
                          )}

                          <div className="flex items-end justify-between">
                            <div>
                              {hasDiscount && (
                                <p className="text-xs text-gray-400 line-through">
                                  ${originalPrice.toLocaleString()}
                                </p>
                              )}
                              <p className="text-lg font-bold text-orange-600">
                                ${price.toLocaleString()}
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
                            <Image
                              src={mainImage}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">{product.brand?.name || '無品牌'}</p>
                                <h3 className="font-medium text-gray-800 mb-2">{product.name}</h3>
                                {product.averageRating && Number(product.averageRating) > 0 && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center gap-1">
                                      <Star className="text-yellow-400 fill-current" size={14} />
                                      <span className="text-sm">{Number(product.averageRating).toFixed(1)}</span>
                                    </div>
                                    <span className="text-gray-400">|</span>
                                    <span className="text-sm text-gray-600">{product.reviewCount || 0} 則評價</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                {hasDiscount && (
                                  <p className="text-sm text-gray-400 line-through">
                                    ${originalPrice.toLocaleString()}
                                  </p>
                                )}
                                <p className="text-xl font-bold text-orange-600">
                                  ${price.toLocaleString()}
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

      {/* Modal */}
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

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-orange-500" size={48} />
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  )
}
