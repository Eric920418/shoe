/**
 * 檢查並修復管理員用戶的 role 欄位
 *
 * 使用方法：
 * npx tsx scripts/check-admin-user.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 檢查管理員用戶...\n')

  // 查詢所有用戶
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  })

  if (users.length === 0) {
    console.log('❌ 資料庫中沒有用戶')
    return
  }

  console.log('📋 用戶列表：')
  console.table(users)

  // 查找管理員
  const adminUsers = users.filter(u => u.role === 'ADMIN')
  const lowercaseAdmins = users.filter(u => u.role === 'admin')

  if (adminUsers.length > 0) {
    console.log(`\n✅ 找到 ${adminUsers.length} 個管理員用戶（role = 'ADMIN'）：`)
    adminUsers.forEach(u => console.log(`   - ${u.email} (${u.name})`))
  }

  if (lowercaseAdmins.length > 0) {
    console.log(`\n⚠️  找到 ${lowercaseAdmins.length} 個小寫 admin 用戶（role = 'admin'）：`)
    lowercaseAdmins.forEach(u => console.log(`   - ${u.email} (${u.name})`))

    console.log('\n🔧 正在修復為大寫 ADMIN...')
    for (const user of lowercaseAdmins) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
      })
      console.log(`   ✓ ${user.email} 已更新為 ADMIN`)
    }
  }

  // 如果沒有任何管理員，詢問是否要創建
  if (adminUsers.length === 0 && lowercaseAdmins.length === 0) {
    console.log('\n⚠️  沒有找到管理員用戶！')
    console.log('\n請提供要設為管理員的用戶 email：')
    console.log('或直接在 Prisma Studio 中手動修改用戶的 role 為 ADMIN')
  }

  console.log('\n✅ 檢查完成！')
}

main()
  .catch((e) => {
    console.error('❌ 錯誤：', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
