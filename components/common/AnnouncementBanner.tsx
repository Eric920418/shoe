'use client'

import { useQuery, gql } from '@apollo/client'
import { useState } from 'react'
import Link from 'next/link'

const GET_ACTIVE_ANNOUNCEMENTS = gql`
  query GetActiveAnnouncements {
    activeAnnouncements {
      id
      title
      content
      type
      priority
      actionUrl
      actionLabel
    }
  }
`

const TYPE_STYLES = {
  INFO: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    icon: 'ℹ️',
  },
  SUCCESS: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-900',
    icon: '✅',
  },
  WARNING: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-900',
    icon: '⚠️',
  },
  ERROR: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    icon: '❌',
  },
  PROMOTION: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-900',
    icon: '🎉',
  },
  MAINTENANCE: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-900',
    icon: '🔧',
  },
}

export default function AnnouncementBanner() {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  // ✅ 優化：與 AnnouncementModal 共用快取，避免重複請求
  const { data, loading } = useQuery(GET_ACTIVE_ANNOUNCEMENTS, {
    fetchPolicy: 'cache-first', // 優先使用快取（與 Modal 共用）
    nextFetchPolicy: 'cache-first',
  })

  if (loading || !data?.activeAnnouncements?.length) {
    return null
  }

  const visibleAnnouncements = data.activeAnnouncements.filter(
    (announcement: any) => !dismissedIds.has(announcement.id)
  )

  if (visibleAnnouncements.length === 0) {
    return null
  }

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]))
  }

  return (
    <div className="space-y-2">
      {visibleAnnouncements.map((announcement: any) => {
        const style = TYPE_STYLES[announcement.type as keyof typeof TYPE_STYLES] || TYPE_STYLES.INFO

        return (
          <div
            key={announcement.id}
            className={`${style.bg} ${style.border} border ${style.text} px-4 py-3 rounded-lg shadow-sm`}
          >
            <div className="flex items-start gap-3">
              {/* 圖示 */}
              <span className="text-2xl flex-shrink-0">{style.icon}</span>

              {/* 內容 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base mb-1">{announcement.title}</h3>
                <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>

                {/* 行動按鈕 */}
                {announcement.actionUrl && announcement.actionLabel && (
                  <Link
                    href={announcement.actionUrl}
                    className="inline-block mt-2 px-4 py-1.5 bg-white border border-current rounded-lg text-sm font-medium hover:bg-opacity-80 transition-colors"
                  >
                    {announcement.actionLabel}
                  </Link>
                )}
              </div>

              {/* 關閉按鈕 */}
              <button
                onClick={() => handleDismiss(announcement.id)}
                className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
                aria-label="關閉"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
