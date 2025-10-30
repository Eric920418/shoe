'use client'

/**
 * 郵件退訂頁面
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function UnsubscribePage() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('缺少退訂 token')
      return
    }

    // 執行退訂
    const unsubscribe = async () => {
      try {
        const res = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              mutation UnsubscribeEmail($token: String!) {
                unsubscribeEmail(token: $token)
              }
            `,
            variables: { token },
          }),
        })

        const json = await res.json()
        if (json.errors) {
          throw new Error(json.errors[0]?.message || '退訂失敗')
        }

        setStatus('success')
      } catch (error: any) {
        setStatus('error')
        setError(error.message || '退訂失敗，請稍後再試')
      }
    }

    unsubscribe()
  }, [token])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">處理中...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">退訂成功</h1>
            <p className="text-gray-600 mb-6">
              您已成功取消訂閱我們的行銷郵件。
            </p>
            <p className="text-sm text-gray-500 mb-6">
              我們不會再向您發送行銷相關的郵件，但您仍會收到訂單確認、出貨通知等重要郵件。
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/')}
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
              >
                返回首頁
              </button>
              <p className="text-xs text-gray-500">
                如果您想重新訂閱，可以在帳戶設定中重新開啟。
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">退訂失敗</h1>
            <p className="text-red-600 mb-6">{error}</p>
            <p className="text-sm text-gray-500 mb-6">
              可能的原因：
            </p>
            <ul className="text-sm text-gray-600 text-left mb-6 space-y-2">
              <li>• 退訂連結已過期</li>
              <li>• 退訂連結無效或損壞</li>
              <li>• 您已經退訂過了</li>
            </ul>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/account')}
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
              >
                前往帳戶設定
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
              >
                返回首頁
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            如有任何問題，請聯繫我們的客服團隊
          </p>
        </div>
      </div>
    </div>
  )
}
