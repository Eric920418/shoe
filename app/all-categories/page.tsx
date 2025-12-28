import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Grid3X3, ChevronRight, Star,
  Users, Baby, Heart, Footprints
} from 'lucide-react'
import { prisma } from '@/lib/prisma'

// 分類顯示配置（icon 和顏色）
const categoryDisplayConfig: Record<string, { icon: string; bgColor: string }> = {
  '運動鞋': { icon: '👟', bgColor: 'from-blue-500 to-cyan-500' },
  '休閒鞋': { icon: '👞', bgColor: 'from-green-500 to-teal-500' },
  '皮鞋': { icon: '👔', bgColor: 'from-gray-600 to-gray-800' },
  '高跟鞋': { icon: '👠', bgColor: 'from-pink-500 to-rose-500' },
  '涼鞋': { icon: '🩴', bgColor: 'from-yellow-500 to-orange-500' },
  '童鞋': { icon: '👶', bgColor: 'from-purple-500 to-indigo-500' },
  '靴子': { icon: '🥾', bgColor: 'from-amber-600 to-yellow-700' },
  '特殊功能鞋': { icon: '⚡', bgColor: 'from-red-500 to-orange-600' },
}

// 預設配置（用於未定義的分類）
const defaultDisplayConfig = { icon: '👞', bgColor: 'from-gray-500 to-gray-600' }

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
    take: 12 // 只顯示前 12 個品牌
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="text-center">
            <Grid3X3 className="mx-auto mb-3" size={40} />
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">全部分類</h1>
            <p className="text-sm sm:text-base opacity-90">探索我們的完整鞋款系列</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-6">
        {/* 主要分類 */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {categories.map((category) => {
              const displayConfig = categoryDisplayConfig[category.name] || defaultDisplayConfig
              const customDisplay = category.categoryDisplay

              return (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all group"
                >
                  <div className={`h-32 bg-gradient-to-r ${customDisplay?.bgColor || displayConfig.bgColor} p-4 relative overflow-hidden`}>
                    <div className="relative z-10">
                      <span className="text-4xl">{customDisplay?.icon || displayConfig.icon}</span>
                      <h3 className="text-xl font-bold text-white mt-2">
                        {customDisplay?.displayName || category.name}
                      </h3>
                      <p className="text-white/80 text-sm">{category._count.products} 款商品</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full" />
                  </div>

                  <div className="p-4">
                    <button className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded text-sm transition-colors">
                      查看全部
                    </button>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8 text-center">
            <p className="text-gray-500">目前沒有分類</p>
          </div>
        )}

        {/* 品牌分類 */}
        {brands.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Star className="text-yellow-500" />
              品牌專區
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/products?brand=${brand.slug}`}
                  className="border rounded-lg p-4 hover:border-orange-500 hover:shadow-md transition-all text-center"
                >
                  <div className="h-12 mb-2 flex items-center justify-center">
                    {brand.logo ? (
                      <Image
                        src={brand.logo}
                        alt={brand.name}
                        width={80}
                        height={40}
                        className="opacity-70 hover:opacity-100 transition-opacity object-contain"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-gray-400">
                        {brand.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-gray-800">{brand.name}</p>
                  <p className="text-xs text-gray-500">{brand._count.products} 款商品</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 特殊分類 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/products?gender=MEN"
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <Users className="mb-2" size={32} />
                <h3 className="text-xl font-bold mb-1">男鞋專區</h3>
                <p className="text-sm opacity-90">專為男士設計</p>
              </div>
              <ChevronRight size={24} />
            </div>
          </Link>

          <Link
            href="/products?gender=WOMEN"
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <Heart className="mb-2" size={32} />
                <h3 className="text-xl font-bold mb-1">女鞋專區</h3>
                <p className="text-sm opacity-90">時尚女性之選</p>
              </div>
              <ChevronRight size={24} />
            </div>
          </Link>

          <Link
            href="/products?gender=KIDS"
            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <Baby className="mb-2" size={32} />
                <h3 className="text-xl font-bold mb-1">童鞋專區</h3>
                <p className="text-sm opacity-90">呵護寶貝雙腳</p>
              </div>
              <ChevronRight size={24} />
            </div>
          </Link>
        </div>

        {/* 底部推薦 */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 text-center">
          <Footprints className="mx-auto text-indigo-600 mb-3" size={48} />
          <h3 className="text-lg font-bold text-gray-800 mb-2">找不到想要的分類？</h3>
          <p className="text-sm text-gray-600 mb-4">使用我們的智能搜索，快速找到心儀的鞋款</p>
          <Link
            href="/search"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            立即搜索
          </Link>
        </div>
      </div>
    </div>
  )
}
