'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, ShoppingCart, Menu, MessageCircle, Gift,
  MapPin, ChevronDown, Percent, Heart, Store,
  User, Star, TrendingUp, Clock, Flame
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'

/**
 * 市場導航欄組件
 *
 * 優化說明：
 * ✅ 移除重複的 GET_CART 和 GET_MY_WISHLIST 查詢
 * ✅ 改用統一的 useCart hook（由 CartProvider 管理）
 * ✅ 避免與 FloatingPromo 組件重複查詢，減少網路請求
 */

const MarketplaceHeader = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCategories, setShowCategories] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  // 使用統一的 Cart Context（避免重複查詢）
  const { cartCount, wishlistCount } = useCart()

  const cartItemCount = cartCount
  const wishlistItemCount = wishlistCount

  // 處理搜尋
  const handleSearch = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const hotSearches = ['運動鞋', 'Nike', 'Adidas', '限時特價', '新品上市']

  const categories = [
    { name: '運動鞋', icon: '🏃', hot: true },
    { name: '休閒鞋', icon: '👟', hot: false },
    { name: '皮鞋', icon: '👞', hot: false },
    { name: '高跟鞋', icon: '👠', hot: true },
    { name: '涼鞋', icon: '👡', hot: false },
    { name: '靴子', icon: '🥾', hot: false },
    { name: '童鞋', icon: '👶', hot: true },
    { name: '特價專區', icon: '💰', hot: true },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* 頂部工具欄 - 手機版適中高度 */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/help" className="flex items-center gap-1 hover:text-yellow-300">
              <MessageCircle size={16} className="sm:w-5 sm:h-5" />
              <span className="text-xs">客服</span>
            </Link>
            <span className="hidden sm:inline">｜</span>
            <Link href="/about" className="hidden sm:flex items-center gap-1 hover:text-yellow-300">
              <Store size={16} className="sm:w-5 sm:h-5" />
              <span className="text-xs">關於我們</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/help" className="hidden sm:flex items-center gap-1 hover:text-yellow-300">
              <MessageCircle size={16} className="sm:w-5 sm:h-5" />
              <span className="text-xs">幫助中心</span>
            </Link>
            {user ? (
              <Link href={user.role === 'ADMIN' ? '/admin' : '/account'} className="flex items-center gap-1 hover:text-yellow-300">
                <User size={16} className="sm:w-5 sm:h-5" />
                <span className="text-xs max-w-[100px] sm:max-w-none truncate">{user.name || user.email}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2 sm:gap-2">
                <Link href="/auth/signup" className="text-xs hover:text-yellow-300">註冊</Link>
                <span className="text-xs">｜</span>
                <Link href="/auth/login" className="text-xs hover:text-yellow-300">登入</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主導航欄 */}
      <div className="bg-white border-b">
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Logo - 增強返回首頁提示 */}
            <Link href="/" className="flex items-center gap-1 sm:gap-2 flex-shrink-0 group" title="返回首頁">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-sm sm:text-xl px-2 sm:px-3 py-1 rounded-lg shadow-md whitespace-nowrap group-hover:shadow-lg transition-shadow">
                財神賣鞋
              </div>
            </Link>

            {/* 搜索框 */}
            <div className="flex-1 ">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="搜索商品..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 sm:pl-4 pr-10 sm:pr-24 py-2 sm:py-2.5 text-sm border-2 border-orange-500 rounded-full focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 bottom-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 sm:px-6 rounded-r-full hover:from-orange-600 hover:to-red-600 transition-colors"
                >
                  <Search size={18} className="sm:w-5 sm:h-5" />
                </button>
              </form>
        
            </div>

            {/* 購物車和收藏 */}
            <div className="flex items-center gap-1 sm:gap-3">
              <Link href="/wishlist" className="relative p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Heart size={20} className="sm:w-6 sm:h-6 text-gray-600" />
                {wishlistItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                    {wishlistItemCount > 99 ? '99+' : wishlistItemCount}
                  </span>
                )}
              </Link>
              <Link href="/cart" className="relative p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ShoppingCart size={20} className="sm:w-6 sm:h-6 text-gray-600" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 分類導航欄 - 手機版隱藏 */}
      <div className="hidden md:block bg-gray-50 border-b">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center">
            {/* 全部分類按鈕 */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowCategories(true)}
                onMouseLeave={() => setShowCategories(false)}
                className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 hover:bg-orange-600 transition-colors"
              >
                <Menu size={18} />
                <span className="font-medium">全部分類</span>
                <ChevronDown size={16} />
              </button>

              {/* 分類下拉選單 */}
              {showCategories && (
                <div
                  className="absolute top-full left-0 bg-white shadow-lg rounded-b-lg w-56 z-50"
                  onMouseEnter={() => setShowCategories(true)}
                  onMouseLeave={() => setShowCategories(false)}
                >
                  {/* 全部產品入口 */}
                  <Link
                    href="/products"
                    className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 text-orange-600 transition-colors border-b"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🛒</span>
                      <span className="font-bold">全部產品</span>
                    </div>
                    <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">ALL</span>
                  </Link>
                  {categories.map((cat, index) => (
                    <Link
                      key={index}
                      href={`/products?category=${encodeURIComponent(cat.name)}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-orange-50 hover:text-orange-600 transition-colors border-b last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      {cat.hot && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">HOT</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 快速導航 */}
            <div className="flex items-center gap-1 ml-4 text-sm">
              <Link href="/flash-sale" className="flex items-center gap-1 px-3 py-2.5 hover:text-orange-600 transition-colors">
                <Clock size={16} className="text-red-500" />
                <span className="font-medium">限時搶購</span>
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded ml-1">搶</span>
              </Link>
              <Link href="/super-deals" className="flex items-center gap-1 px-3 py-2.5 hover:text-orange-600 transition-colors">
                <Percent size={16} className="text-orange-500" />
                <span className="font-medium">超值優惠</span>
              </Link>
              <Link href="/new-arrivals" className="flex items-center gap-1 px-3 py-2.5 hover:text-orange-600 transition-colors">
                <Star size={16} className="text-yellow-500" />
                <span className="font-medium">新品上市</span>
              </Link>
              <Link href="/best-sellers" className="flex items-center gap-1 px-3 py-2.5 hover:text-orange-600 transition-colors">
                <TrendingUp size={16} className="text-purple-500" />
                <span className="font-medium">熱銷排行</span>
                <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded ml-1">TOP</span>
              </Link>
            </div>

        
          </div>
        </div>
      </div>
    </header>
  )
}

export default MarketplaceHeader