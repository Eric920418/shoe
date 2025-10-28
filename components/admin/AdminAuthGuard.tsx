'use client'

/**
 * 後台權限守衛組件
 *
 * 雙重防護系統的第二道防線（客戶端檢查）
 * 主要防線在 middleware.ts（伺服器端攔截）
 *
 * 功能：
 * 1. 檢查用戶是否登入
 * 2. 檢查用戶角色是否為 ADMIN
 * 3. 非管理員自動跳轉到首頁並顯示錯誤提示
 *
 * 修復：移除雙重狀態依賴，避免卡在 loading 狀態
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface AdminAuthGuardProps {
  children: React.ReactNode
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 等待認證狀態載入完成
    if (isLoading) return

    // 檢查是否登入且為管理員
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      console.error('權限驗證失敗:', {
        isAuthenticated,
        userRole: user?.role,
        reason: !isAuthenticated ? '未登入' : '非管理員身份'
      })

      // 非管理員，跳轉到首頁並提示錯誤
      router.replace('/')
      return
    }
  }, [isAuthenticated, user, isLoading, router])

  // 載入中：顯示 loading 畫面
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[var(--gold-deep)]"></div>
          <p className="mt-4 text-gray-600">驗證權限中...</p>
        </div>
      </div>
    )
  }

  // 認證完成：檢查權限
  // 如果沒有權限，useEffect 會處理跳轉，這裡先顯示內容避免閃爍
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    // 即將跳轉，顯示空白避免閃爍後台內容
    return null
  }

  // 已授權，顯示內容
  return <>{children}</>
}
