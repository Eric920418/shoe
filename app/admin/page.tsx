/**
 * 後台管理首页 - 重定向到仪表板
 */

import { redirect } from 'next/navigation'

export default function AdminHomePage() {
  redirect('/admin/dashboard')
}
