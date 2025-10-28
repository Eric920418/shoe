/**
 * 管理員登入頁面專屬 Layout
 * 不使用 AdminAuthGuard，允許未登入訪問
 */

import { ReactNode } from 'react'

export const metadata = {
  title: '管理員登入 - 鞋店電商',
  description: '管理員登入頁面',
}

export default function AdminLoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
