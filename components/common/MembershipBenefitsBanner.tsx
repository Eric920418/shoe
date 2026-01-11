'use client'

/**
 * 會員好處提示橫幅組件 - 引導訪客註冊
 */

import Link from 'next/link'

interface MembershipBenefitsBannerProps {
  variant?: 'default' | 'compact' | 'prominent'
  showCTA?: boolean
}

export default function MembershipBenefitsBanner({
  variant = 'default',
  showCTA = true,
}: MembershipBenefitsBannerProps) {
  // Prominent 版本：大型強調橫幅（結帳頁使用）
  if (variant === 'prominent') {
    return (
      <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              🎁 成為會員享有更多優惠！
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-sm text-gray-700">購物金折抵現金</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-sm text-gray-700">會員專屬折扣</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-sm text-gray-700">消費自動回饋</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-sm text-gray-700">邀請好友賺獎勵</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-sm text-gray-700">生日專屬禮金</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-sm text-gray-700">訂單輕鬆管理</span>
              </div>
            </div>
            {showCTA && (
              <div className="flex gap-3">
                <Link
                  href="/auth/login"
                  className="inline-block px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                >
                  立即登入
                </Link>
                <Link
                  href="/auth/line-verify"
                  className="inline-block px-5 py-2.5 bg-amber-400 text-gray-900 rounded-lg hover:bg-amber-500 transition-colors font-medium text-sm"
                >
                  快速註冊（30秒）
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Compact 版本：精簡版（購物車頁使用）
  if (variant === 'compact') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">登入會員</span>享購物金折抵、消費回饋、生日禮金等多重優惠
            </p>
          </div>
          {showCTA && (
            <Link
              href="/auth/login"
              className="whitespace-nowrap px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              立即登入
            </Link>
          )}
        </div>
      </div>
    )
  }

  // Default 版本：標準提示
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 mb-2">會員專享優惠</h4>
          <ul className="text-sm text-gray-700 space-y-1 mb-3">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> 購物金折抵現金使用
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> 每筆訂單自動回饋購物金
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> 邀請好友賺購物金
            </li>
          </ul>
          {showCTA && (
            <Link
              href="/auth/login"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              登入享優惠
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
