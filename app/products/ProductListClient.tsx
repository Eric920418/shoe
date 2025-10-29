'use client'

/**
 * 產品列表客戶端組件 - 顯示所有產品並支援篩選
 */

import { useState } from 'react'
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
  images: string[] | string  // 支援陣列或 JSON 字串
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

export default function ProductListClient() {
  const [categoryId, setCategoryId] = useState<string>('')
  const [brandId, setBrandId] = useState<string>('')
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined)
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined)
  const [gender, setGender] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const { data: productsData, loading: productsLoading, error: productsError } = useQuery(GET_PRODUCTS, {
    variables: {
      skip: 0,
      take: 50,
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      minPrice,
      maxPrice,
      gender: gender || undefined,
      search: search || undefined,
    },
    fetchPolicy: 'network-only',
  })

  const { data: categoriesData } = useQuery(GET_CATEGORIES)
  const { data: brandsData } = useQuery(GET_BRANDS)

  // useQuery 會在 variables 變化時自動重新抓取資料，無需手動 refetch

  const products: Product[] = productsData?.products || []
  const categories: Category[] = categoriesData?.categories || []
  const brands: Brand[] = brandsData?.brands || []

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const resetFilters = () => {
    setCategoryId('')
    setBrandId('')
    setMinPrice(undefined)
    setMaxPrice(undefined)
    setGender('')
    setSearch('')
  }

  if (productsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <h2 className="text-lg font-semibold mb-2">載入產品時發生錯誤</h2>
          <p className="text-sm">{productsError.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 標題 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">所有商品</h1>
        <p className="text-gray-600">共 {products.length} 件商品</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 篩選側邊欄 */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">篩選條件</h2>
              <button
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                重置
              </button>
            </div>

            {/* 搜尋 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                搜尋
              </label>
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="搜尋商品名稱..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 分類篩選 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分類
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部分類</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.productCount})
                  </option>
                ))}
              </select>
            </div>

            {/* 品牌篩選 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                品牌
              </label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部品牌</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name} ({brand.productCount})
                  </option>
                ))}
              </select>
            </div>

            {/* 性別篩選 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                性別
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部</option>
                <option value="MEN">男性</option>
                <option value="WOMEN">女性</option>
                <option value="UNISEX">中性</option>
                <option value="KIDS">兒童</option>
              </select>
            </div>

            {/* 價格篩選 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                價格範圍
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={minPrice || ''}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="最低"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  value={maxPrice || ''}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="最高"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* 產品網格 */}
        <main className="flex-1">
          {productsLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <p className="text-gray-600 text-lg">沒有找到符合條件的產品</p>
              <button
                onClick={resetFilters}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                清除篩選條件
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* 產品圖片 */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {(() => {
                      // 處理 images 欄位的不同格式
                      let imageUrl: string | null = null

                      try {
                        // 如果 images 是字符串，嘗試解析為 JSON
                        if (typeof product.images === 'string') {
                          const parsed = JSON.parse(product.images)
                          if (Array.isArray(parsed) && parsed.length > 0) {
                            imageUrl = parsed[0]
                          }
                        } else if (Array.isArray(product.images) && product.images.length > 0) {
                          // 如果已經是陣列
                          imageUrl = product.images[0]
                        }
                      } catch (error) {
                        console.error('圖片解析錯誤:', error)
                      }

                      if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/'))) {
                        return (
                          <Image
                            src={imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )
                      } else {
                        return (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <div className="text-center">
                              <div className="text-4xl mb-2">👟</div>
                              <div className="text-sm">無圖片</div>
                            </div>
                          </div>
                        )
                      }
                    })()}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">已售完</span>
                      </div>
                    )}
                  </div>

                  {/* 產品資訊 */}
                  <div className="p-4">
                    {product.brand && (
                      <p className="text-xs text-gray-500 mb-1">{product.brand.name}</p>
                    )}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600">
                      {product.name}
                    </h3>

                    {/* 價格 */}
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        ${product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <>
                          <span className="text-sm text-gray-400 line-through">
                            ${product.originalPrice.toLocaleString()}
                          </span>
                          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                            省 ${(product.originalPrice - product.price).toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>

                    {/* 分類 */}
                    {product.category && (
                      <p className="text-xs text-gray-500 mt-2">{product.category.name}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
