#!/usr/bin/env node

/**
 * 性能測試腳本
 * 用於測試網站優化前後的性能差異
 */

const https = require('https')
const http = require('http')
const { performance } = require('perf_hooks')

// 測試配置
const config = {
  originalUrl: 'http://localhost:3000',
  optimizedUrl: 'http://localhost:3000/optimized',
  iterations: 5,
  pages: [
    '/',
    '/products',
    '/products/nike-air-max-90', // 替換為實際產品 slug
  ],
}

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
}

// 測試單個 URL
async function testUrl(url) {
  return new Promise((resolve) => {
    const start = performance.now()
    const protocol = url.startsWith('https') ? https : http

    protocol.get(url, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        const end = performance.now()
        const time = end - start
        const size = Buffer.byteLength(data, 'utf8')

        resolve({
          url,
          time: Math.round(time),
          size: Math.round(size / 1024), // KB
          status: res.statusCode,
        })
      })
    }).on('error', (err) => {
      resolve({
        url,
        time: -1,
        size: 0,
        status: 0,
        error: err.message,
      })
    })
  })
}

// 執行多次測試並計算平均值
async function testMultiple(url, iterations) {
  const results = []

  for (let i = 0; i < iterations; i++) {
    process.stdout.write(`  測試 ${i + 1}/${iterations}...`)
    const result = await testUrl(url)
    results.push(result)

    // 延遲避免過載
    await new Promise(resolve => setTimeout(resolve, 500))
    process.stdout.write('\r')
  }

  // 計算平均值
  const avgTime = results.reduce((sum, r) => sum + r.time, 0) / iterations
  const avgSize = results.reduce((sum, r) => sum + r.size, 0) / iterations

  return {
    url,
    avgTime: Math.round(avgTime),
    avgSize: Math.round(avgSize),
    results,
  }
}

