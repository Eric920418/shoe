/**
 * 性能優化工具庫
 */

// 預連接關鍵域名
export function setupResourceHints() {
  if (typeof window === 'undefined') return

  const hints = [
    { rel: 'dns-prefetch', href: '//localhost:3000' },
    { rel: 'preconnect', href: '//localhost:3000' },
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'preconnect', href: '//fonts.gstatic.com', crossOrigin: 'anonymous' },
  ]

  hints.forEach((hint) => {
    const link = document.createElement('link')
    link.rel = hint.rel
    link.href = hint.href
    if (hint.crossOrigin) {
      link.setAttribute('crossorigin', hint.crossOrigin)
    }
    document.head.appendChild(link)
  })
}

// 預載入關鍵路由
export function prefetchCriticalRoutes() {
  if (typeof window === 'undefined') return

  // 使用 requestIdleCallback 在空閒時預載入
  const prefetchRoutes = ['/products', '/cart', '/auth/login']

  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      prefetchRoutes.forEach((route) => {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = route
        document.head.appendChild(link)
      })
    })
  }
}

// 延遲載入非關鍵 JavaScript
export function lazyLoadScripts() {
  if (typeof window === 'undefined') return

  // 延遲載入分析腳本
  setTimeout(() => {
    // Google Analytics 或其他分析工具
    if (process.env.NEXT_PUBLIC_GA_ID) {
      const script = document.createElement('script')
      script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`
      script.async = true
      document.head.appendChild(script)
    }
  }, 3000)
}

// 圖片懶載入與 Intersection Observer
export function setupImageLazyLoading() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return
  }

  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute('data-src')
            observer.unobserve(img)
          }
        }
      })
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01,
    }
  )

  // 觀察所有懶載入圖片
  document.querySelectorAll('img[data-src]').forEach((img) => {
    imageObserver.observe(img)
  })
}

// Web Vitals 監控
export function reportWebVitals(metric: any) {
  if (metric.label === 'web-vital') {
    console.log(`${metric.name}: ${metric.value.toFixed(2)} ms`)

    // 發送到分析服務
    if (window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        non_interaction: true,
      })
    }
  }
}

// 優化第三方腳本載入
export function optimizeThirdPartyScripts() {
  if (typeof window === 'undefined') return

  // 使用 facade 模式延遲載入重型組件
  window.addEventListener('scroll', () => {
    // 當用戶滾動時才載入聊天小部件
    if (window.scrollY > 100 && !window.__chatLoaded) {
      window.__chatLoaded = true
      // 載入客服聊天組件
    }
  }, { once: true, passive: true })
}

// Service Worker 預快取
export async function setupServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service Worker registered:', registration)
  } catch (error) {
    console.error('Service Worker registration failed:', error)
  }
}

// 初始化所有性能優化
export function initializePerformanceOptimizations() {
  if (typeof window === 'undefined') return

  // DOM 載入後執行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupResourceHints()
      prefetchCriticalRoutes()
      setupImageLazyLoading()
      optimizeThirdPartyScripts()
    })
  } else {
    // DOM 已載入
    setupResourceHints()
    prefetchCriticalRoutes()
    setupImageLazyLoading()
    optimizeThirdPartyScripts()
  }

  // 延遲載入非關鍵腳本
  lazyLoadScripts()

  // 設置 Service Worker
  if ('serviceWorker' in navigator) {
    setupServiceWorker()
  }
}

// 記憶體清理
export function cleanupMemory() {
  if (typeof window === 'undefined') return

  // 清理未使用的圖片
  const images = document.querySelectorAll('img')
  images.forEach((img) => {
    if (!isInViewport(img)) {
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    }
  })
}

function isInViewport(element: Element) {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

// TypeScript 聲明
declare global {
  interface Window {
    gtag: any
    __chatLoaded: boolean
  }
}