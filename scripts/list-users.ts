import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n總共有 ${users.length} 個用戶：\n`);

    if (users.length === 0) {
      console.log('❌ 資料庫中沒有任何用戶！');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.role === 'ADMIN' ? '👑' : '👤'} ${user.name || '(無姓名)'}`);
        console.log(`   角色: ${user.role}`);
        console.log(`   手機: ${user.phone || '(無)'}`);
        console.log(`   Email: ${user.email || '(無)'}`);
        console.log(`   創建: ${user.createdAt.toLocaleString('zh-TW')}`);
        console.log('');
      });

      const adminCount = users.filter(u => u.role === 'ADMIN').length;
      console.log(`\n統計：管理員 ${adminCount} 人，一般用戶 ${users.length - adminCount} 人`);
    }

  } catch (error) {
    console.error('❌ 錯誤:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
