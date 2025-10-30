'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import UserMenu from './UserMenu'

export default function MainNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 black-color shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo區 */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold-deep)] rounded-lg flex items-center justify-center">
                <span className="text-2xl">👟</span>
              </div>
              <h1 className="brand-title text-xl sm:text-2xl">
                <span className="text-accent-500">潮流鞋店</span>
              </h1>
            </Link>
          </div>

          {/* 桌面導航 */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="#products"
              className="text-amber-100 hover:text-amber-300 transition-colors duration-200 relative group"
            >
              精選鞋款
              <span className="nav-underline"></span>
            </Link>
            <Link
              href="#brands"
              className="text-amber-100 hover:text-amber-300 transition-colors duration-200 relative group"
            >
              熱門品牌
              <span className="nav-underline"></span>
            </Link>
            <Link
              href="#about"
              className="text-amber-100 hover:text-amber-300 transition-colors duration-200 relative group"
            >
              關於我們
              <span className="nav-underline"></span>
            </Link>
            {/* 只有 ADMIN 角色才能看到後台管理入口 */}
            {isAuthenticated && user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="text-amber-100 hover:text-amber-300 transition-colors duration-200 relative group"
              >
                後台管理
                <span className="nav-underline"></span>
              </Link>
            )}
          </nav>

          {/* 右側按鈕 */}
          <div className="flex items-center space-x-4">
            {/* 購物車 */}
            <Link
              href="/cart"
              className="hidden md:flex items-center text-amber-100 hover:text-amber-300 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="ml-2">購物車</span>
            </Link>

            {/* 登入/用戶選單 */}
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-amber-100 hover:text-amber-300 transition-colors"
                >
                  登入
                </Link>
              </div>
            )}

            {/* 手機選單按鈕 */}
            <button
              className="md:hidden text-amber-100 hover:text-amber-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg
                className="w-6 h-6"
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

        {/* 手機選單 */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-amber-700/50">
            {/* 用戶資訊（已登入） */}
            {isAuthenticated && user && (
              <div className="px-4 py-3 bg-amber-900/30 rounded-lg mb-2">
                <p className="text-amber-100 font-semibold">{user.name}</p>
                <p className="text-amber-300 text-sm">{user.email || user.phone}</p>
              </div>
            )}

            {/* 導航連結 */}
            <Link
              href="#products"
              className="block py-2 text-amber-100 hover:text-amber-300 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              精選鞋款
            </Link>
            <Link
              href="#brands"
              className="block py-2 text-amber-100 hover:text-amber-300 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              熱門品牌
            </Link>
            <Link
              href="#about"
              className="block py-2 text-amber-100 hover:text-amber-300 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              關於我們
            </Link>
            <Link
              href="/cart"
              className="block py-2 text-amber-100 hover:text-amber-300 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              購物車
            </Link>

            {/* 已登入用戶選項 */}
            {isAuthenticated ? (
              <>
                <div className="border-t border-amber-700/50 my-2 pt-2">
                  <Link
                    href="/account"
                    className="block py-2 text-amber-100 hover:text-amber-300 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    個人資料
                  </Link>
                  <Link
                    href="/orders"
                    className="block py-2 text-amber-100 hover:text-amber-300 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    我的訂單
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="block py-2 text-primary-300 hover:text-primary-200 transition-colors font-medium"
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
                  className="block w-full text-left py-2 text-red-300 hover:text-red-200 transition-colors"
                >
                  登出
                </button>
              </>
            ) : (
              <div className="border-t border-amber-700/50 my-2 pt-2 space-y-2">
                <Link
                  href="/auth/login"
                  className="block py-2 text-amber-100 hover:text-amber-300 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  登入
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
