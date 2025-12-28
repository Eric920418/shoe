import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronRight, Star, Zap,
  User, Heart, Baby, Search, Grid3X3, Flame, Crown
} from 'lucide-react'
import { prisma } from '@/lib/prisma'

export default async function AllCategoriesPage() {
  // 從資料庫獲取分類
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { products: { where: { isActive: true } } }
      },
      categoryDisplay: true
    }
  })

  // 從資料庫獲取品牌
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { products: { where: { isActive: true } } }
      }
    },
    take: 12
  })

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 標題橫幅 - 淘寶促銷風格 */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-400 text-red-600 px-4 py-1 rounded-full text-sm font-bold mb-3">
              <Grid3X3 size={16} />
              全場分類
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">全部分類</h1>
            <p className="text-white/90">探索我們的完整鞋款系列，找到你的心頭好</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-6">
        {/* 全部產品入口 */}
        <Link
          href="/products"
          className="block bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-4 mb-6 hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                🛒
              </div>
              <div>
                <h3 className="text-xl font-bold">全部產品</h3>
                <p className="text-sm opacity-90">瀏覽所有商品，不限分類</p>
              </div>
            </div>
            <ChevronRight size={24} />
          </div>
        </Link>

        {/* 主要分類 */}
        {categories.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="text-orange-500" size={20} />
              <h2 className="text-lg font-bold text-gray-800">熱門分類</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((category) => {
                const customDisplay = category.categoryDisplay

                return (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.slug}`}
                    className="group bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 hover:from-orange-100 hover:to-red-100 transition-colors border border-orange-100 hover:border-orange-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                          {customDisplay?.displayName || category.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {category._count.products} 款商品
                        </p>
                      </div>
                      <ChevronRight className="text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" size={20} />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6 text-center">
            <p className="text-gray-500">目前沒有分類</p>
          </div>
        )}

        {/* 品牌專區 */}
        {brands.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="text-yellow-500" size={20} />
              <h2 className="text-lg font-bold text-gray-800">品牌專區</h2>
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">HOT</span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/products?brand=${brand.slug}`}
                  className="group bg-gray-50 rounded-lg p-3 hover:bg-orange-50 transition-colors border border-gray-100 hover:border-orange-200 text-center"
                >
                  <div className="h-10 mb-2 flex items-center justify-center">
                    {brand.logo ? (
                      <Image
                        src={brand.logo}
                        alt={brand.name}
                        width={60}
                        height={30}
                        className="opacity-70 group-hover:opacity-100 transition-opacity object-contain"
                      />
                    ) : (
                      <span className="text-xl font-bold text-gray-400 group-hover:text-orange-500 transition-colors">
                        {brand.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-gray-800 text-sm group-hover:text-orange-600 transition-colors">{brand.name}</p>
                  <p className="text-xs text-gray-500">{brand._count.products} 款</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 性別分類 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link
            href="/products?gender=MEN"
            className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">男鞋專區</h3>
                  <p className="text-sm opacity-90">專為男士設計</p>
                </div>
              </div>
              <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/products?gender=WOMEN"
            className="group bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Heart size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">女鞋專區</h3>
                  <p className="text-sm opacity-90">時尚女性之選</p>
                </div>
              </div>
              <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/products?gender=KIDS"
            className="group bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Baby size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">童鞋專區</h3>
                  <p className="text-sm opacity-90">呵護寶貝雙腳</p>
                </div>
              </div>
              <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* 快速入口 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Link
            href="/popular"
            className="group bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow border border-gray-100"
          >
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-red-200 transition-colors">
              <Flame className="text-red-500" size={24} />
            </div>
            <p className="font-medium text-gray-800 group-hover:text-red-500">熱銷排行</p>
          </Link>

          <Link
            href="/new-arrivals"
            className="group bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow border border-gray-100"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-green-200 transition-colors">
              <Zap className="text-green-500" size={24} />
            </div>
            <p className="font-medium text-gray-800 group-hover:text-green-500">新品上架</p>
          </Link>

          <Link
            href="/flash-sale"
            className="group bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow border border-gray-100"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-orange-200 transition-colors">
              <Zap className="text-orange-500" size={24} />
            </div>
            <p className="font-medium text-gray-800 group-hover:text-orange-500">限時搶購</p>
          </Link>

          <Link
            href="/clearance"
            className="group bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow border border-gray-100"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-200 transition-colors">
              <Star className="text-purple-500" size={24} />
            </div>
            <p className="font-medium text-gray-800 group-hover:text-purple-500">清倉特價</p>
          </Link>
        </div>

        {/* 底部搜索區 */}
        <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <Search className="text-orange-500" size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">找不到想要的分類？</h3>
          <p className="text-sm text-gray-600 mb-4">使用搜索功能，快速找到心儀的鞋款</p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-full font-medium transition-colors"
          >
            <Search size={18} />
            立即搜索
          </Link>
        </div>
      </div>
    </div>
  )
}
