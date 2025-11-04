'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Filter, ChevronDown, Star, Heart, ShoppingBag,
  Grid3X3, List, SlidersHorizontal
} from 'lucide-react'
import WishlistButton from '@/components/product/WishlistButton'

export default function CategoryPage() {
  const params = useParams()
  const category = decodeURIComponent(params.category as string)

  const [sortBy, setSortBy] = useState('popular')
  const [priceRange, setPriceRange] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [selectedSize, setSelectedSize] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  // 根據分類獲取對應的產品
  const getCategoryProducts = () => {
    const categoryMap: { [key: string]: any[] } = {
      '運動鞋': [
        {
          id: 1,
          name: 'Nike Air Zoom Pegasus',
          price: 3990,
          originalPrice: 4990,
          image: '/api/placeholder/300/300',
          rating: 4.8,
          reviews: 256,
          brand: 'Nike',
          tag: '熱銷'
        },
        {
          id: 2,
          name: 'Adidas Ultraboost',
          price: 4590,
          originalPrice: 5990,
          image: '/api/placeholder/300/300',
          rating: 4.9,
          reviews: 189,
          brand: 'Adidas',
          tag: '新品'
        }
      ],
      '休閒鞋': [
        {
          id: 3,
          name: 'Converse Chuck Taylor',
          price: 1990,
          originalPrice: 2490,
          image: '/api/placeholder/300/300',
          rating: 4.7,
          reviews: 423,
          brand: 'Converse'
        },
        {
          id: 4,
          name: 'Vans Old Skool',
          price: 2290,
          originalPrice: 2890,
          image: '/api/placeholder/300/300',
          rating: 4.6,
          reviews: 312,
          brand: 'Vans'
        }
      ],
      '皮鞋': [
        {
          id: 5,
          name: 'Clarks Desert Boot',
          price: 3990,
          originalPrice: 4990,
          image: '/api/placeholder/300/300',
          rating: 4.8,
          reviews: 145,
          brand: 'Clarks'
        }
      ],
      '高跟鞋': [
        {
          id: 6,
          name: 'Steve Madden Heels',
          price: 2990,
          originalPrice: 3990,
          image: '/api/placeholder/300/300',
          rating: 4.5,
          reviews: 89,
          brand: 'Steve Madden'
        }
      ],
      '涼鞋': [
        {
          id: 7,
          name: 'Birkenstock Arizona',
          price: 2490,
          originalPrice: 2990,
          image: '/api/placeholder/300/300',
          rating: 4.7,
          reviews: 234,
          brand: 'Birkenstock'
        }
      ],
      '童鞋': [
        {
          id: 8,
          name: 'Nike Kids Flex Runner',
          price: 1490,
          originalPrice: 1990,
          image: '/api/placeholder/300/300',
          rating: 4.8,
          reviews: 156,
          brand: 'Nike',
          tag: '兒童專屬'
        }
      ]
    }

    // 如果沒有找到對應分類，返回預設產品
    return categoryMap[category] || [
      {
        id: 1,
        name: 'Sample Product',
        price: 2990,
        originalPrice: 3990,
        image: '/api/placeholder/300/300',
        rating: 4.5,
        reviews: 100,
        brand: 'Brand'
      }
    ]
  }

  const products = getCategoryProducts()
  const brands = ['all', 'Nike', 'Adidas', 'New Balance', 'Converse', 'Vans']
  const sizes = ['all', '36', '37', '38', '39', '40', '41', '42', '43', '44']
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
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">首頁</Link>
            <span className="text-gray-400">/</span>
            <Link href="/all-categories" className="text-gray-500 hover:text-gray-700">全部分類</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-800 font-medium">{category}</span>
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

            {/* 品牌篩選 */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">品牌</h4>
              <div className="space-y-2">
                {brands.map(brand => (
                  <label key={brand} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="brand"
                      value={brand}
                      checked={selectedBrand === brand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="text-orange-500"
                    />
                    <span className="text-sm text-gray-600">
                      {brand === 'all' ? '全部品牌' : brand}
                    </span>
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

            {/* 尺碼篩選 */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">尺碼</h4>
              <div className="grid grid-cols-3 gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-1 rounded text-sm transition-colors ${
                      selectedSize === size
                        ? 'bg-orange-500 text-white'
                        : 'border border-gray-300 text-gray-700 hover:border-orange-500'
                    }`}
                  >
                    {size === 'all' ? '全部' : size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 主要內容區 */}
          <div className="flex-1">
            {/* 頂部工具列 */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-800">{category}</h1>

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
            </div>

            {/* 產品網格/列表 */}
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                : "space-y-4"
            }>
              {products.map((product) => (
                viewMode === 'grid' ? (
                  // 網格視圖
                  <div
                    key={product.id}
                    className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
                  >
                    <Link href={`/products/${product.id}`}>
                      <div className="relative aspect-square bg-gray-100">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />

                        {product.tag && (
                          <span className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                            {product.tag}
                          </span>
                        )}

                        <div className="absolute top-2 right-2 z-20">
                          <WishlistButton productId={product.id.toString()} size="sm" />
                        </div>
                      </div>

                      <div className="p-3">
                        <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
                        <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2">
                          {product.name}
                        </h3>

                        <div className="flex items-center gap-1 mb-2">
                          <Star className="text-yellow-400 fill-current" size={12} />
                          <span className="text-xs text-gray-600">{product.rating}</span>
                          <span className="text-xs text-gray-400">({product.reviews})</span>
                        </div>

                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs text-gray-400 line-through">
                              ${product.originalPrice}
                            </p>
                            <p className="text-lg font-bold text-orange-600">
                              ${product.price}
                            </p>
                          </div>
                          <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium">
                            <ShoppingBag size={14} className="inline mr-1" />
                            加入
                          </button>
                        </div>
                      </div>
                    </Link>
                  </div>
                ) : (
                  // 列表視圖
                  <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
                    <Link href={`/products/${product.id}`}>
                      <div className="flex gap-4">
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
                              <h3 className="font-medium text-gray-800 mb-2">{product.name}</h3>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center gap-1">
                                  <Star className="text-yellow-400 fill-current" size={14} />
                                  <span className="text-sm">{product.rating}</span>
                                </div>
                                <span className="text-gray-400">|</span>
                                <span className="text-sm text-gray-600">{product.reviews} 則評價</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-400 line-through">${product.originalPrice}</p>
                              <p className="text-xl font-bold text-orange-600">${product.price}</p>
                              <button className="mt-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium">
                                加入購物車
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}