// 主測試函數
async function runPerformanceTests() {
  console.log(`${colors.bright}${colors.blue}🚀 開始性能測試${colors.reset}`)
  console.log(`${colors.yellow}配置：${colors.reset}`)
  console.log(`  - 原始版本: ${config.originalUrl}`)
  console.log(`  - 優化版本: ${config.optimizedUrl}`)
  console.log(`  - 測試次數: ${config.iterations}`)
  console.log('')

  const results = {
    original: [],
    optimized: [],
  }

  // 測試每個頁面
  for (const page of config.pages) {
    console.log(`${colors.bright}測試頁面: ${page}${colors.reset}`)

    // 測試原始版本
    console.log(`${colors.yellow}原始版本:${colors.reset}`)
    const originalResult = await testMultiple(
      config.originalUrl + page,
      config.iterations
    )
    results.original.push(originalResult)
    console.log(`  平均時間: ${originalResult.avgTime}ms`)
    console.log(`  平均大小: ${originalResult.avgSize}KB`)

    // 測試優化版本
    console.log(`${colors.yellow}優化版本:${colors.reset}`)
    const optimizedResult = await testMultiple(
      config.optimizedUrl + page,
      config.iterations
    )
    results.optimized.push(optimizedResult)
    console.log(`  平均時間: ${optimizedResult.avgTime}ms`)
    console.log(`  平均大小: ${optimizedResult.avgSize}KB`)

    // 計算改進
    const timeImprovement = Math.round(
      ((originalResult.avgTime - optimizedResult.avgTime) / originalResult.avgTime) * 100
    )
    const sizeImprovement = Math.round(
      ((originalResult.avgSize - optimizedResult.avgSize) / originalResult.avgSize) * 100
    )

    const timeColor = timeImprovement > 0 ? colors.green : colors.red
    const sizeColor = sizeImprovement > 0 ? colors.green : colors.red

    console.log(`${colors.bright}改進:${colors.reset}`)
    console.log(`  時間: ${timeColor}${timeImprovement > 0 ? '-' : '+'}${Math.abs(timeImprovement)}%${colors.reset}`)
    console.log(`  大小: ${sizeColor}${sizeImprovement > 0 ? '-' : '+'}${Math.abs(sizeImprovement)}%${colors.reset}`)
    console.log('')
  }

  // 總結報告
  console.log(`${colors.bright}${colors.magenta}📊 總結報告${colors.reset}`)
  console.log('═'.repeat(50))

  // 計算總體改進
  const totalOriginalTime = results.original.reduce((sum, r) => sum + r.avgTime, 0)
  const totalOptimizedTime = results.optimized.reduce((sum, r) => sum + r.avgTime, 0)
  const totalOriginalSize = results.original.reduce((sum, r) => sum + r.avgSize, 0)
  const totalOptimizedSize = results.optimized.reduce((sum, r) => sum + r.avgSize, 0)

  const overallTimeImprovement = Math.round(
    ((totalOriginalTime - totalOptimizedTime) / totalOriginalTime) * 100
  )
  const overallSizeImprovement = Math.round(
    ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100
  )

  console.log(`${colors.bright}總載入時間:${colors.reset}`)
  console.log(`  原始: ${totalOriginalTime}ms`)
  console.log(`  優化: ${totalOptimizedTime}ms`)
  console.log(`  ${colors.green}改進: ${overallTimeImprovement}%${colors.reset}`)

  console.log(`${colors.bright}總頁面大小:${colors.reset}`)
  console.log(`  原始: ${totalOriginalSize}KB`)
  console.log(`  優化: ${totalOptimizedSize}KB`)
  console.log(`  ${colors.green}改進: ${overallSizeImprovement}%${colors.reset}`)

  console.log('═'.repeat(50))

  // 性能評級
  let rating = '⭐'
  if (overallTimeImprovement > 20) rating = '⭐⭐'
  if (overallTimeImprovement > 40) rating = '⭐⭐⭐'
  if (overallTimeImprovement > 60) rating = '⭐⭐⭐⭐'
  if (overallTimeImprovement > 80) rating = '⭐⭐⭐⭐⭐'

  console.log(`${colors.bright}性能評級: ${rating}${colors.reset}`)

  // 建議
  console.log(`\n${colors.bright}${colors.blue}💡 建議:${colors.reset}`)
  if (overallTimeImprovement < 20) {
    console.log('- 考慮啟用 Redis 快取')
    console.log('- 檢查是否正確使用優化配置')
    console.log('- 確認 Service Worker 已註冊')
  } else if (overallTimeImprovement < 50) {
    console.log('- 優化效果良好！')
    console.log('- 可以考慮添加 CDN 進一步提升')
    console.log('- 檢查圖片是否都已優化')
  } else {
    console.log('- 優化效果極佳！🎉')
    console.log('- 網站速度已大幅提升')
    console.log('- 建議進行 Lighthouse 測試確認分數')
  }
}

// 檢查伺服器是否運行
async function checkServer() {
  try {
    await testUrl(config.originalUrl)
    return true
  } catch (error) {
    console.error(`${colors.red}❌ 無法連接到伺服器${colors.reset}`)
    console.log('請確保開發伺服器正在運行：')
    console.log('  pnpm dev')
    return false
  }
}

// 主程序
async function main() {
  console.clear()
  console.log(`${colors.bright}${colors.magenta}
╔═══════════════════════════════════╗
║     網站性能優化測試工具          ║
╚═══════════════════════════════════╝
${colors.reset}`)

  // 檢查伺服器
  const serverRunning = await checkServer()
  if (!serverRunning) {
    process.exit(1)
  }

  // 執行測試
  await runPerformanceTests()

  console.log(`\n${colors.green}✅ 測試完成！${colors.reset}`)
  console.log('執行 "npx lighthouse http://localhost:3000 --view" 獲取更詳細的報告')
}

// 執行
main().catch(console.error)