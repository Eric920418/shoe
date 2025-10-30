'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import UserMenu from './UserMenu'

export default function ModernHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-black tracking-tighter text-black">
                財神<span className="text-gray-400">賣鞋</span>
              </div>
            </Link>
          </div>

          {/* 桌面導航 */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link
              href="/products"
              className="text-sm font-medium text-black hover:text-gray-600 transition-colors"
            >
              全部商品
            </Link>
            <Link
              href="/products?gender=MALE"
              className="text-sm font-medium text-black hover:text-gray-600 transition-colors"
            >
              男鞋
            </Link>
            <Link
              href="/products?gender=FEMALE"
              className="text-sm font-medium text-black hover:text-gray-600 transition-colors"
            >
              女鞋
            </Link>
            <Link
              href="/products?shoeType=SNEAKERS"
              className="text-sm font-medium text-black hover:text-gray-600 transition-colors"
            >
              運動鞋
            </Link>
            <Link
              href="/products"
              className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              特價優惠
            </Link>
            {isAuthenticated && user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                後台管理
              </Link>
            )}
          </nav>

          {/* 右側工具列 */}
          <div className="flex items-center space-x-4">
            {/* 搜尋按鈕 */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="hidden lg:flex p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="搜尋"
            >
              <svg
                className="w-5 h-5 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

   

            {/* 購物車 */}
            <Link
              href="/cart"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
              aria-label="購物車"
            >
              <svg
                className="w-5 h-5 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {/* 購物車數量徽章（可選） */}
              {/* <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span> */}
            </Link>

            {/* 用戶選單 */}
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Link
                href="/auth/login"
                className="hidden lg:flex p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="登入"
              >
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </Link>
            )}

            {/* 手機選單按鈕 */}
            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="選單"
            >
              <svg
                className="w-6 h-6 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* 搜尋列（展開時） */}
        {isSearchOpen && (
          <div className="hidden lg:block py-4 border-t">
            <div className="relative">
              <input
                type="text"
                placeholder="搜尋商品..."
                className="w-full px-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black"
                autoFocus
              />
              <button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black"
                onClick={() => setIsSearchOpen(false)}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 手機選單 */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {/* 用戶資訊 */}
            {isAuthenticated && user && (
              <div className="px-4 py-3 bg-gray-100 rounded-lg mb-4">
                <p className="text-black font-semibold">{user.name}</p>
                <p className="text-gray-600 text-sm">{user.email || user.phone}</p>
              </div>
            )}

            {/* 搜尋框 */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="搜尋商品..."
                className="w-full px-4 py-3 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* 導航連結 */}
            <Link
              href="/products"
              className="block px-4 py-3 text-sm font-medium text-black hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              全部商品
            </Link>
            <Link
              href="/products?gender=MALE"
              className="block px-4 py-3 text-sm font-medium text-black hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              男鞋
            </Link>
            <Link
              href="/products?gender=FEMALE"
              className="block px-4 py-3 text-sm font-medium text-black hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              女鞋
            </Link>
            <Link
              href="/products?shoeType=SNEAKERS"
              className="block px-4 py-3 text-sm font-medium text-black hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              運動鞋
            </Link>
            <Link
              href="/products"
              className="block px-4 py-3 text-sm font-medium text-red-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              特價優惠
            </Link>

            {/* 已登入用戶選項 */}
            {isAuthenticated ? (
              <>
                <div className="border-t pt-4 mt-4 space-y-1">
                  <Link
                    href="/account"
                    className="block px-4 py-3 text-sm font-medium text-black hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    個人資料
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-4 py-3 text-sm font-medium text-black hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    我的訂單
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="block px-4 py-3 text-sm font-medium text-blue-600 hover:bg-gray-100 rounded-lg"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      後台管理
                    </Link>
                  )}
                </div>
                <button
                  onClick={() => {
                    logout()
                    setIsMobileMenuOpen(false)
                  }}
                  className="block w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-gray-100 rounded-lg mt-2"
                >
                  登出
                </button>
              </>
            ) : (
              <div className="border-t pt-4 mt-4 space-y-2">
                <Link
                  href="/auth/login"
                  className="block px-4 py-3 text-center text-sm font-medium text-black bg-gray-100 hover:bg-gray-200 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  登入
                </Link>
      
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
