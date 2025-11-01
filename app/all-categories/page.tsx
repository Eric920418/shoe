'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Grid3X3, ChevronRight, TrendingUp, Star,
  Sparkles, Users, Baby, Heart, Footprints
} from 'lucide-react'

export default function AllCategoriesPage() {
  const mainCategories = [
    {
      name: '運動鞋',
      icon: '👟',
      image: '/api/placeholder/400/300',
      count: 2345,
      bgColor: 'from-blue-500 to-cyan-500',
      subcategories: ['跑步鞋', '籃球鞋', '足球鞋', '訓練鞋']
    },
    {
      name: '休閒鞋',
      icon: '👞',
      image: '/api/placeholder/400/300',
      count: 1892,
      bgColor: 'from-green-500 to-teal-500',
      subcategories: ['帆布鞋', '板鞋', '樂福鞋', '懶人鞋']
    },
    {
      name: '皮鞋',
      icon: '👔',
      image: '/api/placeholder/400/300',
      count: 987,
      bgColor: 'from-gray-600 to-gray-800',
      subcategories: ['正裝皮鞋', '商務皮鞋', '休閒皮鞋', '馬丁靴']
    },
    {
      name: '高跟鞋',
      icon: '👠',
      image: '/api/placeholder/400/300',
      count: 1456,
      bgColor: 'from-pink-500 to-rose-500',
      subcategories: ['細跟鞋', '粗跟鞋', '坡跟鞋', '防水台']
    },
    {
      name: '涼鞋',
      icon: '🩴',
      image: '/api/placeholder/400/300',
      count: 756,
      bgColor: 'from-yellow-500 to-orange-500',
      subcategories: ['拖鞋', '涼拖', '羅馬鞋', '人字拖']
    },
    {
      name: '童鞋',
      icon: '👶',
      image: '/api/placeholder/400/300',
      count: 1123,
      bgColor: 'from-purple-500 to-indigo-500',
      subcategories: ['嬰兒鞋', '學步鞋', '兒童運動鞋', '兒童皮鞋']
    },
    {
      name: '靴子',
      icon: '🥾',
      image: '/api/placeholder/400/300',
      count: 645,
      bgColor: 'from-amber-600 to-brown-700',
      subcategories: ['短靴', '長靴', '雪地靴', '雨靴']
    },
    {
      name: '特殊功能鞋',
      icon: '⚡',
      image: '/api/placeholder/400/300',
      count: 423,
      bgColor: 'from-red-500 to-orange-600',
      subcategories: ['登山鞋', '溯溪鞋', '安全鞋', '護士鞋']
    }
  ]

  const brandCategories = [
    { name: 'Nike', logo: '/api/placeholder/80/40', count: 856 },
    { name: 'Adidas', logo: '/api/placeholder/80/40', count: 723 },
    { name: 'New Balance', logo: '/api/placeholder/80/40', count: 542 },
    { name: 'Converse', logo: '/api/placeholder/80/40', count: 435 },
    { name: 'Vans', logo: '/api/placeholder/80/40', count: 328 },
    { name: 'Puma', logo: '/api/placeholder/80/40', count: 267 }
  ]

  const trendingCategories = [
    { name: '老爹鞋', trend: '+45%', icon: '🔥' },
    { name: '小白鞋', trend: '+32%', icon: '⭐' },
    { name: '厚底鞋', trend: '+28%', icon: '📈' },
    { name: '復古鞋', trend: '+25%', icon: '✨' }
  ]

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
        {/* 熱門趨勢 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-orange-500" />
            熱門趨勢
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {trendingCategories.map((cat) => (
              <Link
                key={cat.name}
                href={`/category/${cat.name}`}
                className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl mr-2">{cat.icon}</span>
                    <p className="font-medium text-gray-800">{cat.name}</p>
                  </div>
                  <span className="text-green-600 font-bold text-sm">{cat.trend}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 主要分類 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {mainCategories.map((category) => (
            <Link
              key={category.name}
              href={`/category/${category.name}`}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all group"
            >
              <div className={`h-32 bg-gradient-to-r ${category.bgColor} p-4 relative overflow-hidden`}>
                <div className="relative z-10">
                  <span className="text-4xl">{category.icon}</span>
                  <h3 className="text-xl font-bold text-white mt-2">{category.name}</h3>
                  <p className="text-white/80 text-sm">{category.count} 款商品</p>
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full" />
              </div>

              <div className="p-4">
                <p className="text-xs text-gray-600 mb-3">熱門子分類</p>
                <div className="space-y-2">
                  {category.subcategories.slice(0, 3).map((sub) => (
                    <div
                      key={sub}
                      className="flex items-center justify-between text-sm text-gray-700 hover:text-orange-600"
                    >
                      <span>{sub}</span>
                      <ChevronRight size={14} />
                    </div>
                  ))}
                </div>
                <button className="w-full mt-3 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded text-sm transition-colors">
                  查看全部
                </button>
              </div>
            </Link>
          ))}
        </div>

        {/* 品牌分類 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="text-yellow-500" />
            品牌專區
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {brandCategories.map((brand) => (
              <Link
                key={brand.name}
                href={`/brands/${brand.name.toLowerCase()}`}
                className="border rounded-lg p-4 hover:border-orange-500 hover:shadow-md transition-all text-center"
              >
                <div className="h-12 mb-2 flex items-center justify-center">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    width={80}
                    height={40}
                    className="opacity-70 hover:opacity-100 transition-opacity"
                  />
                </div>
                <p className="font-medium text-gray-800">{brand.name}</p>
                <p className="text-xs text-gray-500">{brand.count} 款商品</p>
              </Link>
            ))}
          </div>
        </div>

        {/* 特殊分類 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/category/男鞋"
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
            href="/category/女鞋"
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
            href="/category/童鞋"
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