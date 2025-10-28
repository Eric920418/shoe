/**
 * 後台管理布局
 *
 * 注意：此組件有雙重權限保護
 * 1. middleware.ts - 伺服器端路由攔截（主要防線）
 * 2. AdminAuthGuard - 客戶端權限檢查（輔助防線）
 */

import { ReactNode } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import AdminAuthGuard from '@/components/admin/AdminAuthGuard'

export const metadata = {
  title: '後台管理 - 鞋店電商',
  description: '鞋店電商後台管理系統',
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthGuard>
    <div className="min-h-screen bg-gray-100">
      {/* 頂部導航欄 */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">鞋店電商後台</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
                返回前台
              </button>
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                A
              </div>
            </div>
          </div>
        </div>
      </header>

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
