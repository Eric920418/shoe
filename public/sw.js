// Service Worker - 極速快取策略
const CACHE_VERSION = 'v1.0.0'
const CACHE_NAMES = {
  static: `static-cache-${CACHE_VERSION}`,
  dynamic: `dynamic-cache-${CACHE_VERSION}`,
  images: `image-cache-${CACHE_VERSION}`,
}

// 需要預快取的靜態資源
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/_next/static/css/app.css',
  '/favicon.ico',
]

// 快取策略配置
const CACHE_STRATEGIES = {
  // 網路優先（適用於 API）
  networkFirst: [
    '/api/',
    '/graphql',
  ],
  // 快取優先（適用於靜態資源）
  cacheFirst: [
    '/_next/static/',
    '/fonts/',
    '/images/icons/',
  ],
  // 僅網路（不快取）
  networkOnly: [
    '/admin/',
    '/checkout/',
  ],
  // 重新驗證時陳舊（適用於產品圖片）
  staleWhileRevalidate: [
    '/images/products/',
    '/images/brands/',
  ],
}

// 安裝事件 - 預快取靜態資源
self.addEventListener('install', (event) => {
  console.log('[SW] 安裝中...')

  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then((cache) => {
        console.log('[SW] 預快取靜態資源')
        // 忽略預快取失敗，避免安裝失敗
        return Promise.allSettled(
          STATIC_ASSETS.map(url =>
            cache.add(url).catch(err =>
              console.warn(`[SW] 預快取失敗: ${url}`, err)
            )
          )
        )
      })
      .then(() => self.skipWaiting()) // 立即激活
  )
})

// 激活事件 - 清理舊快取
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !Object.values(CACHE_NAMES).includes(name))
          .map((name) => {
            console.log(`[SW] 刪除舊快取: ${name}`)
            return caches.delete(name)
          })
      )
    }).then(() => self.clients.claim()) // 立即控制所有客戶端
  )
})

// 獲取請求策略
function getStrategy(url) {
  const urlString = url.toString()

  // 檢查每個策略
  for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => urlString.includes(pattern))) {
      return strategy
    }
  }

  // 預設策略：網路優先
  return 'networkFirst'
}

// 網路優先策略
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // 返回離線頁面
    if (request.mode === 'navigate') {
      return caches.match('/offline.html')
    }

    throw error
  }
}

// 快取優先策略
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    // 返回離線頁面
    if (request.mode === 'navigate') {
      return caches.match('/offline.html')
    }

    throw error
  }
}

// 重新驗證時陳舊策略
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request)

  // 背景更新快取
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(cacheName)
      cache.then(c => c.put(request, networkResponse.clone()))
    }
    return networkResponse
  }).catch(() => null)

  // 立即返回快取（如果有）
  return cachedResponse || fetchPromise
}

// 僅網路策略
async function networkOnly(request) {
  return fetch(request)
}

// Fetch 事件 - 攔截所有請求
self.addEventListener('fetch', (event) => {
  const { request } = event

  // 忽略非 GET 請求
  if (request.method !== 'GET') {
    event.respondWith(fetch(request))
    return
  }

  // 忽略瀏覽器擴展
  if (request.url.includes('chrome-extension')) {
    return
  }

  const strategy = getStrategy(request.url)
  let responsePromise

  switch (strategy) {
    case 'cacheFirst':
      responsePromise = cacheFirst(request, CACHE_NAMES.static)
      break
    case 'networkOnly':
      responsePromise = networkOnly(request)
      break
    case 'staleWhileRevalidate':
      responsePromise = staleWhileRevalidate(request, CACHE_NAMES.images)
      break
    case 'networkFirst':
    default:
      responsePromise = networkFirst(request, CACHE_NAMES.dynamic)
      break
  }

  event.respondWith(responsePromise)
})

// 背景同步（用於離線時提交表單）
self.addEventListener('sync', (event) => {
  console.log('[SW] 背景同步:', event.tag)

  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart())
  }
})

async function syncCart() {
  // 實現購物車同步邏輯
  console.log('[SW] 同步購物車...')
}

// 推送通知
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '您有新的通知',
    icon: '/images/icons/icon-192.png',
    badge: '/images/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  }

  event.waitUntil(
    self.registration.showNotification('潮流鞋店', options)
  )
})

// 通知點擊處理
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    clients.openWindow('/')
  )
})

// 清理快取（定期執行）
async function cleanupCaches() {
  const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 天

  const cacheNames = await caches.keys()

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const requests = await cache.keys()

    for (const request of requests) {
      const response = await cache.match(request)

      if (response) {
        const dateHeader = response.headers.get('date')

        if (dateHeader) {
          const cacheTime = new Date(dateHeader).getTime()

          if (Date.now() - cacheTime > maxAge) {
            console.log(`[SW] 刪除過期快取: ${request.url}`)
            await cache.delete(request)
          }
        }
      }
    }
  }
}

// 每天清理一次快取
setInterval(cleanupCaches, 24 * 60 * 60 * 1000)