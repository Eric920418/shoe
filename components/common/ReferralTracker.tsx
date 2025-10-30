'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function ReferralTracker() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const ref = searchParams?.get('ref')

    if (ref) {
      // 儲存邀請碼到 localStorage，有效期 30 天
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000
      localStorage.setItem('referralCode', JSON.stringify({
        code: ref,
        expiresAt,
      }))

      console.log('邀請碼已記錄:', ref)

      // 清除 URL 參數，讓被邀請人看不到邀請碼
      // 使用 window.history.replaceState 來避免觸發頁面重新載入
      const url = new URL(window.location.href)
      url.searchParams.delete('ref')
      window.history.replaceState({}, '', url.pathname + url.search)
    }
  }, [searchParams, router])

  return null
}
