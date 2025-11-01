/**
 * 公告彈窗組件
 *
 * 功能：
 * - 彈窗式顯示系統公告
 * - 智能更新檢測：後台更新公告後，前台自動重新顯示（5秒緩衝期避免時間戳誤差）
 * - localStorage 持久化記錄已關閉的公告
 * - 支援登入/未登入用戶的獨立記錄
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
import { useAuth } from '@/contexts/AuthContext'

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

// Nike/Adidas 風格配色 - 大膽、簡潔、運動感
const TYPE_STYLES = {
  INFO: {
    gradient: 'from-blue-600 to-blue-800',
    badge: 'bg-blue-500',
    text: 'text-gray-900',
    icon: '💡',
    label: '資訊'
  },
  SUCCESS: {
    gradient: 'from-green-600 to-green-800',
    badge: 'bg-green-500',
    text: 'text-gray-900',
    icon: '✓',
    label: '成功'
  },
  WARNING: {
    gradient: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-500',
    text: 'text-gray-900',
    icon: '⚡',
    label: '注意'
  },
  ERROR: {
    gradient: 'from-red-600 to-red-800',
    badge: 'bg-red-500',
    text: 'text-gray-900',
    icon: '✕',
    label: '錯誤'
  },
  PROMOTION: {
    gradient: 'from-purple-600 via-pink-600 to-red-600',
    badge: 'bg-gradient-to-r from-purple-500 to-pink-500',
    text: 'text-gray-900',
    icon: '🔥',
    label: '優惠'
  },
  MAINTENANCE: {
    gradient: 'from-gray-700 to-gray-900',
    badge: 'bg-gray-600',
    text: 'text-gray-900',
    icon: '🔧',
    label: '維護'
  },
}

// 🔧 調試工具開關：設為 false 可完全關閉調試功能
const ENABLE_DEBUG_TOOLS = false

// 獲取儲存 key（根據用戶 ID）
const getStorageKey = (userId?: string) => {
  if (userId) {
    return `dismissed_announcements_v4_user_${userId}`
  }
  return 'dismissed_announcements_v4_guest'
}

interface DismissedRecord {
  id: string
  dismissedAt: string // ISO 時間字串
}

// 從儲存中讀取已關閉的公告記錄（包含關閉時間）
const getDismissedRecords = (userId?: string, useSession: boolean = false): Map<string, string> => {
  if (typeof window === 'undefined') return new Map()

  try {
    const storageKey = getStorageKey(userId)
    const storage = useSession ? sessionStorage : localStorage
    const stored = storage.getItem(storageKey)
    if (!stored) return new Map()

    const records: DismissedRecord[] = JSON.parse(stored)
    return new Map(records.map(r => [r.id, r.dismissedAt]))
  } catch {
    return new Map()
  }
}

// 儲存已關閉的公告記錄
const saveDismissedRecords = (records: Map<string, string>, userId?: string, useSession: boolean = false) => {
  if (typeof window === 'undefined') return

  try {
    const storageKey = getStorageKey(userId)
    const storage = useSession ? sessionStorage : localStorage
    const array: DismissedRecord[] = Array.from(records.entries()).map(([id, dismissedAt]) => ({
      id,
      dismissedAt
    }))
    storage.setItem(storageKey, JSON.stringify(array))

    if (ENABLE_DEBUG_TOOLS && process.env.NODE_ENV === 'development') {
      console.log(`✅ [公告系統] 已保存到 ${useSession ? 'sessionStorage' : 'localStorage'}`)
      console.log(`✅ [公告系統] Key: ${storageKey}`)
      console.log(`✅ [公告系統] 內容:`, array)
    }
  } catch (error) {
    console.error('❌ [公告系統] 無法儲存已關閉的公告:', error)
  }
}

// 檢查公告是否應該顯示（智能更新檢測：公告更新後自動重新顯示）
const shouldShowAnnouncement = (
  announcement: any,
  dismissedRecords: Map<string, string>
): boolean => {
  const dismissedAt = dismissedRecords.get(announcement.id)

  // 沒有被關閉過，應該顯示
  if (!dismissedAt) {
    if (ENABLE_DEBUG_TOOLS && process.env.NODE_ENV === 'development') {
      console.log(`✅ [公告 ${announcement.id}] 從未被關閉 → 顯示`)
    }
    return true
  }

  // 如果公告有 updatedAt 欄位，檢查是否在關閉之後更新過
  if (announcement.updatedAt) {
    const announcementUpdatedAt = new Date(announcement.updatedAt).getTime()
    const userDismissedAt = new Date(dismissedAt).getTime()

    // 設定 5 秒的小緩衝期，避免同一時刻的時間戳誤差問題
    const bufferTime = 5 * 1000 // 5 秒
    const timeDiff = announcementUpdatedAt - userDismissedAt

    if (ENABLE_DEBUG_TOOLS && process.env.NODE_ENV === 'development') {
      console.log(`🔍 [公告 ${announcement.id}] 時間檢查:`)
      console.log(`   公告更新時間: ${new Date(announcementUpdatedAt).toLocaleString()}`)
      console.log(`   用戶關閉時間: ${new Date(userDismissedAt).toLocaleString()}`)
      console.log(`   時間差距: ${Math.floor(timeDiff / 1000)} 秒`)
      console.log(`   結果: ${timeDiff > bufferTime ? '✅ 顯示 (公告已更新)' : '❌ 隱藏 (已被關閉)'}`)
    }

    // 如果公告更新時間晚於用戶關閉時間（超過5秒），重新顯示
    if (timeDiff > bufferTime) {
      return true
    }
  }

  // 已經被關閉過且沒有更新，不顯示
  if (ENABLE_DEBUG_TOOLS && process.env.NODE_ENV === 'development') {
    console.log(`❌ [公告 ${announcement.id}] 已被關閉且未更新 → 隱藏`)
    console.log(`   關閉時間: ${new Date(dismissedAt).toLocaleString()}`)
  }
  return false
}

export default function AnnouncementModal() {
  const { user, isLoading: authLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [dismissedRecords, setDismissedRecords] = useState<Map<string, string>>(new Map())

  const { data, loading, refetch } = useQuery(GET_ACTIVE_ANNOUNCEMENTS, {
    fetchPolicy: 'network-only', // 改為每次都從網路獲取最新數據
    nextFetchPolicy: 'cache-first', // 後續查詢使用快取
  })

  // 統一使用 localStorage（不再使用 sessionStorage，確保關閉記錄持久保存）
  const useSessionStorage = false

  // 初始化：從儲存中讀取已關閉的公告記錄（等待認證完成）
  useEffect(() => {
    if (!authLoading) {
      setDismissedRecords(getDismissedRecords(user?.id, useSessionStorage))
    }
  }, [user?.id, authLoading, useSessionStorage])

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
          const timeDiff = new Date(a.updatedAt).getTime() - new Date(dismissedAt).getTime()
          if (timeDiff > 5000) { // 5秒緩衝期
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
        <div className="fixed bottom-6 right-6 z-50 max-w-xs">
          <div className="bg-black text-white shadow-2xl p-5 border-l-4 border-yellow-500">
            <div className="flex items-start gap-4">
              <span className="text-2xl">⚡</span>
              <div className="flex-1">
                <h4 className="font-black text-sm uppercase tracking-wider mb-2">開發模式</h4>
                <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                  後端有 {allAnnouncements.length} 個公告已被關閉
                </p>
                <button
                  onClick={() => {
                    // 清除所有版本的記錄
                    const storageKey = getStorageKey(user?.id)
                    localStorage.removeItem(storageKey)
                    sessionStorage.removeItem(storageKey)
                    // 清除舊版本
                    localStorage.removeItem('dismissed_announcements')
                    localStorage.removeItem('dismissed_announcements_v2')
                    localStorage.removeItem('dismissed_announcements_v3_guest')
                    if (user?.id) {
                      localStorage.removeItem(`dismissed_announcements_v3_user_${user.id}`)
                    }
                    setDismissedRecords(new Map())
                    refetch()
                  }}
                  className="w-full bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors"
                >
                  重新顯示
                </button>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
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

  // 關閉單個公告（保存到儲存，記錄關閉時間）
  const handleDismissSingle = (id: string) => {
    const now = new Date().toISOString()
    const newRecords = new Map(dismissedRecords)
    newRecords.set(id, now)

    if (ENABLE_DEBUG_TOOLS && process.env.NODE_ENV === 'development') {
      console.log(`📢 [公告系統] 關閉公告: ${id}`)
      console.log(`📢 [公告系統] 關閉時間: ${now}`)
      console.log(`📢 [公告系統] 使用 Storage:`, useSessionStorage ? 'sessionStorage' : 'localStorage')
      console.log(`📢 [公告系統] Storage Key:`, getStorageKey(user?.id))
    }

    setDismissedRecords(newRecords)
    saveDismissedRecords(newRecords, user?.id, useSessionStorage)

    // 如果只剩這一個公告，關閉整個彈窗
    if (visibleAnnouncements.length === 1) {
      setIsOpen(false)
    }
  }

  // 關閉所有公告（保存到儲存，記錄關閉時間）
  const handleDismissAll = () => {
    const now = new Date().toISOString()
    const newRecords = new Map(dismissedRecords)
    visibleAnnouncements.forEach((a: any) => {
      newRecords.set(a.id, now)
    })
    setDismissedRecords(newRecords)
    saveDismissedRecords(newRecords, user?.id, useSessionStorage)
    setIsOpen(false)
  }

  return (
    <>
      {/* 遮罩層 - Nike 風格深色遮罩 */}
      <div
        className="fixed inset-0 bg-black/70 z-50 transition-opacity backdrop-blur-[2px]"
        onClick={handleClose}
      />

      {/* 彈窗內容 - 極簡運動風格 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="bg-white max-w-3xl w-full max-h-[85vh] overflow-hidden pointer-events-auto transform transition-all flex flex-col shadow-2xl"
          style={{ borderRadius: '4px' }} // Nike/Adidas 使用較小的圓角
          onClick={(e) => e.stopPropagation()}
        >
          {/* 頂部關閉按鈕 - 極簡設計 */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
              aria-label="關閉"
            >
              <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 公告列表（可滾動） - 無上邊距，直接顯示內容 */}
          <div className="flex-1 overflow-y-auto">
            {visibleAnnouncements.map((announcement: any, index: number) => {
              const style = TYPE_STYLES[announcement.type as keyof typeof TYPE_STYLES] || TYPE_STYLES.INFO

              return (
                <div key={announcement.id}>
                  {/* 彩色漸變頂部條 - Nike/Adidas 風格標誌性設計 */}
                  <div className={`h-1 bg-gradient-to-r ${style.gradient}`} />

                  <div className="p-6 sm:p-8 lg:p-10">
                    {/* 類型標籤 */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`${style.badge} text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm`}>
                        {style.label}
                      </span>
                      <span className="text-3xl">{style.icon}</span>
                    </div>

                    {/* 大標題 - Nike 風格粗體 */}
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-4 leading-tight uppercase tracking-tight">
                      {announcement.title}
                    </h3>

                    {/* 內容 - 簡潔易讀 */}
                    <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
                      {announcement.content}
                    </p>

                    {/* CTA 按鈕組 */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {announcement.actionUrl && announcement.actionLabel && (
                        <Link
                          href={announcement.actionUrl}
                          className="group relative bg-black text-white px-6 py-3.5 font-bold text-sm uppercase tracking-wider hover:bg-gray-900 transition-all overflow-hidden"
                          onClick={handleClose}
                        >
                          {/* 按鈕滑動效果 */}
                          <span className="relative z-10">{announcement.actionLabel}</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        </Link>
                      )}

                      <button
                        onClick={() => handleDismissSingle(announcement.id)}
                        className="px-6 py-3.5 border-2 border-gray-300 text-gray-700 font-bold text-sm uppercase tracking-wider hover:border-black hover:bg-black hover:text-white transition-all"
                      >
                        不再顯示
                      </button>
                    </div>
                  </div>

                  {/* 分隔線（如果有多則公告）*/}
                  {index < visibleAnnouncements.length - 1 && (
                    <div className="border-t-4 border-gray-100" />
                  )}
                </div>
              )
            })}
          </div>

          {/* 底部固定按鈕區 - Nike 風格 */}
          <div className="p-4 sm:p-6 border-t-2 border-gray-100 bg-gray-50">
            {/* 開發環境：調試工具 */}
            {ENABLE_DEBUG_TOOLS && process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-4 bg-black text-white border-l-4 border-yellow-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">⚡</span>
                  <span className="font-black text-xs uppercase tracking-widest">開發工具</span>
                </div>
                <div className="space-y-2 text-xs text-gray-300 mb-4">
                  <div className="flex justify-between">
                    <span>後端活躍公告:</span>
                    <span className="font-bold text-white">{data?.activeAnnouncements?.length || 0} 則</span>
                  </div>
                  <div className="flex justify-between">
                    <span>已關閉公告:</span>
                    <span className="font-bold text-white">{dismissedRecords.size} 則</span>
                  </div>
                  <div className="flex justify-between">
                    <span>可顯示公告:</span>
                    <span className="font-bold text-white">{visibleAnnouncements.length} 則</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // 清除所有版本的記錄
                    const storageKey = getStorageKey(user?.id)
                    localStorage.removeItem(storageKey)
                    sessionStorage.removeItem(storageKey)
                    // 清除舊版本
                    localStorage.removeItem('dismissed_announcements')
                    localStorage.removeItem('dismissed_announcements_v2')
                    localStorage.removeItem('dismissed_announcements_v3_guest')
                    if (user?.id) {
                      localStorage.removeItem(`dismissed_announcements_v3_user_${user.id}`)
                    }
                    setDismissedRecords(new Map())
                    refetch()
                    console.log('✅ 已清除所有已關閉的公告記錄')
                  }}
                  className="w-full bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors"
                >
                  清除記錄並重新載入
                </button>
              </div>
            )}

            {/* 主要操作按鈕 - Nike 風格扁平按鈕 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                onClick={handleClose}
                className="px-5 py-3 text-gray-700 hover:text-black font-bold text-sm uppercase tracking-wider transition-colors order-2 sm:order-1"
              >
                稍後再看
              </button>
              <button
                onClick={handleDismissAll}
                className="px-8 py-3 bg-black text-white font-bold text-sm uppercase tracking-wider hover:bg-gray-800 transition-all hover:scale-[1.02] order-1 sm:order-2"
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
