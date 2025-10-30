'use client'

/**
 * LINE OTP 驗證頁面
 *
 * 流程：
 * 1. 從 URL 取得 code（LINE 授權碼）
 * 2. 調用 lineLoginCallback 取得 LINE 用戶資料並發送 OTP
 * 3. 顯示 OTP 輸入框
 * 4. 調用 verifyLineOtp 驗證
 * 5. 驗證成功後跳轉到首頁
 */

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, gql } from '@apollo/client'
import { useAuth } from '@/contexts/AuthContext'

// GraphQL Mutations
const LINE_LOGIN_CALLBACK = gql`
  mutation LineLoginCallback($code: String!, $name: String, $phone: String, $referralCode: String) {
    lineLoginCallback(code: $code, name: $name, phone: $phone, referralCode: $referralCode) {
      token
      user {
        id
        email
        name
        phone
        role
      }
    }
  }
`

function LineVerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login: authLogin } = useAuth()

  const [error, setError] = useState('')

  const [lineLoginCallback, { loading: callbackLoading }] = useMutation(LINE_LOGIN_CALLBACK, {
    onCompleted: (data) => {
      // 登入成功，直接跳轉
      authLogin(data.lineLoginCallback.token, data.lineLoginCallback.user)
      router.push('/')
    },
    onError: (error) => {
      console.error('LINE 回調錯誤:', error)
      setError(error.message)
    },
  })

  // 初始化：調用 LINE 回調並直接完成登入
  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setError('未收到授權碼')
      return
    }

    // 從 localStorage 讀取邀請碼（如果有）
    let referralCode: string | undefined = undefined
    try {
      const stored = localStorage.getItem('referralCode')
      if (stored) {
        const data = JSON.parse(stored)
        // 檢查是否過期（30 天）
        if (data.expiresAt && Date.now() < data.expiresAt) {
          referralCode = data.code
          console.log('使用邀請碼註冊:', referralCode)
        } else {
          // 清除過期的邀請碼
          localStorage.removeItem('referralCode')
        }
      }
    } catch (error) {
      console.error('讀取邀請碼失敗:', error)
    }

    // 直接完成登入，傳遞邀請碼（如果有）
    lineLoginCallback({
      variables: {
        code,
        referralCode
      }
    })
  }, [searchParams, lineLoginCallback])

  if (callbackLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600"></div>
          <p className="mt-4 text-gray-600">正在處理 LINE 登入...</p>
        </div>
      </div>
    )
  }

  // 如果有錯誤，顯示錯誤頁面
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">登入失敗</h2>
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => router.push('/auth/login')}
              className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              返回登入頁
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function LineVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600"></div>
        </div>
      }
    >
      <LineVerifyContent />
    </Suspense>
  )
}
