'use client'

/**
 * 手機版後台導航
 * - 底部導航欄：快速訪問常用功能
 * - 側滑選單：完整功能列表
 * - 適配手機觸控操作
 */

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

// 底部導航項目（最常用的5個功能）
const bottomNavItems = [
  { name: '儀表板', href: '/admin/dashboard', icon: '📊' },
  { name: '訂單', href: '/admin/orders', icon: '📦' },
  { name: '產品', href: '/admin/products', icon: '👟' },
  { name: '客戶', href: '/admin/users', icon: '👥' },
  { name: '更多', href: '#menu', icon: '☰', isMenu: true },
]

// 完整導航項目（側滑選單使用）
const fullNavItems = [
  {
    title: "總覽",
    items: [{ name: "儀表板", href: "/admin/dashboard", icon: "📊" }],
  },
  {
    title: "商品管理",
    items: [
      { name: "產品列表", href: "/admin/products", icon: "👟" },
      { name: "分類管理", href: "/admin/categories", icon: "📁" },
      { name: "品牌管理", href: "/admin/brands", icon: "🏷️" },
    ],
  },
  {
    title: "訂單管理",
    items: [
      { name: "訂單列表", href: "/admin/orders", icon: "📦" },
      { name: "退換貨", href: "/admin/returns", icon: "↩️" },
    ],
  },
  {
    title: "客戶管理",
    items: [
      { name: "客戶", href: "/admin/users", icon: "👥" },
      { name: "會員等級", href: "/admin/membership-tiers", icon: "⭐" },
    ],
  },
  {
    title: "行銷管理",
    items: [
      { name: "優惠券", href: "/admin/coupons", icon: "🎫" },
      { name: "購物金", href: "/admin/credits", icon: "💰" },
      { name: "邀請碼設定", href: "/admin/referral-settings", icon: "🎁" },
      { name: "郵件行銷", href: "/admin/email-campaigns", icon: "📧" },
    ],
  },
  {
    title: "客戶服務",
    items: [{ name: "聊天管理", href: "/admin/chats", icon: "💬" }],
  },
  {
    title: "設定",
    items: [
      { name: "首頁管理", href: "/admin/homepage", icon: "🏠" },
      { name: "公告管理", href: "/admin/announcements", icon: "📢" },
      { name: "FAQ管理", href: "/admin/faqs", icon: "❓" },
    ],
  },
]

export default function MobileAdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // 關閉選單當路徑改變
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // 防止背景滾動
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  return (
    <>
      {/* 底部導航欄 - 固定在底部 */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom">
        <div className="flex justify-around items-center py-2">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href

            if (item.isMenu) {
              return (
                <button
                  key={item.name}
                  onClick={() => setIsMenuOpen(true)}
                  className="flex flex-col items-center justify-center p-2 min-w-[64px]"
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span className="text-xs text-gray-600">{item.name}</span>
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center p-2 min-w-[64px] ${
                  isActive ? 'text-primary-600' : 'text-gray-600'
                }`}
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                <span className={`text-xs ${isActive ? 'font-semibold' : ''}`}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* 側滑選單 - 全螢幕覆蓋 */}
      {isMenuOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* 側滑選單面板 */}
          <div className="lg:hidden fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white z-50 shadow-xl overflow-y-auto">
            {/* 選單頭部 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">後台選單</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 選單內容 */}
            <div className="p-4 space-y-6 pb-20">
              {fullNavItems.map((section) => (
                <div key={section.title}>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-lg text-base
                            ${
                              isActive
                                ? 'bg-primary-50 text-primary-700 font-semibold'
                                : 'text-gray-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          <span className="text-xl">{item.icon}</span>
                          <span>{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}