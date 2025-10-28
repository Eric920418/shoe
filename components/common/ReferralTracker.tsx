'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ReferralTracker() {
  const searchParams = useSearchParams()

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
    }
  }, [searchParams])

  return null
}
