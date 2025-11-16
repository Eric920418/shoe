'use client'

import Link from 'next/link'
import { Home, ChevronRight, ShoppingCart } from 'lucide-react'

/**
 * 麵包屑導航組件
 *
 * 用途：提供清晰的導航路徑，讓用戶知道當前位置並能輕鬆返回上層或首頁
 *
 * 使用範例：
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: '我的帳戶', href: '/account' },
 *     { label: '訂單管理', href: '/orders' },
 *   ]}
 *   showCartLink={true}  // 顯示購物車連結
 * />
 * ```
 */

interface BreadcrumbItem {
  label: string
  href?: string  // 如果沒有 href，表示是當前頁面
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  showCartLink?: boolean  // 是否顯示購物車連結
}

export default function Breadcrumb({ items, className = '', showCartLink = false }: BreadcrumbProps) {
  return (
    <nav aria-label="麵包屑導航" className={`flex items-center justify-between gap-2 text-sm ${className}`}>
      <div className="flex items-center gap-2">
        {/* 首頁鏈接 */}
        <Link
          href="/"
          className="flex items-center gap-1 text-gray-600 hover:text-orange-600 transition-colors"
          title="返回首頁"
        >
          <Home size={16} />
          <span>首頁</span>
        </Link>

        {/* 動態麵包屑項目 */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <div key={index} className="flex items-center gap-2">
              <ChevronRight size={16} className="text-gray-400" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-orange-600 font-semibold' : 'text-gray-600'}>
                  {item.label}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* 購物車連結（選用） */}
      {showCartLink && (
        <Link
          href="/cart"
          className="flex items-center gap-1.5 px-3 py-1.5 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
          title="前往購物車"
        >
          <ShoppingCart size={18} />
          <span className="font-medium">購物車</span>
        </Link>
      )}
    </nav>
  )
}
