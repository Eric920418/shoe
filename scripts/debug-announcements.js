/**
 * 公告系統診斷腳本
 * 用於檢查為什麼公告不顯示
 */

console.log('=== 公告系統診斷工具 ===\n')

// 1. 檢查 localStorage 中的已關閉公告
console.log('1. 檢查 localStorage 中的已關閉公告')
console.log('   在瀏覽器控制台執行以下命令：')
console.log('   localStorage.getItem("dismissed_announcements")')
console.log('')

// 2. 清除所有已關閉的公告記錄
console.log('2. 清除所有已關閉的公告記錄（如需重置）')
console.log('   在瀏覽器控制台執行以下命令：')
console.log('   localStorage.removeItem("dismissed_announcements")')
console.log('   然後重新整理頁面')
console.log('')

// 3. 檢查 Apollo Client 快取
console.log('3. 檢查 Apollo Client 快取')
console.log('   在瀏覽器控制台執行以下命令：')
console.log('   window.__APOLLO_CLIENT__ && window.__APOLLO_CLIENT__.cache.data.data')
console.log('')

// 4. 強制重新查詢
console.log('4. 測試步驟：')
console.log('   a. 打開瀏覽器開發者工具 (F12)')
console.log('   b. 切換到 Console 標籤')
console.log('   c. 執行: localStorage.removeItem("dismissed_announcements")')
console.log('   d. 按 Ctrl + Shift + R 硬重載頁面')
console.log('   e. 檢查是否出現公告彈窗')
console.log('')

// 5. 檢查後端 API
console.log('5. 檢查後端 API 返回的公告')
console.log('   執行以下命令查看當前活躍公告：')
console.log('   curl -X POST http://localhost:3000/api/graphql \\')
console.log('     -H "Content-Type: application/json" \\')
console.log('     -d \'{"query":"{ activeAnnouncements { id title isActive startDate endDate } }"}\'')
console.log('')

console.log('=== 常見問題 ===\n')
console.log('問題 1: 後台更新公告後前台沒顯示')
console.log('原因 1: 這些公告已經被用戶關閉過（localStorage 中有記錄）')
console.log('解決: 清除 localStorage 或在後台創建新的公告')
console.log('')
console.log('原因 2: Apollo Client 快取未更新')
console.log('解決: 硬重載頁面 (Ctrl + Shift + R)')
console.log('')
console.log('原因 3: 公告的時間範圍設定有問題')
console.log('解決: 檢查 startDate 是否是未來時間、endDate 是否已過期')
console.log('')
