'use client'

import Link from 'next/link'
import { Home, ChevronRight } from 'lucide-react'

/**
 * 麵包屑導航組件
 *
 * 用途：提供清晰的導航路徑，讓用戶知道當前位置並能輕鬆返回上層或首頁
 *
 * 使用範例：
 * ```tsx
 * <Breadcrumb items={[
 *   { label: '我的帳戶', href: '/account' },
 *   { label: '訂單管理', href: '/orders' },
 * ]} />
 * ```
 */

interface BreadcrumbItem {
  label: string
  href?: string  // 如果沒有 href，表示是當前頁面
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav aria-label="麵包屑導航" className={`flex items-center gap-2 text-sm ${className}`}>
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
    </nav>
  )
}
