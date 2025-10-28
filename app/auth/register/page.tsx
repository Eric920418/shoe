'use client'

/**
 * 用戶註冊頁面 - LINE Login + 手機號碼註冊
 */

import { useState } from 'react'
import { useMutation, gql } from '@apollo/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { REGISTER } from '@/graphql/queries'
import { useAuth } from '@/contexts/AuthContext'

// LINE Login
const GET_LINE_LOGIN_URL = gql`
  mutation GetLineLoginUrl {
    getLineLoginUrl {
      url
    }
  }
`

export default function RegisterPage() {
  const router = useRouter()
  const { login: authLogin } = useAuth()
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // LINE Login
  const [getLineLoginUrl, { loading: lineLoginLoading }] = useMutation(GET_LINE_LOGIN_URL, {
    onCompleted: (data) => {
      window.location.href = data.getLineLoginUrl.url
    },
    onError: (error) => {
      setErrors({ submit: error.message })
    },
  })

  const handleLineLogin = () => {
    getLineLoginUrl()
  }

  const [register, { loading }] = useMutation(REGISTER, {
    onCompleted: (data) => {
      // 使用 AuthContext 的 login 方法
      authLogin(data.register.token, data.register.user)

      // 顯示成功訊息並跳轉
      alert('註冊成功！')
      router.push('/')
    },
    onError: (error) => {
      console.error('註冊錯誤:', error)

      // 顯示錯誤訊息
      if (error.graphQLErrors.length > 0) {
        const errorMessage = error.graphQLErrors[0].message
        setErrors({ submit: errorMessage })
      } else {
        setErrors({ submit: '註冊失敗，請稍後再試' })
      }
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // 清除對應欄位的錯誤
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // 驗證手機號碼
    if (!formData.phone) {
      newErrors.phone = '請輸入手機號碼'
    } else if (!/^09\d{8}$/.test(formData.phone)) {
      newErrors.phone = '請輸入有效的台灣手機號碼（例如：0912345678）'
    }

    // 驗證姓名
    if (!formData.name.trim()) {
      newErrors.name = '請輸入姓名'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await register({
        variables: {
          phone: formData.phone.trim(),
          name: formData.name.trim(),
        },
      })
    } catch (error) {
      // 錯誤已在 onError 中處理
      console.error('提交錯誤:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 標題 */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            手機號碼註冊
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            已有帳戶？{' '}
            <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
              立即登入
            </Link>
          </p>
        </div>

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
            {lineLoginLoading ? 'LINE 註冊中...' : '使用 LINE 註冊'}
          </button>
        </div>

        {/* 分隔線 */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">或使用手機號碼註冊</span>
            </div>
          </div>
        </div>

        {/* 註冊表單 */}
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {/* 全局錯誤訊息 */}
          {errors.submit && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{errors.submit}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* 手機號碼 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                手機號碼 *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className={`mt-1 appearance-none block w-full px-3 py-2 border ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                placeholder="0912345678"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            {/* 姓名 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                姓名 *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 appearance-none block w-full px-3 py-2 border ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                placeholder="王小明"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
          </div>

          {/* 提交按鈕 */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '註冊中...' : '註冊'}
            </button>
          </div>

          {/* 說明文字 */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              使用手機號碼即可快速註冊
            </p>
            <p className="text-xs text-gray-400 mt-2">
              註冊即表示您同意我們的{' '}
              <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                服務條款
              </Link>{' '}
              和{' '}
              <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                隱私政策
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
