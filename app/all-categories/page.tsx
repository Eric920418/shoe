import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Sparkles, ChevronRight, Crown,
  User, Heart, Baby, Search, Layers
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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* 頂部裝飾線 */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#CBA135] to-transparent" />

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
              <Layers className="text-[#CBA135]" size={24} />
              <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[#CBA135]" />
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-[#ffe9a3] via-[#CBA135] to-[#d4a437] bg-clip-text text-transparent">
                全部分類
              </span>
            </h1>

            <p className="text-[#888] text-lg">
              探索我們的完整鞋款系列
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 主要分類 */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
            {categories.map((category, index) => {
              const customDisplay = category.categoryDisplay

              return (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="group relative rounded-xl overflow-hidden bg-[#111] border border-[#222] hover:border-[#CBA135]/40 transition-all duration-500 hover:shadow-xl hover:shadow-[#CBA135]/10"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* 卡片背景 */}
                  <div className="h-36 md:h-44 relative overflow-hidden">
                    {/* 漸變背景 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1510] via-[#0f0d0a] to-[#0a0a0a]" />

                    {/* 裝飾圓形 */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-[#CBA135]/5 group-hover:bg-[#CBA135]/10 transition-colors duration-500" />
                    <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-[#CBA135]/10 group-hover:bg-[#CBA135]/20 transition-colors duration-500" />

                    {/* 內容 */}
                    <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold text-[#eee] group-hover:text-[#CBA135] transition-colors">
                          {customDisplay?.displayName || category.name}
                        </h3>
                        <p className="text-[#666] text-sm mt-1">{category._count.products} 款商品</p>
                      </div>

                      <div className="flex items-center gap-2 text-[#CBA135] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-sm">瀏覽全部</span>
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>

                  {/* 底部金色光線 */}
                  <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#CBA135]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-[#222] bg-[#111]/50 p-12 mb-10 text-center">
            <p className="text-[#666]">目前沒有分類</p>
          </div>
        )}

        {/* 品牌專區 */}
        {brands.length > 0 && (
          <div className="rounded-xl border border-[#222] bg-[#111]/50 backdrop-blur p-6 md:p-8 mb-10">
            <div className="flex items-center gap-3 mb-6">
              <Crown className="text-[#CBA135]" size={24} />
              <h2 className="text-xl font-bold text-[#eee]">品牌專區</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/products?brand=${brand.slug}`}
                  className="group rounded-lg border border-[#222] bg-[#0a0a0a] p-4 hover:border-[#CBA135]/40 hover:bg-[#111] transition-all duration-300 text-center"
                >
                  <div className="h-12 mb-3 flex items-center justify-center">
                    {brand.logo ? (
                      <Image
                        src={brand.logo}
                        alt={brand.name}
                        width={80}
                        height={40}
                        className="opacity-60 group-hover:opacity-100 transition-opacity object-contain filter grayscale group-hover:grayscale-0"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-[#444] group-hover:text-[#CBA135] transition-colors">
                        {brand.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-[#ccc] group-hover:text-[#CBA135] transition-colors">{brand.name}</p>
                  <p className="text-xs text-[#555] mt-1">{brand._count.products} 款商品</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 性別分類 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
          <Link
            href="/products?gender=MEN"
            className="group relative rounded-xl overflow-hidden bg-[#111] border border-[#222] hover:border-[#CBA135]/40 transition-all duration-300 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="w-12 h-12 rounded-full bg-[#1a1510] flex items-center justify-center mb-3 group-hover:bg-[#CBA135]/20 transition-colors">
                  <User className="text-[#CBA135]" size={24} />
                </div>
                <h3 className="text-xl font-bold text-[#eee] group-hover:text-[#CBA135] transition-colors mb-1">男鞋專區</h3>
                <p className="text-sm text-[#666]">專為男士設計</p>
              </div>
              <ChevronRight className="text-[#444] group-hover:text-[#CBA135] group-hover:translate-x-1 transition-all" size={24} />
            </div>
            <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#CBA135]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link
            href="/products?gender=WOMEN"
            className="group relative rounded-xl overflow-hidden bg-[#111] border border-[#222] hover:border-[#CBA135]/40 transition-all duration-300 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="w-12 h-12 rounded-full bg-[#1a1510] flex items-center justify-center mb-3 group-hover:bg-[#CBA135]/20 transition-colors">
                  <Heart className="text-[#CBA135]" size={24} />
                </div>
                <h3 className="text-xl font-bold text-[#eee] group-hover:text-[#CBA135] transition-colors mb-1">女鞋專區</h3>
                <p className="text-sm text-[#666]">時尚女性之選</p>
              </div>
              <ChevronRight className="text-[#444] group-hover:text-[#CBA135] group-hover:translate-x-1 transition-all" size={24} />
            </div>
            <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#CBA135]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link
            href="/products?gender=KIDS"
            className="group relative rounded-xl overflow-hidden bg-[#111] border border-[#222] hover:border-[#CBA135]/40 transition-all duration-300 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="w-12 h-12 rounded-full bg-[#1a1510] flex items-center justify-center mb-3 group-hover:bg-[#CBA135]/20 transition-colors">
                  <Baby className="text-[#CBA135]" size={24} />
                </div>
                <h3 className="text-xl font-bold text-[#eee] group-hover:text-[#CBA135] transition-colors mb-1">童鞋專區</h3>
                <p className="text-sm text-[#666]">呵護寶貝雙腳</p>
              </div>
              <ChevronRight className="text-[#444] group-hover:text-[#CBA135] group-hover:translate-x-1 transition-all" size={24} />
            </div>
            <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#CBA135]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>

        {/* 底部搜索推薦 */}
        <div className="rounded-xl border border-[#222] bg-gradient-to-br from-[#1a1510] to-[#0f0d0a] p-8 md:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#CBA135]/10 flex items-center justify-center mx-auto mb-4">
            <Search className="text-[#CBA135]" size={32} />
          </div>
          <h3 className="text-xl font-bold text-[#eee] mb-2">找不到想要的分類？</h3>
          <p className="text-[#666] mb-6">使用我們的智能搜索，快速找到心儀的鞋款</p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-[#CBA135] to-[#d4a437] text-[#0a0a0a] font-semibold hover:shadow-lg hover:shadow-[#CBA135]/20 transition-all"
          >
            <Search size={18} />
            立即搜索
          </Link>
        </div>
      </div>

      {/* 底部裝飾線 */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#CBA135]/30 to-transparent mt-8" />
    </div>
  )
}
