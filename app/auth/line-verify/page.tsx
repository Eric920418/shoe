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
  mutation LineLoginCallback($code: String!) {
    lineLoginCallback(code: $code) {
      lineUserId
      displayName
      pictureUrl
      isNewUser
      otpSent
      expiresAt
    }
  }
`

const VERIFY_LINE_OTP = gql`
  mutation VerifyLineOtp($lineUserId: String!, $code: String!, $name: String, $phone: String) {
    verifyLineOtp(lineUserId: $lineUserId, code: $code, name: $name, phone: $phone) {
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

const RESEND_LINE_OTP = gql`
  mutation ResendLineOtp($lineUserId: String!) {
    resendLineOtp(lineUserId: $lineUserId) {
      success
      message
      expiresAt
    }
  }
`

function LineVerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login: authLogin } = useAuth()

  const [step, setStep] = useState<'loading' | 'otp' | 'userInfo'>('loading')
  const [lineData, setLineData] = useState<any>(null)
  const [otpCode, setOtpCode] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  const [lineLoginCallback, { loading: callbackLoading }] = useMutation(LINE_LOGIN_CALLBACK, {
    onCompleted: (data) => {
      setLineData(data.lineLoginCallback)

      // 如果是新用戶，需要填寫資料
      if (data.lineLoginCallback.isNewUser) {
        setStep('userInfo')
        setName(data.lineLoginCallback.displayName || '')
      } else {
        // 老用戶直接進入 OTP 驗證
        setStep('otp')
      }

      // 開始倒數計時
      setCountdown(60)
    },
    onError: (error) => {
      console.error('LINE 回調錯誤:', error)
      setError(error.message)
    },
  })

  const [verifyOtp, { loading: verifyLoading }] = useMutation(VERIFY_LINE_OTP, {
    onCompleted: (data) => {
      // 登入成功
      authLogin(data.verifyLineOtp.token, data.verifyLineOtp.user)
      router.push('/')
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const [resendOtp, { loading: resendLoading }] = useMutation(RESEND_LINE_OTP, {
    onCompleted: (data) => {
      setError('')
      alert(data.resendLineOtp.message)
      setCountdown(60)
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  // 倒數計時
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 初始化：調用 LINE 回調
  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setError('未收到授權碼')
      return
    }

    lineLoginCallback({ variables: { code } })
  }, [searchParams, lineLoginCallback])

  // 處理用戶資料提交
  const handleUserInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('請輸入姓名')
      return
    }

    setStep('otp')
  }

  // 處理 OTP 驗證
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!otpCode || otpCode.length !== 6) {
      setError('請輸入 6 位數驗證碼')
      return
    }

    verifyOtp({
      variables: {
        lineUserId: lineData.lineUserId,
        code: otpCode,
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
      },
    })
  }

  // 重發 OTP
  const handleResend = () => {
    if (countdown > 0) return
    resendOtp({ variables: { lineUserId: lineData.lineUserId } })
  }

  if (callbackLoading || step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600"></div>
          <p className="mt-4 text-gray-600">正在處理 LINE 登入...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 標題 */}
        <div className="text-center">
          {lineData?.pictureUrl && (
            <img
              src={lineData.pictureUrl}
              alt="LINE 大頭照"
              className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-primary-200"
            />
          )}
          <h2 className="text-3xl font-extrabold text-gray-900">
            {step === 'userInfo' ? '完善個人資料' : 'LINE 驗證'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'userInfo'
              ? '請填寫以下資料完成註冊'
              : `驗證碼已發送到您的 LINE（${lineData?.displayName}）`}
          </p>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* 步驟 1：填寫用戶資料（新用戶） */}
        {step === 'userInfo' && (
          <form className="mt-8 space-y-6" onSubmit={handleUserInfoSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  姓名 *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="王小明"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  手機號碼（選填）
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0912345678"
                />
                <p className="mt-1 text-xs text-gray-500">稍後可在個人資料中補充</p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              下一步
            </button>
          </form>
        )}

        {/* 步驟 2：輸入 OTP */}
        {step === 'otp' && (
          <form className="mt-8 space-y-6" onSubmit={handleOtpSubmit}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 text-center">
                請輸入 6 位數驗證碼
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setOtpCode(value)
                  setError('')
                }}
                className="mt-2 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="000000"
              />
            </div>

            <div className="flex flex-col gap-4">
              <button
                type="submit"
                disabled={verifyLoading || otpCode.length !== 6}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyLoading ? '驗證中...' : '驗證'}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || resendLoading}
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading
                  ? '發送中...'
                  : countdown > 0
                  ? `重新發送 (${countdown}s)`
                  : '重新發送驗證碼'}
              </button>
            </div>

            <p className="text-center text-xs text-gray-500">
              沒有收到驗證碼？請檢查您的 LINE 訊息
            </p>
          </form>
        )}
      </div>
    </div>
  )
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
