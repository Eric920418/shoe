/**
 * 設定管理員密碼腳本
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 設定管理員密碼...')

  const phone = '0912345678' // 現有管理員手機號碼
  const newPassword = 'admin123' // 新密碼

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    const user = await prisma.user.update({
      where: { phone },
      data: {
        password: hashedPassword,
        role: 'ADMIN', // 確保是管理員
      },
    })

    console.log('✅ 管理員密碼設定成功！')
    console.log('\n📋 登入資訊：')
    console.log(`   帳號: ${user.phone} 或 ${user.email}`)
    console.log(`   密碼: ${newPassword}`)
    console.log(`   角色: ${user.role}`)
    console.log('\n⚠️  重要：請在生產環境中立即更改密碼！')
  } catch (error) {
    console.error('❌ 設定密碼失敗:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
