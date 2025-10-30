'use client'

import { useState, useMemo, memo, useEffect, useRef } from 'react'
import { useQuery } from '@apollo/client'
import { GET_PRODUCTS, GET_CATEGORIES, GET_BRANDS } from '@/graphql/queries'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  originalPrice?: number
  images: string[] | string
  stock: number
  brand?: {
    name: string
  }
  category?: {
    name: string
  }
}

interface Category {
  id: string
  name: string
  slug: string
  productCount: number
}

interface Brand {
  id: string
  name: string
  slug: string
  logo?: string
  productCount: number
}

// ✅ 圖片解析工具函數（只執行一次）
const parseFirstImage = (images: string[] | string): string | null => {
  try {
    if (typeof images === 'string') {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0]
      }
    } else if (Array.isArray(images) && images.length > 0) {
      return images[0]
    }
  } catch (error) {
    console.error('圖片解析錯誤:', error)
  }
  return null
}

// ✅ 產品圖片組件（使用 memo 避免不必要的重渲染）
const ProductImage = memo(({ images, name, stock }: { images: string[] | string; name: string; stock: number }) => {
  const imageUrl = useMemo(() => parseFirstImage(images), [images])

  return (
    <div className="relative aspect-square overflow-hidden bg-gray-100 mb-3">
      {imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/')) ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          loading="lazy"
          quality={75}
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-2">👟</div>
            <div className="text-xs">無圖片</div>
          </div>
        </div>
      )}
      {stock === 0 && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <span className="text-white font-semibold">已售完</span>
        </div>
      )}
    </div>
  )
})

ProductImage.displayName = 'ProductImage'

// ✅ 產品卡片骨架屏組件
const ProductSkeleton = () => (
  <div className="animate-pulse">
    {/* 圖片骨架 */}
    <div className="relative aspect-square bg-gray-200 mb-3 rounded"></div>
    {/* 資訊骨架 */}
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </div>
  </div>
)

export default function ModernProductListClient() {
  const [categoryId, setCategoryId] = useState<string>('')
  const [brandId, setBrandId] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const PRODUCTS_PER_PAGE = 20

  const { data: productsData, loading: productsLoading, error: productsError, fetchMore } = useQuery(GET_PRODUCTS, {
    variables: {
      skip: 0,
      take: PRODUCTS_PER_PAGE,
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      gender: gender || undefined,
    },
    fetchPolicy: 'cache-and-network', // ✅ 優先顯示快取，背景更新
    onCompleted: (data) => {
      setAllProducts(data.products || [])
      setPage(1)
    }
  })

  const { data: categoriesData } = useQuery(GET_CATEGORIES)
  const { data: brandsData } = useQuery(GET_BRANDS)

  const categories: Category[] = categoriesData?.categories || []
  const brands: Brand[] = brandsData?.brands || []

  // ✅ 無限滾動 - Intersection Observer
  useEffect(() => {
    if (!loadMoreRef.current || productsLoading) return

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !productsLoading && allProducts.length >= PRODUCTS_PER_PAGE * page) {
          // 載入更多產品
          const nextPage = page + 1
          try {
            const { data } = await fetchMore({
              variables: {
                skip: PRODUCTS_PER_PAGE * page,
                take: PRODUCTS_PER_PAGE,
              }
            })

            if (data?.products?.length > 0) {
              setAllProducts(prev => [...prev, ...data.products])
              setPage(nextPage)
            }
          } catch (error) {
            console.error('載入更多產品失敗:', error)
          }
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [page, productsLoading, allProducts.length, fetchMore, categoryId, brandId, gender])

  // 篩選條件改變時重置
  useEffect(() => {
    setPage(1)
    setAllProducts(productsData?.products || [])
  }, [categoryId, brandId, gender, productsData])

  const resetFilters = () => {
    setCategoryId('')
    setBrandId('')
    setGender('')
    setSortBy('newest')
    setPage(1)
  }

  const activeFiltersCount = [categoryId, brandId, gender].filter(Boolean).length

  if (productsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold mb-2 text-red-800">載入失敗</h2>
          <p className="text-sm text-red-600">{productsError.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">

      {/* 篩選列 */}
      <div className="border-b sticky top-16 bg-white z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* 左側：篩選按鈕 + 產品計數 */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm font-medium">
                  篩選
                  {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
                </span>
              </button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  清除全部
                </button>
              )}

              {/* ✅ 顯示已載入產品數量 */}
              {allProducts.length > 0 && (
                <span className="text-sm text-gray-500">
                  已載入 {allProducts.length} 件商品
                </span>
              )}
            </div>

            {/* 右側：排序 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 hidden sm:inline">排序：</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm font-medium border-none bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="newest">最新上架</option>
                <option value="popular">最受歡迎</option>
                <option value="price-low">價格：低到高</option>
                <option value="price-high">價格：高到低</option>
              </select>
            </div>
          </div>

          {/* 篩選面板（展開時） */}
          {showFilters && (
            <div className="border-t py-6 space-y-6">
              {/* 性別篩選 */}
              <div>
                <h3 className="text-sm font-semibold text-black mb-3">性別</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: '', label: '全部' },
                    { value: 'MALE', label: '男性' },
                    { value: 'FEMALE', label: '女性' },
                    { value: 'UNISEX', label: '中性' },
                    { value: 'KIDS', label: '兒童' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setGender(option.value)}
                      className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                        gender === option.value
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-gray-300 hover:border-black'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 分類篩選 */}
              <div>
                <h3 className="text-sm font-semibold text-black mb-3">分類</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategoryId('')}
                    className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                      !categoryId
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-gray-300 hover:border-black'
                    }`}
                  >
                    全部
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setCategoryId(category.id)}
                      className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                        categoryId === category.id
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-gray-300 hover:border-black'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 品牌篩選 */}
              <div>
                <h3 className="text-sm font-semibold text-black mb-3">品牌</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setBrandId('')}
                    className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                      !brandId
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-gray-300 hover:border-black'
                    }`}
                  >
                    全部
                  </button>
                  {brands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => setBrandId(brand.id)}
                      className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                        brandId === brand.id
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-gray-300 hover:border-black'
                      }`}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 產品網格 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {productsLoading && allProducts.length === 0 ? (
          // ✅ 使用骨架屏替代 spinner（更好的 UX）
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : allProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg mb-4">沒有找到符合條件的產品</p>
            <button
              onClick={resetFilters}
              className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              清除篩選條件
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {allProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group"
              >
                {/* ✅ 產品圖片（使用優化後的組件） */}
                <ProductImage images={product.images} name={product.name} stock={product.stock} />

                {/* 產品資訊 */}
                <div className="space-y-1">
                  {/* 品牌/分類 */}
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                    {product.brand?.name || product.category?.name || 'SHOE STORE'}
                  </p>

                  {/* 產品名稱 */}
                  <h3 className="text-sm font-semibold text-black line-clamp-2 group-hover:underline">
                    {product.name}
                  </h3>

                  {/* 價格 */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-sm font-semibold text-black">
                      NT$ {product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-xs text-gray-400 line-through">
                        NT$ {product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ✅ 無限滾動觸發器 */}
          <div ref={loadMoreRef} className="py-8 text-center">
            {productsLoading && allProducts.length > 0 && (
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                <span className="ml-3 text-sm text-gray-600">載入更多...</span>
              </div>
            )}
          </div>
        </>
        )}
      </div>
    </div>
  )
}
