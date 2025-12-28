'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery, gql } from '@apollo/client'
import {
  Star, ShoppingBag, Sparkles, ChevronDown, X, Grid3X3, LayoutList
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
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [modalProduct, setModalProduct] = useState<{ id: string; name: string } | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // 查詢品牌列表
  const { data: brandsData } = useQuery(GET_BRANDS)

  // 查詢分類列表
  const { data: categoriesData } = useQuery(GET_CATEGORIES)

  const brands = brandsData?.brands || []
  const categories = categoriesData?.categories || []

  // 初始化：將 URL 的 slug 轉換成 ID
  useEffect(() => {
    if (isInitialized) return
    if (!categoriesData || !brandsData) return

    // 處理分類參數（支援 slug 或 ID）
    if (categoryParam) {
      const category = categories.find(
        (c: { id: string; slug: string }) => c.slug === categoryParam || c.id === categoryParam
      )
      if (category) {
        setSelectedCategories([category.id])
      }
    }

    // 處理品牌參數（支援 slug 或 ID）
    if (brandParam) {
      const brand = brands.find(
        (b: { id: string; slug: string }) => b.slug === brandParam || b.id === brandParam
      )
      if (brand) {
        setSelectedBrand(brand.id)
      }
    }

    setIsInitialized(true)
  }, [categoryParam, brandParam, categories, brands, categoriesData, brandsData, isInitialized])

  // 切換分類選擇
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // 查詢產品（等待初始化完成後再查詢，避免用 slug 查詢）
  const { data: productsData, loading: productsLoading, error: productsError } = useQuery(GET_PRODUCTS, {
    variables: {
      take: 100,
      brandId: selectedBrand !== 'all' ? selectedBrand : undefined,
      categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
      minPrice: priceRange === '0-999' ? 0 : priceRange === '1000-1999' ? 1000 : priceRange === '2000-2999' ? 2000 : priceRange === '3000+' ? 3000 : undefined,
      maxPrice: priceRange === '0-999' ? 999 : priceRange === '1000-1999' ? 1999 : priceRange === '2000-2999' ? 2999 : undefined,
    },
    skip: !isInitialized && (!!categoryParam || !!brandParam),
  })

  const products = productsData?.products || []

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

  // 獲取當前分類名稱
  const currentCategoryName = selectedCategories.length === 1
    ? categories.find((c: { id: string; name: string }) => c.id === selectedCategories[0])?.name
    : selectedCategories.length > 1
      ? `${selectedCategories.length} 個分類`
      : null

  // 獲取當前品牌名稱
  const currentBrandName = selectedBrand !== 'all'
    ? brands.find((b: { id: string; name: string }) => b.id === selectedBrand)?.name
    : null

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* 頂部裝飾線 */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#CBA135] to-transparent" />

      {/* 麵包屑導航 */}
      <div className="border-b border-[#222]">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: '所有商品' }]} />
        </div>
      </div>

      {/* 標題區 - 奢華黑金風格 */}
      <div className="relative overflow-hidden">
        {/* 背景裝飾 */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1510] via-[#0f0d0a] to-[#0a0a0a]" />
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23CBA135' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
          {/* 金色光暈 */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#CBA135] rounded-full blur-[150px] opacity-10" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#d4a437] rounded-full blur-[100px] opacity-10" />
        </div>

        <div className="relative container mx-auto px-4 py-12 md:py-16">
          <div className="text-center max-w-3xl mx-auto">
            {/* 裝飾線 */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[#CBA135]" />
              <Sparkles className="text-[#CBA135] animate-pulse" size={20} />
              <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[#CBA135]" />
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-[#ffe9a3] via-[#CBA135] to-[#d4a437] bg-clip-text text-transparent">
                {currentCategoryName || currentBrandName || '精選商品'}
              </span>
            </h1>

            {(currentCategoryName || currentBrandName) && (
              <p className="text-[#888] text-lg mb-2">
                {currentBrandName && currentCategoryName
                  ? `${currentBrandName} · ${currentCategoryName}`
                  : '探索我們精心挑選的鞋履系列'}
              </p>
            )}

            {!productsLoading && products.length > 0 && (
              <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full border border-[#333] bg-[#111]/80 backdrop-blur">
                <span className="w-2 h-2 rounded-full bg-[#CBA135] animate-pulse" />
                <span className="text-[#999] text-sm">
                  共 <span className="text-[#CBA135] font-semibold">{products.length}</span> 件商品
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 篩選區 - 精緻黑金風格 */}
        <div className="mb-6">
          {/* 主要控制列 */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            {/* 左側：已選篩選標籤 */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedBrand !== 'all' && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1510] border border-[#CBA135]/30 text-[#CBA135] text-sm">
                  {currentBrandName}
                  <button onClick={() => setSelectedBrand('all')} className="hover:text-white transition-colors">
                    <X size={14} />
                  </button>
                </span>
              )}
              {selectedCategories.map(catId => {
                const cat = categories.find((c: { id: string; name: string }) => c.id === catId)
                return cat ? (
                  <span key={catId} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1510] border border-[#CBA135]/30 text-[#CBA135] text-sm">
                    {cat.name}
                    <button onClick={() => toggleCategory(catId)} className="hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </span>
                ) : null
              })}
              {priceRange !== 'all' && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1510] border border-[#CBA135]/30 text-[#CBA135] text-sm">
                  {priceRanges.find(r => r.value === priceRange)?.label}
                  <button onClick={() => setPriceRange('all')} className="hover:text-white transition-colors">
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
                  className="text-[#666] hover:text-[#CBA135] text-sm transition-colors"
                >
                  清除全部
                </button>
              )}
            </div>

            {/* 右側：視圖切換和排序 */}
            <div className="flex items-center gap-3">
              {/* 視圖切換 */}
              <div className="flex rounded-lg border border-[#333] overflow-hidden bg-[#111]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 transition-all ${viewMode === 'grid'
                    ? 'bg-gradient-to-r from-[#CBA135] to-[#d4a437] text-[#0a0a0a]'
                    : 'text-[#666] hover:text-[#CBA135]'
                    }`}
                  title="網格視圖"
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 transition-all ${viewMode === 'list'
                    ? 'bg-gradient-to-r from-[#CBA135] to-[#d4a437] text-[#0a0a0a]'
                    : 'text-[#666] hover:text-[#CBA135]'
                    }`}
                  title="列表視圖"
                >
                  <LayoutList size={18} />
                </button>
              </div>

              {/* 排序下拉 */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none px-4 py-2.5 pr-10 rounded-lg border border-[#333] bg-[#111] text-[#ccc] text-sm cursor-pointer hover:border-[#CBA135]/50 focus:border-[#CBA135] focus:outline-none transition-colors"
                >
                  <option value="relevance">推薦排序</option>
                  <option value="sales">銷量優先</option>
                  <option value="price-low">價格低到高</option>
                  <option value="price-high">價格高到低</option>
                  <option value="rating">評價最高</option>
                  <option value="newest">最新上架</option>
                  <option value="featured">精選商品</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] pointer-events-none" size={16} />
              </div>

              {/* 篩選按鈕 (手機版) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden px-4 py-2.5 rounded-lg border border-[#333] bg-[#111] text-[#ccc] text-sm hover:border-[#CBA135]/50 transition-colors flex items-center gap-2"
              >
                <span>篩選</span>
                <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* 篩選標籤列 - 桌面版始終顯示，手機版可收合 */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="flex flex-col lg:flex-row gap-4 p-4 rounded-xl border border-[#222] bg-[#111]/50 backdrop-blur">
              {/* 品牌篩選 */}
              <div className="flex-1">
                <p className="text-xs text-[#666] uppercase tracking-wider mb-3 font-medium">品牌</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedBrand('all')}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${selectedBrand === 'all'
                      ? 'bg-gradient-to-r from-[#CBA135] to-[#d4a437] text-[#0a0a0a] font-medium shadow-lg shadow-[#CBA135]/20'
                      : 'bg-[#1a1a1a] text-[#888] hover:text-[#CBA135] hover:border-[#CBA135]/30 border border-transparent hover:border-[#333]'
                      }`}
                  >
                    全部
                  </button>
                  {brands.slice(0, 8).map((brand: { id: string; name: string }) => (
                    <button
                      key={brand.id}
                      onClick={() => setSelectedBrand(brand.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${selectedBrand === brand.id
                        ? 'bg-gradient-to-r from-[#CBA135] to-[#d4a437] text-[#0a0a0a] font-medium shadow-lg shadow-[#CBA135]/20'
                        : 'bg-[#1a1a1a] text-[#888] hover:text-[#CBA135] hover:border-[#CBA135]/30 border border-transparent hover:border-[#333]'
                        }`}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 分類篩選 */}
              <div className="flex-1">
                <p className="text-xs text-[#666] uppercase tracking-wider mb-3 font-medium">分類（可複選）</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat: { id: string; name: string }) => (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1.5 ${selectedCategories.includes(cat.id)
                        ? 'bg-gradient-to-r from-[#CBA135] to-[#d4a437] text-[#0a0a0a] font-medium shadow-lg shadow-[#CBA135]/20'
                        : 'bg-[#1a1a1a] text-[#888] hover:text-[#CBA135] hover:border-[#CBA135]/30 border border-transparent hover:border-[#333]'
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

              {/* 價格篩選 */}
              <div className="lg:w-48">
                <p className="text-xs text-[#666] uppercase tracking-wider mb-3 font-medium">價格範圍</p>
                <div className="relative">
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full appearance-none px-4 py-2 pr-10 rounded-lg border border-[#333] bg-[#1a1a1a] text-[#ccc] text-sm cursor-pointer hover:border-[#CBA135]/50 focus:border-[#CBA135] focus:outline-none transition-colors"
                  >
                    {priceRanges.map(range => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] pointer-events-none" size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading 狀態 */}
        {productsLoading && (
          <div className="flex justify-center items-center py-32">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-[#333]" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#CBA135] animate-spin" />
              </div>
              <p className="text-[#666]">載入精選商品中...</p>
            </div>
          </div>
        )}

        {/* Error 狀態 */}
        {productsError && (
          <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-8 text-center">
            <div className="text-red-400 mb-2">⚠️ 載入失敗</div>
            <p className="text-red-300/80 text-sm">{productsError.message}</p>
          </div>
        )}

        {/* 沒有產品 */}
        {!productsLoading && !productsError && sortedProducts.length === 0 && (
          <div className="rounded-xl border border-[#222] bg-[#111]/50 p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#1a1510] flex items-center justify-center">
              <ShoppingBag className="text-[#CBA135]/50" size={32} />
            </div>
            <p className="text-[#ccc] text-xl mb-2">目前沒有符合條件的商品</p>
            <p className="text-[#666] text-sm mb-8">試試調整篩選條件或瀏覽其他分類</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/" className="px-6 py-2.5 rounded-full border border-[#CBA135]/30 text-[#CBA135] hover:bg-[#CBA135] hover:text-[#0a0a0a] transition-all">
                返回首頁
              </Link>
              <Link href="/best-sellers" className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#CBA135] to-[#d4a437] text-[#0a0a0a] font-medium hover:shadow-lg hover:shadow-[#CBA135]/20 transition-all">
                熱銷排行
              </Link>
            </div>
          </div>
        )}

        {/* 產品網格/列表 */}
        {!productsLoading && !productsError && sortedProducts.length > 0 && (
          <div className={viewMode === 'grid'
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
            : "space-y-4"
          }>
            {sortedProducts.map((product: { id: string; name: string; slug: string; price: string; originalPrice: string; images: string[]; stock: number; soldCount: number; averageRating: number; reviewCount: number; isFeatured: boolean; isNewArrival: boolean; category: { id: string; name: string; slug: string }; brand: { id: string; name: string; slug: string } }, index: number) => {
              const images = Array.isArray(product.images) ? product.images : []
              const image = images.length > 0 ? images[0] : '/api/placeholder/300/300'
              const price = parseFloat(product.price)
              const originalPrice = parseFloat(product.originalPrice) || price
              const hasDiscount = originalPrice > price
              const discount = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
              const rating = product.averageRating ? Number(product.averageRating) : 0

              return viewMode === 'grid' ? (
                // 網格視圖 - 奢華黑金卡片
                <div
                  key={product.id}
                  className="group relative rounded-xl overflow-hidden bg-[#111] border border-[#222] hover:border-[#CBA135]/30 transition-all duration-500 hover:shadow-xl hover:shadow-[#CBA135]/5"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Link href={`/products/${product.slug}`}>
                    {/* 圖片區 */}
                    <div className="relative aspect-square bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] overflow-hidden">
                      <Image
                        src={image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />

                      {/* 懸浮遮罩 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* 標籤 */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {hasDiscount && (
                          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold shadow-lg">
                            -{discount}%
                          </span>
                        )}
                        {product.isNewArrival && (
                          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-bold shadow-lg">
                            NEW
                          </span>
                        )}
                        {product.isFeatured && (
                          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#CBA135] to-[#d4a437] text-[#0a0a0a] text-xs font-bold shadow-lg flex items-center gap-1">
                            <Sparkles size={10} />
                            精選
                          </span>
                        )}
                      </div>

                      {/* 願望清單按鈕 */}
                      <div className="absolute top-3 right-3 z-20">
                        <WishlistButton productId={product.id} size="sm" />
                      </div>

                      {/* 快速加入購物車 - 懸浮顯示 */}
                      <div className="absolute inset-x-4 bottom-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setModalProduct({ id: product.id, name: product.name })
                          }}
                          className="w-full py-3 rounded-lg bg-gradient-to-r from-[#CBA135] to-[#d4a437] text-[#0a0a0a] font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#CBA135]/30 transition-shadow"
                        >
                          <ShoppingBag size={16} />
                          加入購物車
                        </button>
                      </div>
                    </div>

                    {/* 資訊區 */}
                    <div className="p-4">
                      {/* 品牌/分類 */}
                      <p className="text-xs text-[#666] uppercase tracking-wider mb-2">
                        {product.brand?.name || product.category?.name}
                      </p>

                      {/* 產品名 */}
                      <h3 className="font-medium text-[#eee] text-sm line-clamp-2 mb-3 min-h-[40px] group-hover:text-[#CBA135] transition-colors">
                        {product.name}
                      </h3>

                      {/* 評分與銷量 */}
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <span className="text-[#555]">已售 {product.soldCount || 0}</span>
                        {rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="text-[#CBA135] fill-[#CBA135]" size={12} />
                            <span className="text-[#888]">{rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {/* 價格 */}
                      <div className="flex items-end justify-between">
                        <div className="flex flex-col">
                          {hasDiscount && (
                            <span className="text-xs text-[#555] line-through">
                              ${originalPrice.toLocaleString()}
                            </span>
                          )}
                          <span className={`text-lg font-bold ${hasDiscount ? 'text-red-400' : 'text-[#CBA135]'}`}>
                            ${price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* 底部金色光暈效果 */}
                  <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CBA135]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              ) : (
                // 列表視圖 - 水平卡片
                <div
                  key={product.id}
                  className="group rounded-xl overflow-hidden bg-[#111] border border-[#222] hover:border-[#CBA135]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#CBA135]/5"
                >
                  <Link href={`/products/${product.slug}`}>
                    <div className="flex gap-4 p-4">
                      {/* 圖片 */}
                      <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-lg bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] overflow-hidden flex-shrink-0">
                        <Image
                          src={image}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {hasDiscount && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold">
                            -{discount}%
                          </span>
                        )}
                      </div>

                      {/* 資訊 */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <p className="text-xs text-[#666] uppercase tracking-wider mb-1">
                            {product.brand?.name} · {product.category?.name}
                          </p>
                          <h3 className="font-medium text-[#eee] text-lg mb-2 group-hover:text-[#CBA135] transition-colors">
                            {product.name}
                          </h3>
                          {rating > 0 && (
                            <div className="flex items-center gap-4 text-sm text-[#666]">
                              <div className="flex items-center gap-1">
                                <Star className="text-[#CBA135] fill-[#CBA135]" size={14} />
                                <span>{rating.toFixed(1)}</span>
                              </div>
                              <span>·</span>
                              <span>{product.reviewCount || 0} 則評價</span>
                              <span>·</span>
                              <span>已售 {product.soldCount || 0}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-end justify-between mt-4">
                          <div>
                            {hasDiscount && (
                              <p className="text-sm text-[#555] line-through">
                                ${originalPrice.toLocaleString()}
                              </p>
                            )}
                            <p className={`text-2xl font-bold ${hasDiscount ? 'text-red-400' : 'text-[#CBA135]'}`}>
                              ${price.toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setModalProduct({ id: product.id, name: product.name })
                            }}
                            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#CBA135] to-[#d4a437] text-[#0a0a0a] font-semibold text-sm hover:shadow-lg hover:shadow-[#CBA135]/30 transition-all flex items-center gap-2"
                          >
                            <ShoppingBag size={16} />
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

      {/* 底部裝飾線 */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#CBA135]/30 to-transparent mt-12" />

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

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-[#333]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#CBA135] animate-spin" />
          </div>
          <p className="text-[#666]">載入中...</p>
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  )
}
