'use client'

import React, { useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery, gql } from '@apollo/client'
import {
  Star, ShoppingBag, Zap, ChevronDown, X, Grid3X3, LayoutList, Filter, Tag, Flame
} from 'lucide-react'
import WishlistButton from '@/components/product/WishlistButton'
import Breadcrumb from '@/components/common/Breadcrumb'
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

  const [sortBy, setSortBy] = useState('relevance')
  const [manualBrand, setManualBrand] = useState<string | null>(null)
  const [manualCategories, setManualCategories] = useState<string[] | null>(null)
  const [priceRange, setPriceRange] = useState('all')
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

  const setSelectedCategories = (categoryIds: string[]) => {
    setManualCategories(categoryIds)
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
      case 'sales':
        return sorted.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      case 'newest':
        return sorted.filter(p => p.isNewArrival)
      case 'featured':
        return sorted.filter(p => p.isFeatured)
      default:
        return sorted
    }
  }, [products, sortBy])

  const priceRanges = [
    { value: 'all', label: '全部價格' },
    { value: '0-999', label: '$999以下' },
    { value: '1000-1999', label: '$1,000-$1,999' },
    { value: '2000-2999', label: '$2,000-$2,999' },
    { value: '3000+', label: '$3,000以上' }
  ]

  const currentCategoryName = selectedCategories.length === 1
    ? categories.find((c: { id: string; name: string }) => c.id === selectedCategories[0])?.name
    : selectedCategories.length > 1
      ? `${selectedCategories.length} 個分類`
      : null

  const currentBrandName = selectedBrand !== 'all'
    ? brands.find((b: { id: string; name: string }) => b.id === selectedBrand)?.name
    : null

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 麵包屑導航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: '所有商品' }]} />
        </div>
      </div>

      {/* 標題區 - 淘寶促銷風格 */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-400 text-red-600 px-4 py-1 rounded-full text-sm font-bold mb-3 animate-pulse">
              <Zap size={16} />
              超值優惠
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {currentCategoryName || currentBrandName || '全部商品'}
            </h1>
            {!productsLoading && products.length > 0 && (
              <p className="text-white/90">
                共 <span className="text-yellow-300 font-bold text-xl">{products.length}</span> 件超值好物等你挑
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4">
        {/* 篩選區 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          {/* 主要控制列 */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            {/* 已選標籤 */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedBrand !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-sm font-medium">
                  <Tag size={14} />
                  {currentBrandName}
                  <button onClick={() => setSelectedBrand('all')} className="hover:text-orange-800">
                    <X size={14} />
                  </button>
                </span>
              )}
              {selectedCategories.map(catId => {
                const cat = categories.find((c: { id: string; name: string }) => c.id === catId)
                return cat ? (
                  <span key={catId} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-sm font-medium">
                    <Tag size={14} />
                    {cat.name}
                    <button onClick={() => toggleCategory(catId)} className="hover:text-orange-800">
                      <X size={14} />
                    </button>
                  </span>
                ) : null
              })}
              {priceRange !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-sm font-medium">
                  <Tag size={14} />
                  {priceRanges.find(r => r.value === priceRange)?.label}
                  <button onClick={() => setPriceRange('all')} className="hover:text-orange-800">
                    <X size={14} />
                  </button>
                </span>
              )}
              {(selectedBrand !== 'all' || selectedCategories.length > 0 || priceRange !== 'all') && (
                <button
                  onClick={() => {
                    setSelectedBrand('all')
                    setSelectedCategories([])
                    setPriceRange('all')
                  }}
                  className="text-gray-500 hover:text-orange-500 text-sm"
                >
                  清除全部
                </button>
              )}
            </div>

            {/* 右側控制 */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <LayoutList size={18} />
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white focus:border-orange-500 focus:outline-none"
              >
                <option value="relevance">綜合排序</option>
                <option value="sales">銷量優先</option>
                <option value="price-low">價格低到高</option>
                <option value="price-high">價格高到低</option>
                <option value="rating">好評優先</option>
                <option value="newest">新品優先</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden px-3 py-2 border rounded-lg text-sm bg-white flex items-center gap-1.5 hover:border-orange-500"
              >
                <Filter size={16} />
                篩選
                <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* 篩選選項 */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block border-t pt-4`}>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 品牌 */}
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2 font-medium flex items-center gap-1">
                  <Filter size={14} />
                  品牌
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedBrand('all')}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedBrand === 'all'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600'
                    }`}
                  >
                    全部
                  </button>
                  {brands.slice(0, 8).map((brand: { id: string; name: string }) => (
                    <button
                      key={brand.id}
                      onClick={() => setSelectedBrand(brand.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedBrand === brand.id
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600'
                      }`}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 分類 */}
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2 font-medium flex items-center gap-1">
                  <Filter size={14} />
                  分類（可複選）
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat: { id: string; name: string }) => (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1 ${
                        selectedCategories.includes(cat.id)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600'
                      }`}
                    >
                      {selectedCategories.includes(cat.id) && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 價格 */}
              <div className="lg:w-44">
                <p className="text-sm text-gray-600 mb-2 font-medium">價格範圍</p>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:border-orange-500 focus:outline-none"
                >
                  {priceRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {productsLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">正在為您搜尋超值好物...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {productsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">載入失敗：{productsError.message}</p>
          </div>
        )}

        {/* 空狀態 */}
        {!productsLoading && !productsError && sortedProducts.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="text-orange-500" size={32} />
            </div>
            <p className="text-gray-800 text-lg mb-2">暫無符合條件的商品</p>
            <p className="text-gray-500 text-sm mb-6">試試其他篩選條件吧</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/" className="px-5 py-2 rounded-full border border-orange-500 text-orange-500 hover:bg-orange-50">
                返回首頁
              </Link>
              <Link href="/popular" className="px-5 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600">
                看看熱銷
              </Link>
            </div>
          </div>
        )}

        {/* 產品列表 */}
        {!productsLoading && !productsError && sortedProducts.length > 0 && (
          <div className={viewMode === 'grid'
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
            : "space-y-3"
          }>
            {sortedProducts.map((product: { id: string; name: string; slug: string; price: string; originalPrice: string; images: string[]; stock: number; soldCount: number; averageRating: number; reviewCount: number; isFeatured: boolean; isNewArrival: boolean; category: { id: string; name: string; slug: string }; brand: { id: string; name: string; slug: string } }) => {
              const images = Array.isArray(product.images) ? product.images : []
              const image = images.length > 0 ? images[0] : '/api/placeholder/300/300'
              const price = parseFloat(product.price)
              const originalPrice = parseFloat(product.originalPrice) || price
              const hasDiscount = originalPrice > price
              const discount = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
              const rating = product.averageRating ? Number(product.averageRating) : 0

              return viewMode === 'grid' ? (
                // 網格卡片 - 淘寶風格
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
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* 標籤 */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {hasDiscount && (
                          <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                            {discount}%OFF
                          </span>
                        )}
                        {product.isNewArrival && (
                          <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                            新品
                          </span>
                        )}
                        {product.isFeatured && (
                          <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold flex items-center gap-0.5">
                            <Flame size={10} />
                            熱賣
                          </span>
                        )}
                      </div>

                      {/* 願望清單 */}
                      <div className="absolute top-2 right-2 z-20">
                        <WishlistButton productId={product.id} size="sm" />
                      </div>

                      {/* 快速購買 */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setModalProduct({ id: product.id, name: product.name })
                          }}
                          className="w-full py-2 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 flex items-center justify-center gap-1"
                        >
                          <ShoppingBag size={14} />
                          加入購物車
                        </button>
                      </div>
                    </div>

                    <div className="p-3">
                      <p className="text-xs text-gray-500 mb-1">{product.brand?.name}</p>
                      <h3 className="text-sm text-gray-800 line-clamp-2 mb-2 min-h-[40px] group-hover:text-orange-500">
                        {product.name}
                      </h3>

                      {/* 價格區 */}
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-lg font-bold text-red-500">
                          ${price.toLocaleString()}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-gray-400 line-through">
                            ${originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* 銷量評分 */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>已售 {product.soldCount || 0}</span>
                        {rating > 0 && (
                          <div className="flex items-center gap-0.5">
                            <Star className="text-yellow-400 fill-yellow-400" size={12} />
                            <span>{rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ) : (
                // 列表卡片
                <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
                  <Link href={`/products/${product.slug}`}>
                    <div className="flex gap-4">
                      <div className="relative w-28 h-28 md:w-36 md:h-36 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                        {hasDiscount && (
                          <span className="absolute top-1 left-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                            {discount}%OFF
                          </span>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">{product.brand?.name} · {product.category?.name}</p>
                          <h3 className="text-gray-800 font-medium mb-2 hover:text-orange-500">{product.name}</h3>
                          {rating > 0 && (
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <div className="flex items-center gap-0.5">
                                <Star className="text-yellow-400 fill-yellow-400" size={14} />
                                <span>{rating.toFixed(1)}</span>
                              </div>
                              <span>|</span>
                              <span>{product.reviewCount || 0} 評價</span>
                              <span>|</span>
                              <span>已售 {product.soldCount || 0}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-end justify-between mt-3">
                          <div>
                            {hasDiscount && (
                              <p className="text-xs text-gray-400 line-through">${originalPrice.toLocaleString()}</p>
                            )}
                            <p className="text-xl font-bold text-red-500">${price.toLocaleString()}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setModalProduct({ id: product.id, name: product.name })
                            }}
                            className="px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 flex items-center gap-1"
                          >
                            <ShoppingBag size={14} />
                            加入購物車
                          </button>
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  )
}
