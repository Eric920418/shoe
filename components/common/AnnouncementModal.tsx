/**
 * 公告彈窗組件
 *
 * 功能：
 * - 彈窗式顯示系統公告
 * - 智能更新檢測：公告更新後會自動重新顯示
 * - localStorage 持久化記錄已關閉的公告
 *
 * 調試工具：
 * - 將下方 ENABLE_DEBUG_TOOLS 設為 true 可啟用調試工具
 * - 調試工具包含：Console 日誌、彈窗內調試面板、右下角提示卡片
 * - 生產環境 (NODE_ENV=production) 會自動禁用所有調試功能
 */

'use client'

import { useQuery, gql } from '@apollo/client'
import { useState, useEffect } from 'react'
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
      updatedAt
    }
  }
`

const TYPE_STYLES = {
  INFO: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    icon: 'ℹ️',
    accentColor: 'bg-blue-500'
  },
  SUCCESS: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-900',
    icon: '✅',
    accentColor: 'bg-green-500'
  },
  WARNING: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-900',
    icon: '⚠️',
    accentColor: 'bg-yellow-500'
  },
  ERROR: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    icon: '❌',
    accentColor: 'bg-red-500'
  },
  PROMOTION: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-900',
    icon: '🎉',
    accentColor: 'bg-purple-500'
  },
  MAINTENANCE: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-900',
    icon: '🔧',
    accentColor: 'bg-gray-500'
  },
}

const STORAGE_KEY = 'dismissed_announcements_v2'

// 🔧 調試工具開關：設為 false 可完全關閉調試功能
const ENABLE_DEBUG_TOOLS = false

interface DismissedRecord {
  id: string
  dismissedAt: string // ISO 時間字串
}

// 從 localStorage 讀取已關閉的公告記錄（包含關閉時間）
const getDismissedRecords = (): Map<string, string> => {
  if (typeof window === 'undefined') return new Map()

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return new Map()

    const records: DismissedRecord[] = JSON.parse(stored)
    return new Map(records.map(r => [r.id, r.dismissedAt]))
  } catch {
    return new Map()
  }
}

// 儲存已關閉的公告記錄到 localStorage
const saveDismissedRecords = (records: Map<string, string>) => {
  if (typeof window === 'undefined') return

  try {
    const array: DismissedRecord[] = Array.from(records.entries()).map(([id, dismissedAt]) => ({
      id,
      dismissedAt
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(array))
  } catch (error) {
    console.error('無法儲存已關閉的公告:', error)
  }
}

// 檢查公告是否應該顯示（考慮更新時間）
const shouldShowAnnouncement = (
  announcement: any,
  dismissedRecords: Map<string, string>
): boolean => {
  const dismissedAt = dismissedRecords.get(announcement.id)

  // 沒有被關閉過，應該顯示
  if (!dismissedAt) return true

  // 如果公告有 updatedAt 欄位，檢查是否在關閉之後更新過
  if (announcement.updatedAt) {
    const announcementUpdatedAt = new Date(announcement.updatedAt).getTime()
    const userDismissedAt = new Date(dismissedAt).getTime()

    // 如果公告更新時間晚於用戶關閉時間，應該重新顯示
    if (announcementUpdatedAt > userDismissedAt) {
      return true
    }
  }

  // 已經被關閉過且沒有更新，不顯示
  return false
}

export default function AnnouncementModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [dismissedRecords, setDismissedRecords] = useState<Map<string, string>>(new Map())

  const { data, loading, refetch } = useQuery(GET_ACTIVE_ANNOUNCEMENTS, {
    fetchPolicy: 'network-only', // 改為每次都從網路獲取最新數據
    nextFetchPolicy: 'cache-first', // 後續查詢使用快取
  })

  // 初始化：從 localStorage 讀取已關閉的公告記錄
  useEffect(() => {
    setDismissedRecords(getDismissedRecords())
  }, [])

  // 過濾掉已關閉的公告（考慮更新時間）
  const visibleAnnouncements = data?.activeAnnouncements?.filter(
    (announcement: any) => shouldShowAnnouncement(announcement, dismissedRecords)
  ) || []

  // 開發環境下顯示調試信息
  useEffect(() => {
    if (ENABLE_DEBUG_TOOLS && process.env.NODE_ENV === 'development' && data?.activeAnnouncements) {
      console.log('📢 [公告系統] 當前活躍公告:', data.activeAnnouncements.length, '則')
      console.log('📢 [公告系統] 已關閉的公告記錄:', Array.from(dismissedRecords.entries()))
      console.log('📢 [公告系統] 可顯示的公告:', visibleAnnouncements.length, '則')

      // 顯示哪些公告因為更新而重新顯示
      data.activeAnnouncements.forEach((a: any) => {
        const dismissedAt = dismissedRecords.get(a.id)
        if (dismissedAt && a.updatedAt) {
          const isUpdatedAfterDismiss = new Date(a.updatedAt).getTime() > new Date(dismissedAt).getTime()
          if (isUpdatedAfterDismiss) {
            console.log(`🔄 [公告系統] 公告 "${a.title}" 已更新，將重新顯示`)
          }
        }
      })
    }
  }, [data, dismissedRecords, visibleAnnouncements])

  // 當有可顯示的公告時，自動打開彈窗
  useEffect(() => {
    if (visibleAnnouncements.length > 0 && !loading) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [visibleAnnouncements.length, loading])

  // 開發環境：即使沒有公告也顯示調試信息
  if (ENABLE_DEBUG_TOOLS && process.env.NODE_ENV === 'development' && !loading && visibleAnnouncements.length === 0) {
    const allAnnouncements = data?.activeAnnouncements || []
    if (allAnnouncements.length > 0 && dismissedRecords.size > 0) {
      // 有公告但都被關閉了（且沒有更新）
      return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h4 className="font-bold text-yellow-900 mb-2">調試訊息</h4>
                <p className="text-sm text-yellow-800 mb-3">
                  後端有 {allAnnouncements.length} 個公告，但都已被關閉且未更新。
                </p>
                <button
                  onClick={() => {
                    localStorage.removeItem(STORAGE_KEY)
                    localStorage.removeItem('dismissed_announcements') // 清除舊版本
                    setDismissedRecords(new Map())
                    refetch()
                  }}
                  className="px-3 py-1.5 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                >
                  清除記錄並顯示公告
                </button>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  if (loading || visibleAnnouncements.length === 0 || !isOpen) {
    return null
  }

  // 臨時關閉（本次會話，不保存到 localStorage）
  const handleClose = () => {
    setIsOpen(false)
  }

  // 關閉單個公告（保存到 localStorage，記錄關閉時間）
  const handleDismissSingle = (id: string) => {
    const now = new Date().toISOString()
    const newRecords = new Map(dismissedRecords)
    newRecords.set(id, now)
    setDismissedRecords(newRecords)
    saveDismissedRecords(newRecords)
  }

  // 關閉所有公告（保存到 localStorage，記錄關閉時間）
  const handleDismissAll = () => {
    const now = new Date().toISOString()
    const newRecords = new Map(dismissedRecords)
    visibleAnnouncements.forEach((a: any) => {
      newRecords.set(a.id, now)
    })
    setDismissedRecords(newRecords)
    saveDismissedRecords(newRecords)
    setIsOpen(false)
  }

  return (
    <>
      {/* 遮罩層 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* 彈窗內容 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden pointer-events-auto transform transition-all flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 頂部標題欄 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📢</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">系統公告</h3>
                <p className="text-sm text-gray-500">共 {visibleAnnouncements.length} 則公告</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="關閉"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 公告列表（可滾動） */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {visibleAnnouncements.map((announcement: any) => {
              const style = TYPE_STYLES[announcement.type as keyof typeof TYPE_STYLES] || TYPE_STYLES.INFO

              return (
                <div
                  key={announcement.id}
                  className={`${style.bg} ${style.border} border rounded-xl p-4 relative`}
                >
                  {/* 類型圖示與標題 */}
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl flex-shrink-0">{style.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-base ${style.text} mb-2`}>
                        {announcement.title}
                      </h4>
                      <p className={`${style.text} whitespace-pre-wrap text-sm leading-relaxed`}>
                        {announcement.content}
                      </p>

                      {/* 行動按鈕 */}
                      {announcement.actionUrl && announcement.actionLabel && (
                        <Link
                          href={announcement.actionUrl}
                          className={`inline-block mt-3 px-4 py-2 ${style.accentColor} text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity`}
                          onClick={handleClose}
                        >
                          {announcement.actionLabel}
                        </Link>
                      )}
                    </div>

                    {/* 單個公告的關閉按鈕 */}
                    <button
                      onClick={() => handleDismissSingle(announcement.id)}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="不再顯示此公告"
                      title="不再顯示此公告"
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

          {/* 底部按鈕區 */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            {/* 開發環境：調試工具 */}
            {ENABLE_DEBUG_TOOLS && process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-yellow-800">🔧 開發工具</span>
                </div>
                <div className="space-y-1 text-yellow-700">
                  <div>後端活躍公告: {data?.activeAnnouncements?.length || 0} 則</div>
                  <div>已關閉公告: {dismissedRecords.size} 則</div>
                  <div>可顯示公告: {visibleAnnouncements.length} 則</div>
                  <div className="text-xs text-yellow-600 mt-1">
                    💡 提示：更新公告會自動重新顯示
                  </div>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem(STORAGE_KEY)
                    localStorage.removeItem('dismissed_announcements') // 清除舊版本
                    setDismissedRecords(new Map())
                    refetch()
                    console.log('✅ 已清除所有已關閉的公告記錄')
                  }}
                  className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                >
                  清除所有記錄並重新載入
                </button>
              </div>
            )}

            {/* 主要操作按鈕 */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                稍後再看
              </button>
              <button
                onClick={handleDismissAll}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                全部不再顯示
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
