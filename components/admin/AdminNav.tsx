'use client'

/**
 * 後台管理側邊導航
 */

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
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
      { name: "用戶列表", href: "/admin/users", icon: "👥" },
      { name: "會員等級", href: "/admin/membership-tiers", icon: "⭐" },
    ],
  },
  {
    title: "行銷管理",
    items: [
      { name: "優惠券", href: "/admin/coupons", icon: "🎫" },
      { name: "購物金", href: "/admin/credits", icon: "💰" },
    ],
  },
  {
    title: "客戶服務",
    items: [{ name: "聊天管理", href: "/admin/chats", icon: "💬" }],
  },
  {
    title: "設定",
    items: [
      { name: "公告管理", href: "/admin/announcements", icon: "📢" },
      { name: "社群連結", href: "/admin/social-links", icon: "🔗" },
      { name: "FAQ管理", href: "/admin/faqs", icon: "❓" },
    ],
  },
];

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] sticky top-16">
      <nav className="p-4 space-y-6">
        {navItems.map((section) => (
          <div key={section.title}>
            <h3 className="px-3 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
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
                      flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors
                      ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
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
      </nav>
    </aside>
  )
}
