import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // 檢查是否已存在
    const existing = await prisma.user.findUnique({
      where: { phone: '0912345678' }
    });

    if (existing) {
      console.log('⚠️  管理員帳號已存在！');
      console.log('- 手機:', existing.phone);
      console.log('- 角色:', existing.role);
      return;
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // 創建管理員（暫時不設置會員等級）
    const admin = await prisma.user.create({
      data: {
        phone: '0912345678',
        email: 'admin@shoestore.com',
        name: '系統管理員',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    console.log('✅ 管理員帳號創建成功！\n');
    console.log('登入資訊：');
    console.log('- 手機號碼: 0912345678');
    console.log('- 密碼: admin123');
    console.log('- 角色:', admin.role);
    console.log('- Email:', admin.email);
    console.log('\n請使用以上資訊登入管理後台。');

  } catch (error) {
    console.error('❌ 創建失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
