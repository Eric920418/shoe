'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Star, Flame, Zap, Search, Heart, ShoppingCart } from 'lucide-react'
import { ProductCardImage } from '@/components/common/ProductImage'
import { useQuery } from '@apollo/client'
import { GET_HOMEPAGE_PRODUCTS, GET_CATEGORIES } from '@/graphql/queries'
import WishlistButton from '@/components/product/WishlistButton'
import QuickAddToCartModal from '@/components/product/QuickAddToCartModal'
import { useCart } from '@/contexts/CartContext'

// 排序類型
type SortType = 'recommend' | 'sales' | 'newest' | 'price_asc' | 'price_desc'

interface MobileProductFeedProps {
  serverProducts?: any[]
  serverCategories?: any[]
}

interface FilterState {
  categoryIds: string[]
  minPrice?: number
  maxPrice?: number
  sortBy: SortType
}

export default function MobileProductFeed({
  serverProducts,
  serverCategories,
}: MobileProductFeedProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { cartCount, wishlistCount } = useCart()
  const [searchQuery, setSearchQuery] = useState('')

  const [products, setProducts] = useState<any[]>([])
  const [loadedCount, setLoadedCount] = useState(0) // 追蹤已載入的產品數量
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [modalProduct, setModalProduct] = useState<{ id: string; name: string } | null>(null)
  const [isFilterFixed, setIsFilterFixed] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const ITEMS_PER_PAGE = 20

  // 監聽滾動，判斷篩選器是否應該固定
  useEffect(() => {
    const filterEl = filterRef.current
    if (!filterEl) return

    const handleScroll = () => {
      // 取得篩選器相對於視窗的位置
      const rect = filterEl.getBoundingClientRect()
      // 當篩選器頂部碰到視窗頂部時，固定它
      setIsFilterFixed(rect.top <= 0)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // 初始檢查
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])


  // 從 URL 解析篩選狀態
  const parseFiltersFromUrl = useCallback((): FilterState => {
    const categoryIds = searchParams.get('categories')?.split(',').filter(Boolean) || []
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
    const sortBy = (searchParams.get('sort') as SortType) || 'recommend'
    return { categoryIds, minPrice, maxPrice, sortBy }
  }, [searchParams])

  // 篩選狀態 - 從 URL 初始化
  const [filters, setFilters] = useState<FilterState>(parseFiltersFromUrl)

  // 當 URL 變化時更新篩選狀態（處理返回鍵）
  useEffect(() => {
    const urlFilters = parseFiltersFromUrl()
    setFilters(urlFilters)
    setLoadedCount(0)
    setHasMore(true)
  }, [searchParams, parseFiltersFromUrl])

  // 將篩選狀態同步到 URL
  const updateUrlWithFilters = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams()

    if (newFilters.categoryIds.length > 0) {
      params.set('categories', newFilters.categoryIds.join(','))
    }
    if (newFilters.minPrice !== undefined) {
      params.set('minPrice', String(newFilters.minPrice))
    }
    if (newFilters.maxPrice !== undefined) {
      params.set('maxPrice', String(newFilters.maxPrice))
    }
    if (newFilters.sortBy !== 'recommend') {
      params.set('sort', newFilters.sortBy)
    }

    const queryString = params.toString()
    const newUrl = queryString ? `/?${queryString}` : '/'

    // 使用 push 建立新的歷史記錄，這樣返回鍵可以返回上一個篩選狀態
    router.push(newUrl, { scroll: false })
  }, [router])

  // 查詢分類
  const { data: categoriesData } = useQuery(GET_CATEGORIES, {
    skip: !!serverCategories,
  })
  const categories = serverCategories || categoriesData?.categories || []

  // 判斷是否有篩選條件
  const hasFilters = filters.categoryIds.length > 0 || !!filters.minPrice || !!filters.maxPrice

  // 查詢產品 - 只在有篩選條件時執行（沒有篩選條件時使用 serverProducts）
  const { data, loading, fetchMore } = useQuery(GET_HOMEPAGE_PRODUCTS, {
    variables: {
      skip: 0,
      take: ITEMS_PER_PAGE,
      categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
    },
    // 只有在有篩選條件時才執行查詢
    skip: !hasFilters,
    fetchPolicy: 'network-only', // 確保每次都從伺服器獲取最新資料
    notifyOnNetworkStatusChange: true,
  })

  // 處理初始資料
  useEffect(() => {
    // 有篩選條件時，使用查詢結果；否則使用伺服器端資料
    const rawProducts = hasFilters ? (data?.products || []) : (serverProducts || [])
    const processed = processProducts(rawProducts, filters.sortBy)
    setProducts(processed)
    setLoadedCount(rawProducts.length) // 記錄初始載入的數量
    setHasMore(rawProducts.length >= ITEMS_PER_PAGE)
  }, [serverProducts, data, filters.sortBy, hasFilters])

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

  // 快速排序切換 - 同步到 URL
  const handleSortChange = (sortBy: SortType) => {
    const newFilters = { ...filters, sortBy }
    updateUrlWithFilters(newFilters)
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

  // 篩選器內容（用於固定和非固定狀態）
  const FilterContent = () => (
    <>
      {/* 猜你喜歡標題 */}
      <div className="py-2.5 px-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-center gap-2">
          <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent flex-1" />
          <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <span className="text-orange-500">✦</span>
            猜你喜歡
            <span className="text-orange-500">✦</span>
          </span>
          <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent flex-1" />
        </div>
      </div>

      {/* 排序選項 */}
      <div className="flex items-center px-2 py-2 gap-1 overflow-x-auto scrollbar-hide border-b border-gray-100 bg-white">
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
      </div>
    </>
  )

  // 計算篩選器高度（猜你喜歡 + 排序按鈕）
  const filterHeight = 88 // 約 88px

  return (
    <div className="mt-2">
      {/* 篩選器容器 */}
      <div ref={filterRef}>
        {/* 固定時顯示的搜尋欄 + 篩選器 */}
        {isFilterFixed && (
          <div className="fixed top-0 left-0 right-0 z-[100] bg-white shadow-md md:hidden">
            {/* 搜尋欄 */}
            <div className="bg-white border-b px-2 py-2">
              <div className="flex items-center gap-2">
                {/* Logo */}
                <Link href="/" className="flex-shrink-0">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-sm px-2 py-1 rounded-lg">
                    財神賣鞋
                  </div>
                </Link>

                {/* 搜索框 */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (searchQuery.trim()) {
                      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                    }
                  }}
                  className="flex-1 relative"
                >
                  <input
                    type="text"
                    placeholder="搜索商品..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 text-sm border-2 border-orange-500 rounded-full focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-0 bottom-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 rounded-r-full"
                  >
                    <Search size={18} />
                  </button>
                </form>

                {/* 購物車和收藏 */}
                <div className="flex items-center gap-1">
                  <Link href="/wishlist" className="relative p-1.5">
                    <Heart size={20} className="text-gray-600" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        {wishlistCount > 99 ? '99+' : wishlistCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/cart" className="relative p-1.5">
                    <ShoppingCart size={20} className="text-gray-600" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            </div>

            {/* 篩選器 */}
            <FilterContent />
          </div>
        )}

        {/* 原位置的篩選器（固定時作為佔位，保持相同高度避免跳動） */}
        <div className={isFilterFixed ? 'invisible' : ''}>
          <FilterContent />
        </div>

        {/* 固定時的額外佔位空間（搜尋欄高度約 52px） */}
        {isFilterFixed && <div className="h-[52px]" />}
      </div>

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
                  <ProductCardImage
                    src={product.image}
                    alt={product.name}
                    hoverScale={false}
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
                  <h3 className="text-xs text-gray-800 line-clamp-2 min-h-[32px] mb-1">
                    {product.name}
                  </h3>

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

                  {product.rating > 0 && (
                    <div className="flex items-center justify-end text-[10px] text-gray-500">
                      <div className="flex items-center gap-0.5">
                        <Star size={10} className="text-yellow-400 fill-current" />
                        <span>{product.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  )}

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
            <p className="text-gray-500 text-sm">暫無商品</p>
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
