/**
 * 後台管理布局
 *
 * 注意：此組件有雙重權限保護
 * 1. middleware.ts - 伺服器端路由攔截（主要防線）
 * 2. AdminAuthGuard - 客戶端權限檢查（輔助防線）
 */

import { ReactNode } from 'react'
import Link from 'next/link'
import AdminNav from '@/components/admin/AdminNav'
import MobileAdminNav from '@/components/admin/MobileAdminNav'
import AdminAuthGuard from '@/components/admin/AdminAuthGuard'

export const metadata = {
  title: '後台管理 - 鞋店電商',
  description: '鞋店電商後台管理系統',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthGuard>
    <div className="min-h-screen bg-gray-50 lg:bg-gray-100">
      <div className="lg:flex">
        {/* 桌面版側邊導航 - 只在大螢幕顯示 */}
        <div className="hidden lg:block">
          <AdminNav />
        </div>

        {/* 主內容區 - 響應式調整 */}
        <main className="flex-1 lg:p-6 pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* 手機版內容區域 - 減少內邊距 */}
            <div className="p-4 lg:p-0">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* 手機版底部導航 */}
      <MobileAdminNav />
    </div>
    </AdminAuthGuard>
  )
}
