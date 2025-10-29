'use client'

import { useEffect } from 'react'
import { initializePerformanceOptimizations } from '@/lib/performance'

// Web Vitals 類型定義
interface Metric {
  id: string
  name: string
  value: number
  rating?: 'good' | 'needs-improvement' | 'poor'
  delta?: number
  navigationType?: 'navigate' | 'reload' | 'back_forward' | 'prerender'
}

export default function PerformanceMonitor() {
  useEffect(() => {
    // 初始化性能優化
    initializePerformanceOptimizations()

    // 註冊 Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker 註冊成功:', registration.scope)

          // 檢查更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 新版本可用，請重新載入頁面')
                  // 可以顯示更新提示給用戶
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('❌ Service Worker 註冊失敗:', error)
        })
    }

    // 監控 Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          const lcp = lastEntry.renderTime || lastEntry.loadTime
          console.log(`📊 LCP: ${lcp.toFixed(2)}ms`)
          reportMetric({ name: 'LCP', value: lcp, rating: getLCPRating(lcp) })
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        console.warn('LCP 監控不可用')
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ('processingStart' in entry) {
              const fid = entry.processingStart - entry.startTime
              console.log(`📊 FID: ${fid.toFixed(2)}ms`)
              reportMetric({ name: 'FID', value: fid, rating: getFIDRating(fid) })
            }
          }
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (e) {
        console.warn('FID 監控不可用')
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      let clsEntries: PerformanceEntry[] = []

      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
              clsEntries.push(entry)
            }
          }
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })

        // 報告最終 CLS
        addEventListener('beforeunload', () => {
          console.log(`📊 CLS: ${clsValue.toFixed(3)}`)
          reportMetric({ name: 'CLS', value: clsValue, rating: getCLSRating(clsValue) })
        })
      } catch (e) {
        console.warn('CLS 監控不可用')
      }
    }

    // 監控資源載入
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming
          if (resourceEntry.duration > 1000) {
            console.warn(
              `⚠️ 慢資源: ${resourceEntry.name} - ${resourceEntry.duration.toFixed(2)}ms`
            )
          }
        }
      })

      try {
        resourceObserver.observe({ entryTypes: ['resource'] })
      } catch (e) {
        // 忽略
      }
    }

    // 監控長任務
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.warn(`⚠️ 長任務檢測: ${entry.duration.toFixed(2)}ms`)
          }
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        // Long Task API 可能不支援
      }
    }

    // 監控記憶體使用（Chrome only）
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2)
        const limitMB = (memory.jsHeapSizeLimit / 1048576).toFixed(2)
        const percent = ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1)

        if (parseFloat(percent) > 80) {
          console.warn(`⚠️ 記憶體使用過高: ${usedMB}MB / ${limitMB}MB (${percent}%)`)
        }
      }, 10000) // 每 10 秒檢查一次
    }

    // 監控頁面可見性
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('📱 頁面進入背景')
        // 可以暫停某些操作以節省資源
      } else {
        console.log('📱 頁面恢復前台')
        // 恢復操作
      }
    })

    // 監控網路狀態
    window.addEventListener('online', () => {
      console.log('🌐 網路已連接')
    })

    window.addEventListener('offline', () => {
      console.log('🔌 網路已斷開')
    })

    // 錯誤監控
    window.addEventListener('error', (event) => {
      console.error('❌ JavaScript 錯誤:', event.error)
      // 可以發送到錯誤追蹤服務
    })

    window.addEventListener('unhandledrejection', (event) => {
      console.error('❌ 未處理的 Promise 拒絕:', event.reason)
      // 可以發送到錯誤追蹤服務
    })

    // 清理函數
    return () => {
      // 清理觀察器
    }
  }, [])

  return null // 不渲染任何 UI
}

// 評級函數
function getLCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
  if (value <= 2500) return 'good'
  if (value <= 4000) return 'needs-improvement'
  return 'poor'
}

function getFIDRating(value: number): 'good' | 'needs-improvement' | 'poor' {
  if (value <= 100) return 'good'
  if (value <= 300) return 'needs-improvement'
  return 'poor'
}

function getCLSRating(value: number): 'good' | 'needs-improvement' | 'poor' {
  if (value <= 0.1) return 'good'
  if (value <= 0.25) return 'needs-improvement'
  return 'poor'
}

// 報告指標
function reportMetric(metric: Partial<Metric>) {
  // 開發環境顯示性能指標
  if (process.env.NODE_ENV === 'development') {
    const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌'
    console.log(`${emoji} ${metric.name}: ${metric.value?.toFixed(2)} (${metric.rating})`)
  }

  // 生產環境可以發送到分析服務
  if (process.env.NODE_ENV === 'production' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value || 0),
      metric_rating: metric.rating,
      non_interaction: true,
    })
  }
}

// TypeScript 聲明
declare global {
  interface Window {
    gtag: any
  }
}