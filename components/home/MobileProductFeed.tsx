'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Flame, Zap } from 'lucide-react'
import { useQuery } from '@apollo/client'
import { GET_HOMEPAGE_PRODUCTS, GET_CATEGORIES, GET_BRANDS } from '@/graphql/queries'
import WishlistButton from '@/components/product/WishlistButton'
import QuickAddToCartModal from '@/components/product/QuickAddToCartModal'

// 排序類型
type SortType = 'recommend' | 'sales' | 'newest' | 'price_asc' | 'price_desc'

interface MobileProductFeedProps {
  serverProducts?: any[]
  serverCategories?: any[]
  serverBrands?: any[]
}

interface FilterState {
  categoryIds: string[]
  brandIds: string[]
  minPrice?: number
  maxPrice?: number
  sortBy: SortType
}

export default function MobileProductFeed({
  serverProducts,
  serverCategories,
  serverBrands,
}: MobileProductFeedProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loadedCount, setLoadedCount] = useState(0) // 追蹤已載入的產品數量
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [modalProduct, setModalProduct] = useState<{ id: string; name: string } | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const ITEMS_PER_PAGE = 20

  // 篩選狀態
  const [filters, setFilters] = useState<FilterState>({
    categoryIds: [],
    brandIds: [],
    sortBy: 'recommend',
  })
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [tempFilters, setTempFilters] = useState<FilterState>(filters)

  // 查詢分類
  const { data: categoriesData } = useQuery(GET_CATEGORIES, {
    skip: !!serverCategories,
  })
  const categories = serverCategories || categoriesData?.categories || []

  // 查詢品牌
  const { data: brandsData } = useQuery(GET_BRANDS, {
    skip: !!serverBrands,
  })
  const brands = serverBrands || brandsData?.brands || []

  // 查詢產品
  const { data, loading, fetchMore, refetch } = useQuery(GET_HOMEPAGE_PRODUCTS, {
    variables: {
      skip: 0,
      take: ITEMS_PER_PAGE,
      categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
      brandIds: filters.brandIds.length > 0 ? filters.brandIds : undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
    },
    // 如果有 serverProducts 且沒有篩選條件，跳過初始查詢
    skip: !!serverProducts && filters.categoryIds.length === 0 && filters.brandIds.length === 0 && !filters.minPrice && !filters.maxPrice,
    notifyOnNetworkStatusChange: true,
  })

  // 處理初始資料
  useEffect(() => {
    const rawProducts = serverProducts || data?.products || []
    const processed = processProducts(rawProducts, filters.sortBy)
    setProducts(processed)
    setLoadedCount(rawProducts.length) // 記錄初始載入的數量
    setHasMore(rawProducts.length >= ITEMS_PER_PAGE)
  }, [serverProducts, data, filters.sortBy])

  // 處理產品資料（排序、標記特價）
  const processProducts = (rawProducts: any[], sortBy: SortType) => {
    let processed = rawProducts.map((product: any) => {
      const price = parseFloat(product.price)
      const originalPrice = parseFloat(product.originalPrice) || price
      const discount = originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0
      const images = Array.isArray(product.images) ? product.images : []
      const image = images.length > 0 ? images[0] : '/api/placeholder/200/200'

      return {
        ...product,
        price,
        originalPrice,
        discount,
        image,
        isOnSale: discount >= 20, // 折扣 ≥ 20% 視為特價
        isFlashSale: discount >= 40, // 折扣 ≥ 40% 視為限時特賣
        soldCount: product.soldCount || 0,
        rating: product.averageRating ? Number(product.averageRating) : 0,
      }
    })

    // 排序
    switch (sortBy) {
      case 'sales':
        processed.sort((a, b) => b.soldCount - a.soldCount)
        break
      case 'newest':
        // 假設 id 較大的較新（或可用 createdAt）
        processed.sort((a, b) => b.id.localeCompare(a.id))
        break
      case 'price_asc':
        processed.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        processed.sort((a, b) => b.price - a.price)
        break
      default:
        // recommend: 混合特價和一般商品
        // 每 6 個普通商品後插入 2 個特價商品
        const saleProducts = processed.filter(p => p.isOnSale)
        const regularProducts = processed.filter(p => !p.isOnSale)
        const mixed: any[] = []
        let saleIndex = 0
        let regularIndex = 0

        while (regularIndex < regularProducts.length || saleIndex < saleProducts.length) {
          // 添加 6 個普通商品
          for (let i = 0; i < 6 && regularIndex < regularProducts.length; i++) {
            mixed.push(regularProducts[regularIndex++])
          }
          // 添加 2 個特價商品
          for (let i = 0; i < 2 && saleIndex < saleProducts.length; i++) {
            mixed.push({ ...saleProducts[saleIndex++], insertedAsSale: true })
          }
        }
        processed = mixed
        break
    }

    return processed
  }

  // 載入更多
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const result = await fetchMore({
        variables: {
          skip: loadedCount, // 使用實際已載入數量作為 skip
          take: ITEMS_PER_PAGE,
        },
      })

      const newProducts = result.data?.products || []
      if (newProducts.length < ITEMS_PER_PAGE) {
        setHasMore(false)
      }

      if (newProducts.length > 0) {
        const processed = processProducts(newProducts, filters.sortBy)
        setProducts(prev => [...prev, ...processed])
        setLoadedCount(prev => prev + newProducts.length) // 累加實際載入數量
      }
    } catch (error) {
      console.error('載入更多產品失敗:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [loadedCount, fetchMore, hasMore, isLoadingMore, filters.sortBy])

  // Intersection Observer 實現無限滾動
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [loadMore, hasMore, isLoadingMore, loading])

  // 快速排序切換（只重新排序現有產品，不需要重新載入）
  const handleSortChange = (sortBy: SortType) => {
    setFilters(prev => ({ ...prev, sortBy }))
  }

  // 套用篩選
  const applyFilters = () => {
    setFilters(tempFilters)
    setShowFilterPanel(false)
    setLoadedCount(0) // 重置已載入數量
    setHasMore(true)
    refetch({
      skip: 0,
      take: ITEMS_PER_PAGE,
      categoryIds: tempFilters.categoryIds.length > 0 ? tempFilters.categoryIds : undefined,
      brandIds: tempFilters.brandIds.length > 0 ? tempFilters.brandIds : undefined,
      minPrice: tempFilters.minPrice,
      maxPrice: tempFilters.maxPrice,
    })
  }

  // 重置篩選
  const resetFilters = () => {
    const reset: FilterState = { categoryIds: [], brandIds: [], sortBy: 'recommend' }
    setTempFilters(reset)
    setFilters(reset)
    setShowFilterPanel(false)
    setLoadedCount(0) // 重置已載入數量
    setHasMore(true)
    refetch({
      skip: 0,
      take: ITEMS_PER_PAGE,
    })
  }

  // 格式化銷量
  const formatSales = (count: number) => {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}萬`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
    return count.toString()
  }

  const sortOptions: { key: SortType; label: string }[] = [
    { key: 'recommend', label: '推薦' },
    { key: 'sales', label: '熱銷' },
    { key: 'newest', label: '新品' },
    { key: 'price_asc', label: '價格↑' },
    { key: 'price_desc', label: '價格↓' },
  ]

  // 檢查是否有啟用篩選
  const hasActiveFilters = filters.categoryIds.length > 0 || filters.brandIds.length > 0 || filters.minPrice || filters.maxPrice

  return (
    <div className="md:hidden">
      {/* 懸浮篩選器 - 固定在 Header 下方 */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        {/* 排序選項 */}
        <div className="flex items-center px-2 py-2 gap-1 overflow-x-auto scrollbar-hide">
          {sortOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => handleSortChange(option.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                filters.sortBy === option.key
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}

          {/* 篩選按鈕 */}
          <button
            onClick={() => {
              setTempFilters(filters)
              setShowFilterPanel(true)
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1 ${
              hasActiveFilters
                ? 'bg-orange-100 text-orange-600 border border-orange-300'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            篩選
            {hasActiveFilters && <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />}
          </button>
        </div>
      </div>

      {/* 篩選面板 */}
      {showFilterPanel && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilterPanel(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 標題 */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-base">篩選條件</h3>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 分類篩選（可複選） */}
            <div className="px-4 py-3 border-b border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                分類
                {tempFilters.categoryIds.length > 0 && (
                  <span className="ml-2 text-orange-500">已選 {tempFilters.categoryIds.length}</span>
                )}
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTempFilters(prev => ({ ...prev, categoryIds: [] }))}
                  className={`px-3 py-1.5 rounded-full text-xs ${
                    tempFilters.categoryIds.length === 0
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  全部
                </button>
                {categories.filter((c: any) => c.isActive).map((category: any) => {
                  const isSelected = tempFilters.categoryIds.includes(category.id)
                  return (
                    <button
                      key={category.id}
                      onClick={() => setTempFilters(prev => ({
                        ...prev,
                        categoryIds: isSelected
                          ? prev.categoryIds.filter(id => id !== category.id)
                          : [...prev.categoryIds, category.id]
                      }))}
                      className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 ${
                        isSelected
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {category.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 品牌篩選（可複選） */}
            <div className="px-4 py-3 border-b border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                品牌
                {tempFilters.brandIds.length > 0 && (
                  <span className="ml-2 text-orange-500">已選 {tempFilters.brandIds.length}</span>
                )}
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTempFilters(prev => ({ ...prev, brandIds: [] }))}
                  className={`px-3 py-1.5 rounded-full text-xs ${
                    tempFilters.brandIds.length === 0
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  全部
                </button>
                {brands.filter((b: any) => b.isActive).slice(0, 12).map((brand: any) => {
                  const isSelected = tempFilters.brandIds.includes(brand.id)
                  return (
                    <button
                      key={brand.id}
                      onClick={() => setTempFilters(prev => ({
                        ...prev,
                        brandIds: isSelected
                          ? prev.brandIds.filter(id => id !== brand.id)
                          : [...prev.brandIds, brand.id]
                      }))}
                      className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 ${
                        isSelected
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {brand.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 價格範圍 */}
            <div className="px-4 py-3 border-b border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2">價格範圍</h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="最低"
                  value={tempFilters.minPrice || ''}
                  onChange={(e) => setTempFilters(prev => ({
                    ...prev,
                    minPrice: e.target.value ? Number(e.target.value) : undefined
                  }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="最高"
                  value={tempFilters.maxPrice || ''}
                  onChange={(e) => setTempFilters(prev => ({
                    ...prev,
                    maxPrice: e.target.value ? Number(e.target.value) : undefined
                  }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* 按鈕區 */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600"
              >
                重置
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium"
              >
                套用篩選
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 商品瀑布流 */}
      <div className="px-2 py-2 bg-gray-50">
        <div className="grid grid-cols-2 gap-2">
          {products.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className={`bg-white rounded-lg overflow-hidden shadow-sm ${
                product.isFlashSale ? 'ring-2 ring-red-400' : ''
              }`}
            >
              <Link href={`/products/${product.slug}`}>
                {/* 商品圖片 */}
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="50vw"
                  />

                  {/* 特價標籤 */}
                  {product.isFlashSale && (
                    <div className="absolute top-0 left-0 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-0.5 rounded-br-lg flex items-center gap-1">
                      <Zap size={10} className="fill-current" />
                      <span className="text-[10px] font-bold">限時特賣</span>
                    </div>
                  )}
                  {product.isOnSale && !product.isFlashSale && (
                    <div className="absolute top-0 left-0 bg-red-500 text-white px-2 py-0.5 rounded-br-lg">
                      <span className="text-[10px] font-bold">{product.discount}% OFF</span>
                    </div>
                  )}

                  {/* 願望清單按鈕 */}
                  <div className="absolute top-1 right-1 z-10">
                    <WishlistButton productId={product.id} size="sm" />
                  </div>
                </div>

                {/* 商品資訊 */}
                <div className="p-2">
                  {/* 商品名稱 */}
                  <h3 className="text-xs text-gray-800 line-clamp-2 min-h-[32px] mb-1">
                    {product.name}
                  </h3>

                  {/* 價格 */}
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-red-500 font-bold text-sm">
                      ${product.price}
                    </span>
                    {product.originalPrice > product.price && (
                      <span className="text-gray-400 text-[10px] line-through">
                        ${product.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* 銷量與評分 */}
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>已售 {formatSales(product.soldCount)}</span>
                    {product.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Star size={10} className="text-yellow-400 fill-current" />
                        <span>{product.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* 特價產品額外標籤 */}
                  {product.insertedAsSale && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-orange-600">
                      <Flame size={10} />
                      <span>熱銷特惠</span>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* 載入更多指示器 */}
        <div ref={loadMoreRef} className="py-4 text-center">
          {isLoadingMore || loading ? (
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              載入中...
            </div>
          ) : hasMore ? (
            <span className="text-gray-400 text-xs">向下滾動載入更多</span>
          ) : products.length > 0 ? (
            <span className="text-gray-400 text-xs">已顯示全部商品</span>
          ) : null}
        </div>

        {/* 空狀態 */}
        {!loading && products.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">沒有找到符合條件的商品</p>
            <button
              onClick={resetFilters}
              className="mt-3 text-orange-500 text-sm font-medium"
            >
              清除篩選條件
            </button>
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

      {/* 動畫樣式 */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
