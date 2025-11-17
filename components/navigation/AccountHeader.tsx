'use client'

/**
 * Account 專屬導航 Header
 * 用於個人帳戶相關頁面的統一導航
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  icon: string
  href: string
  description?: string
}

const navItems: NavItem[] = [
  {
    label: '個人資料',
    icon: '👤',
    href: '/account',
    description: '基本資料與會員等級',
  },
  {
    label: '我的訂單',
    icon: '📦',
    href: '/account/orders',
    description: '查看所有訂單',
  },
  {
    label: '訂單追蹤',
    icon: '🚚',
    href: '/account/orders/track',
    description: '追蹤包裹位置',
  },
  {
    label: '購物金 & 優惠券',
    icon: '🎁',
    href: '/account/wallet',
    description: '查看可用優惠',
  },
  {
    label: '邀請好友',
    icon: '✨',
    href: '/account/referral',
    description: '分享賺購物金',
  },
  {
    label: '客服中心',
    icon: '💬',
    href: '/account/support',
    description: '線上客服與問題諮詢',
  },
  {
    label: '退貨申請',
    icon: '↩️',
    href: '/account/returns',
    description: '申請退換貨',
  },
]

export default function AccountHeader() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/account') {
      return pathname === '/account'
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className="bg-white border-b border-orange-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 導航 Tabs - 桌面版 */}
        <nav className="hidden md:flex gap-1 py-2 overflow-x-auto items-center">
          {/* 返回首頁按鈕 */}
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all font-medium whitespace-nowrap text-gray-700 hover:bg-orange-50 hover:text-orange-600 mr-2 border-r border-gray-200 pr-4"
            title="返回首頁"
          >
            <span className="text-lg">🏠</span>
            <span className="text-sm">返回首頁</span>
          </Link>

          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg transition-all font-medium whitespace-nowrap
                  ${
                    active
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                      : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* 導航 Tabs - 手機版（下拉選單式） */}
        <div className="md:hidden py-3">
          <div className="relative">
            <select
              value={pathname || '/account'}
              onChange={(e) => {
                window.location.href = e.target.value
              }}
              className="w-full px-4 py-3 pr-10 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {/* 返回首頁選項 */}
              <option value="/">🏠 返回首頁</option>
              {navItems.map((item) => (
                <option key={item.href} value={item.href}>
                  {item.icon} {item.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
