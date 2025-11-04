import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    // 查詢該手機號碼的用戶
    const user = await prisma.user.findUnique({
      where: { phone: '0912345678' }
    });

    if (!user) {
      console.log('❌ 用戶不存在！手機號碼：0912345678');
      console.log('\n建議：需要創建新的管理員帳號');
      return;
    }

    console.log('✅ 找到用戶：');
    console.log('- ID:', user.id);
    console.log('- 手機:', user.phone);
    console.log('- Email:', user.email);
    console.log('- 姓名:', user.name);
    console.log('- 角色:', user.role);
    console.log('- 創建時間:', user.createdAt);

    // 檢查密碼
    const isPasswordCorrect = await bcrypt.compare('admin123', user.password);
    console.log('\n密碼驗證:', isPasswordCorrect ? '✅ 正確' : '❌ 錯誤');

    // 檢查角色
    if (user.role !== 'ADMIN') {
      console.log('\n⚠️  警告：此用戶不是管理員！當前角色:', user.role);
    }

  } catch (error) {
    console.error('❌ 錯誤:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
