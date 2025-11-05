'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'

/**
 * 返回首頁按鈕組件
 *
 * 用途：在任何頁面提供一個明顯的返回首頁按鈕
 *
 * 使用範例：
 * ```tsx
 * <BackToHomeButton />  // 使用預設樣式
 * <BackToHomeButton variant="floating" />  // 浮動按鈕
 * ```
 */

interface BackToHomeButtonProps {
  variant?: 'inline' | 'floating'  // inline: 嵌入式，floating: 浮動式
  className?: string
}

export default function BackToHomeButton({
  variant = 'inline',
  className = ''
}: BackToHomeButtonProps) {

  if (variant === 'floating') {
    return (
      <Link
        href="/"
        className={`fixed bottom-8 right-8 z-40 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 ${className}`}
        title="返回首頁"
      >
        <Home size={20} />
        <span className="font-medium">返回首頁</span>
      </Link>
    )
  }

  // inline 版本
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-medium ${className}`}
      title="返回首頁"
    >
      <Home size={18} />
      <span>返回首頁</span>
    </Link>
  )
}
