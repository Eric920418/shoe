'use client'

/**
 * 用戶註冊頁面 - 手機號碼 + 密碼註冊
 */

import { useState } from 'react'
import { useMutation, gql } from '@apollo/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Cookies from 'js-cookie'

// 註冊 Mutation
const REGISTER = gql`
  mutation Register($phone: String!, $name: String!, $password: String!) {
    register(phone: $phone, name: $name, password: $password) {
      token
      user {
        id
        name
        phone
        role
      }
    }
  }
`

// LINE Login
const GET_LINE_LOGIN_URL = gql`
  mutation GetLineLoginUrl {
    getLineLoginUrl {
      url
    }
  }
`

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')

  // 註冊 Mutation
  const [register, { loading: registerLoading }] = useMutation(REGISTER, {
    onCompleted: (data) => {
      // 儲存 Token
      Cookies.set('token', data.register.token, { expires: 7 })
      // 跳轉首頁
      router.push('/')
      // 刷新頁面以更新認證狀態
      window.location.href = '/'
    },
    onError: (error) => {
      setServerError(error.message)
    },
  })

  // LINE Login
  const [getLineLoginUrl, { loading: lineLoginLoading }] = useMutation(GET_LINE_LOGIN_URL, {
    onCompleted: (data) => {
      window.location.href = data.getLineLoginUrl.url
    },
    onError: (error) => {
      setServerError(error.message)
    },
  })

  // 驗證表單
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // 驗證手機號碼
    if (!formData.phone) {
      newErrors.phone = '請輸入手機號碼'
    } else if (!/^09\d{8}$/.test(formData.phone)) {
      newErrors.phone = '請輸入有效的台灣手機號碼（09 開頭，共 10 碼）'
    }

    // 驗證姓名
    if (!formData.name.trim()) {
      newErrors.name = '請輸入姓名'
    }

    // 驗證密碼
    if (!formData.password) {
      newErrors.password = '請輸入密碼'
    } else if (formData.password.length < 8) {
      newErrors.password = '密碼至少需要 8 個字元'
    } else {
      const hasUpperCase = /[A-Z]/.test(formData.password)
      const hasLowerCase = /[a-z]/.test(formData.password)
      const hasNumber = /[0-9]/.test(formData.password)

      if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        newErrors.password = '密碼必須包含大寫字母、小寫字母和數字'
      }
    }

    // 驗證確認密碼
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '請再次輸入密碼'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '兩次輸入的密碼不一致'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 處理表單提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    if (validateForm()) {
      register({
        variables: {
          phone: formData.phone,
          name: formData.name.trim(),
          password: formData.password,
        },
      })
    }
  }

  // 處理輸入變化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // 清除該欄位的錯誤
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleLineLogin = () => {
    getLineLoginUrl()
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 標題 */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/favicon.png"
              alt="logo"
              width={150}
              height={150}
            />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">建立新帳戶</h2>
          <p className="mt-2 text-sm text-gray-600">
            已有帳戶？{' '}
            <Link href="/auth/login" className="font-medium text-pink-600 hover:text-pink-500">
              立即登入
            </Link>
          </p>
        </div>

        {/* 錯誤訊息 */}
        {serverError && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{serverError}</p>
          </div>
        )}

        {/* 註冊表單 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* 手機號碼 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                手機號碼
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="0912345678"
                value={formData.phone}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            {/* 姓名 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                姓名
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="請輸入您的姓名"
                value={formData.name}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* 密碼 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密碼
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="至少 8 個字元，含大小寫和數字"
                value={formData.password}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* 確認密碼 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                確認密碼
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="請再次輸入密碼"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* 密碼規則提示 */}
          <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg">
            <p className="font-medium mb-1">密碼規則：</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>至少 8 個字元</li>
              <li>必須包含大寫字母（A-Z）</li>
              <li>必須包含小寫字母（a-z）</li>
              <li>必須包含數字（0-9）</li>
            </ul>
          </div>

          {/* 註冊按鈕 */}
          <button
            type="submit"
            disabled={registerLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {registerLoading ? '註冊中...' : '建立帳戶'}
          </button>
        </form>

        {/* 分隔線 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">或使用其他方式</span>
          </div>
        </div>

        {/* LINE Login 按鈕 */}
        <button
          type="button"
          onClick={handleLineLogin}
          disabled={lineLoginLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-[#06C755] rounded-lg text-white bg-[#06C755] hover:bg-[#05b34c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#06C755] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          {lineLoginLoading ? 'LINE 登入中...' : '使用 LINE 註冊'}
        </button>
      </div>
    </div>
  )
}
