/**
 * 種子資料腳本 - 生成測試資料
 * 執行：pnpm db:seed
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 開始生成種子資料...')

  // ============================================
  // 1. 清空現有資料（開發用）
  // ============================================
  console.log('🗑️  清空現有資料...')

  // 按照依賴順序刪除資料（只刪除存在的表）
  try {
    await prisma.cartItem.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.review.deleteMany()
    await prisma.productSku.deleteMany()
    await prisma.sizeChart.deleteMany()
    await prisma.productVariant.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.userCoupon.deleteMany()
    await prisma.coupon.deleteMany()
    await prisma.userCredit.deleteMany()
    await prisma.referralUsage.deleteMany()
    await prisma.referralCode.deleteMany()
    await prisma.address.deleteMany()
    await prisma.user.deleteMany()
  } catch (error) {
    console.log('⚠️  部分表不存在，跳過...')
  }

  console.log('✅ 資料已清空')

  // ============================================
  // 2. 創建測試用戶
  // ============================================
  console.log('👤 創建測試用戶...')

  const hashedPassword = await bcrypt.hash('password123', 12)

  // 管理員帳號
  const admin = await prisma.user.create({
    data: {
      email: 'admin@shoe.com',
      phone: '0912345678',
      password: hashedPassword,
      name: '系統管理員',
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      membershipPoints: 10000,
      totalSpent: 250000,
      totalOrders: 15,
      isFirstTimeBuyer: false,
      firstPurchaseAt: new Date('2024-01-15'),
    },
  })

  // 一般用戶
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'user1@example.com',
        phone: '0923456789',
        password: hashedPassword,
        name: '張小明',
        role: 'USER',
        isActive: true,
        membershipPoints: 3500,
        totalSpent: 65000,
        totalOrders: 8,
        isFirstTimeBuyer: false,
        firstPurchaseAt: new Date('2024-03-10'),
      },
    }),
    prisma.user.create({
      data: {
        email: 'user2@example.com',
        phone: '0934567890',
        password: hashedPassword,
        name: '李小華',
        role: 'USER',
        isActive: true,
        membershipPoints: 1200,
        totalSpent: 25000,
        totalOrders: 3,
        isFirstTimeBuyer: false,
        firstPurchaseAt: new Date('2024-06-20'),
      },
    }),
    prisma.user.create({
      data: {
        email: 'user3@example.com',
        phone: '0945678901',
        password: hashedPassword,
        name: '王大明',
        role: 'USER',
        isActive: true,
        membershipPoints: 500,
        totalSpent: 5000,
        totalOrders: 1,
        isFirstTimeBuyer: false,
        firstPurchaseAt: new Date('2024-09-01'),
      },
    }),
  ])

  console.log(`✅ 已創建 ${users.length + 1} 個用戶（含 1 個管理員）`)

  // ============================================
  // 3. 創建分類
  // ============================================
  console.log('📁 創建分類...')

  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: '運動鞋',
        slug: 'sports-shoes',
        image: '/images/categories/sports.jpg',
        isActive: true,
        sortOrder: 1,
        mainCategory: 'OTHER',
      },
    }),
    prisma.category.create({
      data: {
        name: '休閒鞋',
        slug: 'casual-shoes',
        image: '/images/categories/casual.jpg',
        isActive: true,
        sortOrder: 2,
        mainCategory: 'OTHER',
      },
    }),
    prisma.category.create({
      data: {
        name: '帆布鞋',
        slug: 'canvas-shoes',
        image: '/images/categories/canvas.jpg',
        isActive: true,
        sortOrder: 3,
        mainCategory: 'OTHER',
      },
    }),
    prisma.category.create({
      data: {
        name: '皮鞋',
        slug: 'leather-shoes',
        image: '/images/categories/leather.jpg',
        isActive: true,
        sortOrder: 4,
        mainCategory: 'MEN_KIDS',
      },
    }),
    prisma.category.create({
      data: {
        name: '靴子',
        slug: 'boots',
        image: '/images/categories/boots.jpg',
        isActive: true,
        sortOrder: 5,
        mainCategory: 'WOMEN',
      },
    }),
  ])

  console.log(`✅ 已創建 ${categories.length} 個分類`)

  // ============================================
  // 4. 創建產品（含尺碼表和顏色變體）
  // ============================================
  console.log('👟 創建產品...')

  // 產品 1: Nike Air Max 90
  const product1 = await prisma.product.create({
    data: {
      name: 'Nike Air Max 90',
      slug: 'nike-air-max-90',
      description: 'Nike Air Max 90 經典款式，提供全天候舒適體驗。',
      price: 4500,
      originalPrice: 5500,
      cost: 2500,
      stock: 150,
      minStock: 10,
      weight: 0.8,
      categoryId: categories[0].id,
      images: JSON.stringify([
        '/images/products/nike-air-max-90-1.jpg',
        '/images/products/nike-air-max-90-2.jpg',
      ]),
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
      viewCount: 1250,
      soldCount: 89,
      averageRating: 4.5,
      reviewCount: 23,
      favoriteCount: 45,
      shoeType: '運動鞋',
      genders: ['UNISEX'],
      season: '四季',
      heelHeight: 3.2,
      closure: '系帶',
      sole: 'EVA',
      features: JSON.stringify(['氣墊', '透氣', '輕量']),
    },
  })

  // 為產品1創建顏色變體
  const product1Variant = await prisma.productVariant.create({
    data: {
      productId: product1.id,
      name: 'Air Max 90 - 黑白',
      color: '黑白',
      colorHex: '#000000',
      material: '合成革+網布',
      pattern: '純色',
      priceAdjustment: 0,
      stock: 50,
      attributes: JSON.stringify({ color: '黑白' }),
      isActive: true,
      isDefault: true,
      sortOrder: 1,
    },
  })

  // 為產品1創建尺碼表（簡化版）
  const product1Sizes = await Promise.all(
    ['39', '40', '41', '42', '43', '44', '45'].map((size, index) =>
      prisma.sizeChart.create({
        data: {
          productId: product1.id,
          size: size,
          sortOrder: index + 1,
          isActive: true,
        },
      })
    )
  )

  // 為每個尺碼創建 SKU
  await Promise.all(
    product1Sizes.map((sizeChart) =>
      prisma.productSku.create({
        data: {
          productId: product1.id,
          variantId: product1Variant.id,
          sizeChartId: sizeChart.id,
          stock: 20,
          isActive: true,
        },
      })
    )
  )

  // 產品 2: Adidas Ultra Boost 22
  const product2 = await prisma.product.create({
    data: {
      name: 'Adidas Ultra Boost 22',
      slug: 'adidas-ultra-boost-22',
      description: 'Adidas Ultraboost 22 搭載最新 Boost 科技。',
      price: 5200,
      originalPrice: 6200,
      cost: 3000,
      stock: 120,
      minStock: 10,
      weight: 0.75,
      categoryId: categories[0].id,
      images: JSON.stringify(['/images/products/adidas-ultraboost-22-1.jpg']),
      isActive: true,
      isFeatured: true,
      sortOrder: 2,
      viewCount: 980,
      soldCount: 67,
      averageRating: 4.7,
      reviewCount: 18,
      favoriteCount: 38,
      shoeType: '跑鞋',
      genders: ['UNISEX'],
      season: '四季',
      heelHeight: 2.8,
      closure: '系帶',
      sole: 'Boost',
      features: JSON.stringify(['能量回饋', '透氣', '抓地力強']),
    },
  })

  const product2Variant = await prisma.productVariant.create({
    data: {
      productId: product2.id,
      name: 'Ultra Boost 22 - 白色',
      color: '白色',
      colorHex: '#FFFFFF',
      material: '針織',
      priceAdjustment: 0,
      stock: 60,
      attributes: JSON.stringify({ color: '白色' }),
      isActive: true,
      isDefault: true,
      sortOrder: 1,
    },
  })

  const product2Sizes = await Promise.all(
    ['40', '41', '42', '43', '44', '45'].map((size, index) =>
      prisma.sizeChart.create({
        data: {
          productId: product2.id,
          size: size,
          sortOrder: index + 1,
          isActive: true,
        },
      })
    )
  )

  await Promise.all(
    product2Sizes.map((sizeChart) =>
      prisma.productSku.create({
        data: {
          productId: product2.id,
          variantId: product2Variant.id,
          sizeChartId: sizeChart.id,
          stock: 20,
          isActive: true,
        },
      })
    )
  )

  // 產品 3: Oxford 皮鞋
  const product3 = await prisma.product.create({
    data: {
      name: 'Oxford 皮鞋',
      slug: 'oxford-leather-shoes',
      description: '經典牛津皮鞋，正式場合首選。',
      price: 3800,
      originalPrice: 4500,
      cost: 2000,
      stock: 80,
      minStock: 5,
      weight: 0.9,
      categoryId: categories[3].id,
      images: JSON.stringify(['/images/products/oxford-1.jpg']),
      isActive: true,
      isFeatured: false,
      sortOrder: 3,
      viewCount: 560,
      soldCount: 34,
      averageRating: 4.6,
      reviewCount: 12,
      favoriteCount: 23,
      shoeType: '皮鞋',
      genders: ['MEN'],
      season: '四季',
      heelHeight: 2.5,
      closure: '系帶',
      sole: '皮底',
      features: JSON.stringify(['正式', '透氣', '耐穿']),
    },
  })

  const product3Variant = await prisma.productVariant.create({
    data: {
      productId: product3.id,
      name: 'Oxford - 黑色',
      color: '黑色',
      colorHex: '#000000',
      material: '真皮',
      priceAdjustment: 0,
      stock: 40,
      attributes: JSON.stringify({ color: '黑色' }),
      isActive: true,
      isDefault: true,
      sortOrder: 1,
    },
  })

  const product3Sizes = await Promise.all(
    ['40', '41', '42', '43', '44'].map((size, index) =>
      prisma.sizeChart.create({
        data: {
          productId: product3.id,
          size: size,
          sortOrder: index + 1,
          isActive: true,
        },
      })
    )
  )

  await Promise.all(
    product3Sizes.map((sizeChart) =>
      prisma.productSku.create({
        data: {
          productId: product3.id,
          variantId: product3Variant.id,
          sizeChartId: sizeChart.id,
          stock: 16,
          isActive: true,
        },
      })
    )
  )

  // 產品 4: Dr. Martens 1460
  const product4 = await prisma.product.create({
    data: {
      name: 'Dr. Martens 1460',
      slug: 'dr-martens-1460',
      description: '經典馬汀靴，耐穿百搭。',
      price: 5500,
      originalPrice: 6500,
      cost: 3200,
      stock: 100,
      minStock: 8,
      weight: 1.2,
      categoryId: categories[4].id,
      images: JSON.stringify(['/images/products/dr-martens-1460-1.jpg']),
      isActive: true,
      isFeatured: true,
      sortOrder: 4,
      viewCount: 1800,
      soldCount: 145,
      averageRating: 4.8,
      reviewCount: 45,
      favoriteCount: 89,
      shoeType: '靴子',
      genders: ['UNISEX'],
      season: '秋冬',
      heelHeight: 3.0,
      closure: '系帶',
      sole: '氣墊',
      features: JSON.stringify(['經典', '耐穿', '防滑']),
    },
  })

  const product4Variant = await prisma.productVariant.create({
    data: {
      productId: product4.id,
      name: 'Dr. Martens 1460 - 黑色',
      color: '黑色',
      colorHex: '#000000',
      material: '真皮',
      priceAdjustment: 0,
      stock: 50,
      attributes: JSON.stringify({ color: '黑色' }),
      isActive: true,
      isDefault: true,
      sortOrder: 1,
    },
  })

  const product4Sizes = await Promise.all(
    ['36', '37', '38', '39', '40', '41', '42', '43', '44'].map((size, index) =>
      prisma.sizeChart.create({
        data: {
          productId: product4.id,
          size: size,
          sortOrder: index + 1,
          isActive: true,
        },
      })
    )
  )

  await Promise.all(
    product4Sizes.map((sizeChart) =>
      prisma.productSku.create({
        data: {
          productId: product4.id,
          variantId: product4Variant.id,
          sizeChartId: sizeChart.id,
          stock: 11,
          isActive: true,
        },
      })
    )
  )

  // 產品 5: Clarks Desert Boot
  const product5 = await prisma.product.create({
    data: {
      name: 'Clarks Desert Boot',
      slug: 'clarks-desert-boot',
      description: 'Clarks 沙漠靴，經典設計。',
      price: 4200,
      originalPrice: 4800,
      cost: 2400,
      stock: 60,
      minStock: 5,
      weight: 0.85,
      categoryId: categories[4].id,
      images: JSON.stringify(['/images/products/clarks-desert-boot-1.jpg']),
      isActive: true,
      isFeatured: false,
      sortOrder: 5,
      viewCount: 720,
      soldCount: 42,
      averageRating: 4.5,
      reviewCount: 15,
      favoriteCount: 28,
      shoeType: '靴子',
      genders: ['MEN'],
      season: '四季',
      heelHeight: 2.0,
      closure: '系帶',
      sole: '橡膠',
      features: JSON.stringify(['經典', '舒適', '百搭']),
    },
  })

  const product5Variant = await prisma.productVariant.create({
    data: {
      productId: product5.id,
      name: 'Desert Boot - 沙色',
      color: '沙色',
      colorHex: '#C2B280',
      material: '麂皮',
      priceAdjustment: 0,
      stock: 30,
      attributes: JSON.stringify({ color: '沙色' }),
      isActive: true,
      isDefault: true,
      sortOrder: 1,
    },
  })

  const product5Sizes = await Promise.all(
    ['40', '41', '42', '43', '44'].map((size, index) =>
      prisma.sizeChart.create({
        data: {
          productId: product5.id,
          size: size,
          sortOrder: index + 1,
          isActive: true,
        },
      })
    )
  )

  await Promise.all(
    product5Sizes.map((sizeChart) =>
      prisma.productSku.create({
        data: {
          productId: product5.id,
          variantId: product5Variant.id,
          sizeChartId: sizeChart.id,
          stock: 12,
          isActive: true,
        },
      })
    )
  )

  // 產品 6: New Balance 574
  const product6 = await prisma.product.create({
    data: {
      name: 'New Balance 574',
      slug: 'new-balance-574',
      description: 'New Balance 574 經典復古設計。',
      price: 3200,
      originalPrice: 3800,
      cost: 1800,
      stock: 200,
      minStock: 15,
      weight: 0.7,
      categoryId: categories[1].id,
      images: JSON.stringify(['/images/products/new-balance-574-1.jpg']),
      isActive: true,
      isFeatured: true,
      sortOrder: 6,
      viewCount: 1540,
      soldCount: 123,
      averageRating: 4.6,
      reviewCount: 34,
      favoriteCount: 67,
      shoeType: '休閒鞋',
      genders: ['UNISEX'],
      season: '四季',
      heelHeight: 2.5,
      closure: '系帶',
      sole: '橡膠',
      features: JSON.stringify(['復古', '舒適', '耐穿']),
    },
  })

  const product6Variant = await prisma.productVariant.create({
    data: {
      productId: product6.id,
      name: 'NB 574 - 灰色',
      color: '灰色',
      colorHex: '#808080',
      material: '麂皮+網布',
      priceAdjustment: 0,
      stock: 100,
      attributes: JSON.stringify({ color: '灰色' }),
      isActive: true,
      isDefault: true,
      sortOrder: 1,
    },
  })

  const product6Sizes = await Promise.all(
    ['38', '39', '40', '41', '42', '43', '44', '45'].map((size, index) =>
      prisma.sizeChart.create({
        data: {
          productId: product6.id,
          size: size,
          sortOrder: index + 1,
          isActive: true,
        },
      })
    )
  )

  await Promise.all(
    product6Sizes.map((sizeChart) =>
      prisma.productSku.create({
        data: {
          productId: product6.id,
          variantId: product6Variant.id,
          sizeChartId: sizeChart.id,
          stock: 25,
          isActive: true,
        },
      })
    )
  )

  // 產品 7: Vans Old Skool
  const product7 = await prisma.product.create({
    data: {
      name: 'Vans Old Skool',
      slug: 'vans-old-skool',
      description: 'Vans 經典款式，街頭潮流必備。',
      price: 2400,
      originalPrice: 2800,
      cost: 1200,
      stock: 180,
      minStock: 15,
      weight: 0.65,
      categoryId: categories[1].id,
      images: JSON.stringify(['/images/products/vans-old-skool-1.jpg']),
      isActive: true,
      isFeatured: false,
      sortOrder: 7,
      viewCount: 1320,
      soldCount: 98,
      averageRating: 4.5,
      reviewCount: 28,
      favoriteCount: 52,
      shoeType: '滑板鞋',
      genders: ['UNISEX'],
      season: '四季',
      heelHeight: 2.2,
      closure: '系帶',
      sole: '橡膠',
      features: JSON.stringify(['經典', '耐磨', '防滑']),
    },
  })

  const product7Variant = await prisma.productVariant.create({
    data: {
      productId: product7.id,
      name: 'Old Skool - 黑白',
      color: '黑白',
      colorHex: '#000000',
      material: '帆布+皮革',
      priceAdjustment: 0,
      stock: 90,
      attributes: JSON.stringify({ color: '黑白' }),
      isActive: true,
      isDefault: true,
      sortOrder: 1,
    },
  })

  const product7Sizes = await Promise.all(
    ['38', '39', '40', '41', '42', '43', '44'].map((size, index) =>
      prisma.sizeChart.create({
        data: {
          productId: product7.id,
          size: size,
          sortOrder: index + 1,
          isActive: true,
        },
      })
    )
  )

  await Promise.all(
    product7Sizes.map((sizeChart) =>
      prisma.productSku.create({
        data: {
          productId: product7.id,
          variantId: product7Variant.id,
          sizeChartId: sizeChart.id,
          stock: 26,
          isActive: true,
        },
      })
    )
  )

  // 產品 8: Converse Chuck Taylor
  const product8 = await prisma.product.create({
    data: {
      name: 'Converse Chuck Taylor',
      slug: 'converse-chuck-taylor',
      description: '經典帆布鞋，永不退流行。',
      price: 2100,
      originalPrice: 2500,
      cost: 1000,
      stock: 300,
      minStock: 20,
      weight: 0.6,
      categoryId: categories[2].id,
      images: JSON.stringify(['/images/products/converse-chuck-taylor-1.jpg']),
      isActive: true,
      isFeatured: true,
      sortOrder: 8,
      viewCount: 2100,
      soldCount: 189,
      averageRating: 4.8,
      reviewCount: 56,
      favoriteCount: 95,
      shoeType: '帆布鞋',
      genders: ['UNISEX'],
      season: '春夏',
      heelHeight: 2.0,
      closure: '系帶',
      sole: '橡膠',
      features: JSON.stringify(['經典', '百搭', '透氣']),
    },
  })

  const product8Variant = await prisma.productVariant.create({
    data: {
      productId: product8.id,
      name: 'Chuck Taylor - 黑色',
      color: '黑色',
      colorHex: '#000000',
      material: '帆布',
      priceAdjustment: 0,
      stock: 150,
      attributes: JSON.stringify({ color: '黑色' }),
      isActive: true,
      isDefault: true,
      sortOrder: 1,
    },
  })

  const product8Sizes = await Promise.all(
    ['36', '37', '38', '39', '40', '41', '42', '43'].map((size, index) =>
      prisma.sizeChart.create({
        data: {
          productId: product8.id,
          size: size,
          sortOrder: index + 1,
          isActive: true,
        },
      })
    )
  )

  await Promise.all(
    product8Sizes.map((sizeChart) =>
      prisma.productSku.create({
        data: {
          productId: product8.id,
          variantId: product8Variant.id,
          sizeChartId: sizeChart.id,
          stock: 38,
          isActive: true,
        },
      })
    )
  )

  console.log('✅ 已創建 8 個產品（含顏色變體、尺碼表和 SKU）')

  // ============================================
  // 5. 創建優惠券
  // ============================================
  console.log('🎟️  創建優惠券...')

  const coupons = await Promise.all([
    prisma.coupon.create({
      data: {
        code: 'WELCOME100',
        name: '新會員優惠',
        description: '新會員註冊即享 100 元折扣',
        type: 'FIXED',
        value: 100,
        minAmount: 1000,
        usageLimit: 1000,
        usedCount: 0,
        isActive: true,
        isPublic: true,
        validFrom: new Date(),
        validUntil: new Date('2026-12-31'),
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'SALE20',
        name: '全館 8 折',
        description: '全館商品享 8 折優惠',
        type: 'PERCENTAGE',
        value: 20,
        minAmount: 2000,
        maxDiscount: 1000,
        usageLimit: 500,
        usedCount: 0,
        isActive: true,
        isPublic: true,
        validFrom: new Date(),
        validUntil: new Date('2026-11-30'),
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'FREESHIP',
        name: '免運費',
        description: '消費滿 1500 元免運費',
        type: 'FREE_SHIPPING',
        value: 0,
        minAmount: 1500,
        usageLimit: null,
        usedCount: 0,
        isActive: true,
        isPublic: true,
        validFrom: new Date(),
        validUntil: new Date('2026-12-31'),
      },
    }),
  ])

  console.log(`✅ 已創建 ${coupons.length} 個優惠券`)

  // ============================================
  // 6. 創建公告
  // ============================================
  console.log('📢 創建公告...')

  const announcements = await Promise.all([
    prisma.announcement.create({
      data: {
        title: '新品上市！限時優惠',
        content: '全新配色上架，現在購買享 9 折優惠！',
        type: 'PROMOTION',
        priority: 10,
        isActive: true,
        startDate: new Date(),
        endDate: new Date('2026-11-30'),
        actionUrl: '/products',
        actionLabel: '立即選購',
      },
    }),
    prisma.announcement.create({
      data: {
        title: '購物節即將開始',
        content: '全館商品最低 5 折起，敬請期待！',
        type: 'INFO',
        priority: 8,
        isActive: true,
        startDate: new Date(),
        endDate: new Date('2026-11-11'),
        actionUrl: '/products',
        actionLabel: '查看商品',
      },
    }),
  ])

  console.log(`✅ 已創建 ${announcements.length} 個公告`)

  // ============================================
  // 7. 創建邀請碼
  // ============================================
  console.log('🔗 創建邀請碼...')

  const referralCodes = await Promise.all([
    prisma.referralCode.create({
      data: {
        userId: users[0].id,
        code: `USER1${Date.now().toString(36).slice(-4).toUpperCase()}`,
        isActive: true,
      },
    }),
    prisma.referralCode.create({
      data: {
        userId: users[1].id,
        code: `USER2${Date.now().toString(36).slice(-4).toUpperCase()}`,
        isActive: true,
      },
    }),
    prisma.referralCode.create({
      data: {
        userId: admin.id,
        code: `ADMIN${Date.now().toString(36).slice(-4).toUpperCase()}`,
        isActive: true,
      },
    }),
  ])

  console.log(`✅ 已創建 ${referralCodes.length} 個邀請碼`)

  // ============================================
  // 8. 創建購物金
  // ============================================
  console.log('💰 創建購物金...')

  const credits = await Promise.all([
    prisma.userCredit.create({
      data: {
        userId: users[0].id,
        amount: 500,
        balance: 500,
        source: 'ADMIN_GRANT',
        validFrom: new Date(),
        validUntil: new Date('2026-12-31'),
        isActive: true,
      },
    }),
    prisma.userCredit.create({
      data: {
        userId: users[1].id,
        amount: 200,
        balance: 200,
        source: 'CAMPAIGN',
        validFrom: new Date(),
        validUntil: new Date('2026-11-30'),
        isActive: true,
      },
    }),
  ])

  console.log(`✅ 已創建 ${credits.length} 筆購物金`)

  // ============================================
  // 9. 創建評論
  // ============================================
  console.log('⭐ 創建評論...')

  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        userId: users[0].id,
        productId: product1.id,
        rating: 5,
        title: '非常舒適！',
        content: 'Nike Air Max 90 穿起來非常舒適，氣墊效果很好，推薦購買！',
        verified: true,
        isApproved: true,
        isPublic: true,
        sizeFit: 'TRUE_TO_SIZE',
        boughtSize: '42',
      },
    }),
    prisma.review.create({
      data: {
        userId: users[1].id,
        productId: product1.id,
        rating: 4,
        title: '外觀好看',
        content: '顏色很漂亮，但尺碼偏大一點點，建議選小半號。',
        verified: true,
        isApproved: true,
        isPublic: true,
        sizeFit: 'SLIGHTLY_LARGE',
        boughtSize: '40',
      },
    }),
    prisma.review.create({
      data: {
        userId: users[0].id,
        productId: product6.id,
        rating: 5,
        title: '經典款式',
        content: 'New Balance 574 真的很經典，穿搭百搭，品質也很好！',
        verified: true,
        isApproved: true,
        isPublic: true,
        sizeFit: 'TRUE_TO_SIZE',
        boughtSize: '41',
      },
    }),
  ])

  console.log(`✅ 已創建 ${reviews.length} 則評論`)

  // ============================================
  // 完成
  // ============================================
  console.log('\n🎉 種子資料生成完成！\n')
  console.log('📊 統計：')
  console.log(`   - 用戶: ${users.length + 1} 個（含 1 個管理員）`)
  console.log(`   - 分類: ${categories.length} 個`)
  console.log(`   - 產品: 8 個（含顏色變體、尺碼表和 SKU）`)
  console.log(`   - 優惠券: ${coupons.length} 個`)
  console.log(`   - 公告: ${announcements.length} 個`)
  console.log(`   - 邀請碼: ${referralCodes.length} 個`)
  console.log(`   - 購物金: ${credits.length} 筆`)
  console.log(`   - 評論: ${reviews.length} 則`)
  console.log('\n🔑 測試帳號：')
  console.log('   管理員: admin@shoe.com / password123')
  console.log('   用戶1: user1@example.com / password123')
  console.log('   用戶2: user2@example.com / password123')
  console.log('   用戶3: user3@example.com / password123')
  console.log('\n✅ 可以開始人工測試了！')
}

main()
  .catch((e) => {
    console.error('❌ 種子資料生成失敗:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
