/**
 * 創建預設管理員帳號腳本
 *
 * 使用方式：
 * pnpm tsx scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 開始創建預設管理員帳號...')

  // 預設管理員資料
  const adminData = {
    phone: '0900000000',
    email: 'admin@shoe.com',
    name: '系統管理員',
    password: await bcrypt.hash('admin123', 12), // 預設密碼：admin123
    role: 'ADMIN',
    membershipTier: 'DIAMOND',
    totalSpent: 0,
  }

  try {
    // 檢查是否已存在
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: adminData.phone },
          { email: adminData.email },
        ],
      },
    })

    if (existingAdmin) {
      console.log('⚠️  管理員帳號已存在')
      console.log(`   手機號碼: ${existingAdmin.phone}`)
      console.log(`   Email: ${existingAdmin.email}`)
      console.log(`   角色: ${existingAdmin.role}`)

      // 更新為管理員（如果不是）
      if (existingAdmin.role !== 'ADMIN') {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: {
            role: 'ADMIN',
            password: adminData.password // 重設密碼
          },
        })
        console.log('✅ 已將帳號升級為管理員並重設密碼')
      }
    } else {
      // 創建新管理員
      const admin = await prisma.user.create({
        data: adminData,
      })

      console.log('✅ 管理員帳號創建成功！')
      console.log('\n📋 登入資訊：')
      console.log(`   帳號: ${admin.phone} 或 ${admin.email}`)
      console.log(`   密碼: admin123`)
      console.log(`   角色: ${admin.role}`)
      console.log('\n⚠️  重要：請在生產環境中立即更改密碼！')
    }
  } catch (error) {
    console.error('❌ 創建管理員失敗:', error)
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
