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
import AdminAuthGuard from '@/components/admin/AdminAuthGuard'

export const metadata = {
  title: '後台管理 - 鞋店電商',
  description: '鞋店電商後台管理系統',
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthGuard>
    <div className="min-h-screen bg-gray-100 text-lg">


      <div className="flex">
        {/* 側邊導航 */}
        <AdminNav />

        {/* 主內容區 */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
    </AdminAuthGuard>
  )
}
