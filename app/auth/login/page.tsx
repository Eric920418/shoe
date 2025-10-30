'use client'

/**
 * 用戶登入頁面 - LINE Login Only
 */

import { useState } from 'react'
import { useMutation, gql } from '@apollo/client'
import Link from 'next/link'

// LINE Login
const GET_LINE_LOGIN_URL = gql`
  mutation GetLineLoginUrl {
    getLineLoginUrl {
      url
    }
  }
`

export default function LoginPage() {
  const [error, setError] = useState('')

  // LINE Login
  const [getLineLoginUrl, { loading: lineLoginLoading }] = useMutation(GET_LINE_LOGIN_URL, {
    onCompleted: (data) => {
      window.location.href = data.getLineLoginUrl.url
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const handleLineLogin = () => {
    getLineLoginUrl()
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 標題 */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold-deep)] rounded-2xl flex items-center justify-center">
              <span className="text-4xl">👟</span>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            歡迎回來
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            使用 LINE 帳號快速登入
          </p>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* LINE Login 按鈕 */}
        <div className="mt-8">
          <button
            type="button"
            onClick={handleLineLogin}
            disabled={lineLoginLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-[#06C755] rounded-lg text-white bg-[#06C755] hover:bg-[#05b34c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#06C755] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            {lineLoginLoading ? 'LINE 登入中...' : '使用 LINE 登入'}
          </button>
        </div>

        {/* 說明文字 */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            還沒有帳戶？註冊超簡單！
          </p>
          <p className="text-xs text-gray-500 mt-2">
            點擊上方按鈕，首次使用 LINE 登入即自動完成註冊
          </p>
        </div>


      </div>
    </div>
  )
}
