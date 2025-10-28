/**
 * 種子資料腳本 - 生成測試資料
 * 執行：pnpm db:seed
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// 生成隨機日期
function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

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
    await prisma.sizeChart.deleteMany()
    await prisma.productVariant.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.brand.deleteMany()
    await prisma.userCoupon.deleteMany()
    await prisma.coupon.deleteMany()
    await prisma.userCredit.deleteMany()
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
      membershipTier: 'DIAMOND',
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
        membershipTier: 'GOLD',
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
        membershipTier: 'SILVER',
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
        membershipTier: 'BRONZE',
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
  // 3. 創建品牌
  // ============================================
  console.log('🏷️  創建品牌...')

  const brands = await Promise.all([
    prisma.brand.create({
      data: {
        name: 'Nike',
        slug: 'nike',
        description: '全球運動品牌領導者，Just Do It',
        logo: '/images/brands/nike.png',
        website: 'https://www.nike.com',
        country: '美國',
        isActive: true,
        isFeatured: true,
        sortOrder: 1,
      },
    }),
    prisma.brand.create({
      data: {
        name: 'Adidas',
        slug: 'adidas',
        description: '德國運動品牌，三條線經典設計',
        logo: '/images/brands/adidas.png',
        website: 'https://www.adidas.com',
        country: '德國',
        isActive: true,
        isFeatured: true,
        sortOrder: 2,
      },
    }),
    prisma.brand.create({
      data: {
        name: 'New Balance',
        slug: 'new-balance',
        description: '美國運動品牌，強調舒適與性能',
        logo: '/images/brands/new-balance.png',
        website: 'https://www.newbalance.com',
        country: '美國',
        isActive: true,
        isFeatured: true,
        sortOrder: 3,
      },
    }),
    prisma.brand.create({
      data: {
        name: 'Converse',
        slug: 'converse',
        description: '經典帆布鞋品牌，Chuck Taylor All Star',
        logo: '/images/brands/converse.png',
        website: 'https://www.converse.com',
        country: '美國',
        isActive: true,
        isFeatured: false,
        sortOrder: 4,
      },
    }),
    prisma.brand.create({
      data: {
        name: 'Puma',
        slug: 'puma',
        description: '德國運動品牌，美洲豹標誌',
        logo: '/images/brands/puma.png',
        website: 'https://www.puma.com',
        country: '德國',
        isActive: true,
        isFeatured: false,
        sortOrder: 5,
      },
    }),
    prisma.brand.create({
      data: {
        name: 'Vans',
        slug: 'vans',
        description: '滑板鞋經典品牌，街頭文化代表',
        logo: '/images/brands/vans.png',
        website: 'https://www.vans.com',
        country: '美國',
        isActive: true,
        isFeatured: false,
        sortOrder: 6,
      },
    }),
  ])

  console.log(`✅ 已創建 ${brands.length} 個品牌`)

  // ============================================
  // 4. 創建分類
  // ============================================
  console.log('📁 創建分類...')

  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: '運動鞋',
        slug: 'sports-shoes',
        description: '專業運動鞋款，適合跑步、籃球、訓練等',
        image: '/images/categories/sports.jpg',
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: '休閒鞋',
        slug: 'casual-shoes',
        description: '日常休閒穿搭，舒適百搭',
        image: '/images/categories/casual.jpg',
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: '帆布鞋',
        slug: 'canvas-shoes',
        description: '經典帆布材質，街頭風格',
        image: '/images/categories/canvas.jpg',
        isActive: true,
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        name: '皮鞋',
        slug: 'leather-shoes',
        description: '正式場合首選，優雅品味',
        image: '/images/categories/leather.jpg',
        isActive: true,
        sortOrder: 4,
      },
    }),
    prisma.category.create({
      data: {
        name: '靴子',
        slug: 'boots',
        description: '秋冬必備，保暖時尚',
        image: '/images/categories/boots.jpg',
        isActive: true,
        sortOrder: 5,
      },
    }),
  ])

  console.log(`✅ 已創建 ${categories.length} 個分類`)

  // ============================================
  // 5. 創建產品（含尺碼表和顏色變體）
  // ============================================
  console.log('👟 創建產品...')

  // 產品 1: Nike Air Max 270
  const product1 = await prisma.product.create({
    data: {
      name: 'Nike Air Max 270',
      slug: 'nike-air-max-270',
      description: 'Nike Air Max 270 以超大氣墊設計，提供全天候舒適體驗。現代感外型搭配經典配色，是都市街頭穿搭的絕佳選擇。',
      price: 4500,
      originalPrice: 5500,
      cost: 2500,
      stock: 150,
      minStock: 10,
      sku: 'NIKE-AM270-001',
      weight: 0.8,
      categoryId: categories[0].id, // 運動鞋
      brandId: brands[0].id, // Nike
      images: JSON.stringify([
        '/images/products/nike-air-max-270-1.jpg',
        '/images/products/nike-air-max-270-2.jpg',
        '/images/products/nike-air-max-270-3.jpg',
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
      gender: 'UNISEX',
      season: '四季',
      heelHeight: 3.2,
      closure: '系帶',
      sole: 'EVA',
      features: JSON.stringify(['氣墊', '透氣', '輕量']),
    },
  })

  // 為 Nike Air Max 270 創建顏色變體
  const product1Variants = await Promise.all([
    prisma.productVariant.create({
      data: {
        productId: product1.id,
        name: 'Air Max 270 - 黑白',
        sku: 'NIKE-AM270-001-BW',
        color: '黑白',
        colorHex: '#000000',
        colorImage: '/images/products/nike-air-max-270-black-white.jpg',
        material: '合成革+網布',
        pattern: '純色',
        priceAdjustment: 0,
        stock: 50,
        attributes: JSON.stringify({ color: '黑白' }),
        isActive: true,
        isDefault: true,
        sortOrder: 1,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: product1.id,
        name: 'Air Max 270 - 藍白',
        sku: 'NIKE-AM270-001-BLW',
        color: '藍白',
        colorHex: '#0066CC',
        colorImage: '/images/products/nike-air-max-270-blue-white.jpg',
        material: '合成革+網布',
        pattern: '純色',
        priceAdjustment: 0,
        stock: 50,
        attributes: JSON.stringify({ color: '藍白' }),
        isActive: true,
        isDefault: false,
        sortOrder: 2,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: product1.id,
        name: 'Air Max 270 - 紅黑',
        sku: 'NIKE-AM270-001-RB',
        color: '紅黑',
        colorHex: '#CC0000',
        colorImage: '/images/products/nike-air-max-270-red-black.jpg',
        material: '合成革+網布',
        pattern: '純色',
        priceAdjustment: 200,
        stock: 50,
        attributes: JSON.stringify({ color: '紅黑' }),
        isActive: true,
        isDefault: false,
        sortOrder: 3,
      },
    }),
  ])

  // 為 Nike Air Max 270 創建尺碼表
  const product1Sizes = await Promise.all([
    // EU 39 = US 7 = UK 6 = 24.5cm
    prisma.sizeChart.create({
      data: {
        productId: product1.id,
        eu: '39',
        us: '7',
        uk: '6',
        cm: '24.5',
        footLength: 24.5,
        footWidth: '標準',
        stock: 15,
        isActive: true,
      },
    }),
    // EU 40 = US 7.5 = UK 6.5 = 25cm
    prisma.sizeChart.create({
      data: {
        productId: product1.id,
        eu: '40',
        us: '7.5',
        uk: '6.5',
        cm: '25',
        footLength: 25.0,
        footWidth: '標準',
        stock: 20,
        isActive: true,
      },
    }),
    // EU 41 = US 8 = UK 7 = 25.5cm
    prisma.sizeChart.create({
      data: {
        productId: product1.id,
        eu: '41',
        us: '8',
        uk: '7',
        cm: '25.5',
        footLength: 25.5,
        footWidth: '標準',
        stock: 25,
        isActive: true,
      },
    }),
    // EU 42 = US 8.5 = UK 7.5 = 26cm
    prisma.sizeChart.create({
      data: {
        productId: product1.id,
        eu: '42',
        us: '8.5',
        uk: '7.5',
        cm: '26',
        footLength: 26.0,
        footWidth: '標準',
        stock: 30,
        isActive: true,
      },
    }),
    // EU 43 = US 9.5 = UK 8.5 = 27cm
    prisma.sizeChart.create({
      data: {
        productId: product1.id,
        eu: '43',
        us: '9.5',
        uk: '8.5',
        cm: '27',
        footLength: 27.0,
        footWidth: '標準',
        stock: 30,
        isActive: true,
      },
    }),
    // EU 44 = US 10 = UK 9 = 27.5cm
    prisma.sizeChart.create({
      data: {
        productId: product1.id,
        eu: '44',
        us: '10',
        uk: '9',
        cm: '27.5',
        footLength: 27.5,
        footWidth: '標準',
        stock: 20,
        isActive: true,
      },
    }),
    // EU 45 = US 11 = UK 10 = 28.5cm
    prisma.sizeChart.create({
      data: {
        productId: product1.id,
        eu: '45',
        us: '11',
        uk: '10',
        cm: '28.5',
        footLength: 28.5,
        footWidth: '標準',
        stock: 10,
        isActive: true,
      },
    }),
  ])

  // 產品 2: Adidas Ultraboost 22
  const product2 = await prisma.product.create({
    data: {
      name: 'Adidas Ultraboost 22',
      slug: 'adidas-ultraboost-22',
      description: 'Adidas Ultraboost 22 搭載最新 Boost 科技，提供絕佳能量回饋。針織鞋面透氣舒適，是跑步愛好者的首選。',
      price: 5200,
      originalPrice: 6200,
      cost: 3000,
      stock: 120,
      minStock: 10,
      sku: 'ADIDAS-UB22-001',
      weight: 0.75,
      categoryId: categories[0].id, // 運動鞋
      brandId: brands[1].id, // Adidas
      images: JSON.stringify([
        '/images/products/adidas-ultraboost-22-1.jpg',
        '/images/products/adidas-ultraboost-22-2.jpg',
      ]),
      isActive: true,
      isFeatured: true,
      sortOrder: 2,
      viewCount: 980,
      soldCount: 67,
      averageRating: 4.7,
      reviewCount: 18,
      favoriteCount: 38,
      shoeType: '跑鞋',
      gender: 'MEN',
      season: '四季',
      heelHeight: 2.8,
      closure: '系帶',
      sole: 'Boost',
      features: JSON.stringify(['能量回饋', '透氣', '抓地力強']),
    },
  })

  // 為 Ultraboost 22 創建尺碼表
  await Promise.all(
    [
      { eu: '40', us: '7.5', uk: '6.5', cm: '25', footLength: 25.0, stock: 15 },
      { eu: '41', us: '8', uk: '7', cm: '25.5', footLength: 25.5, stock: 20 },
      { eu: '42', us: '8.5', uk: '7.5', cm: '26', footLength: 26.0, stock: 25 },
      { eu: '43', us: '9.5', uk: '8.5', cm: '27', footLength: 27.0, stock: 30 },
      { eu: '44', us: '10', uk: '9', cm: '27.5', footLength: 27.5, stock: 20 },
      { eu: '45', us: '11', uk: '10', cm: '28.5', footLength: 28.5, stock: 10 },
    ].map((size) =>
      prisma.sizeChart.create({
        data: {
          productId: product2.id,
          eu: size.eu,
          us: size.us,
          uk: size.uk,
          cm: size.cm,
          footLength: size.footLength,
          footWidth: '標準',
          stock: size.stock,
          isActive: true,
        },
      })
    )
  )

  // 產品 3: New Balance 574
  const product3 = await prisma.product.create({
    data: {
      name: 'New Balance 574',
      slug: 'new-balance-574',
      description: 'New Balance 574 經典復古設計，麂皮與網布拼接，舒適耐穿。百搭外型適合各種場合。',
      price: 3200,
      originalPrice: 3800,
      cost: 1800,
      stock: 200,
      minStock: 15,
      sku: 'NB-574-001',
      weight: 0.7,
      categoryId: categories[1].id, // 休閒鞋
      brandId: brands[2].id, // New Balance
      images: JSON.stringify([
        '/images/products/new-balance-574-1.jpg',
        '/images/products/new-balance-574-2.jpg',
        '/images/products/new-balance-574-3.jpg',
      ]),
      isActive: true,
      isFeatured: true,
      sortOrder: 3,
      viewCount: 1540,
      soldCount: 123,
      averageRating: 4.6,
      reviewCount: 34,
      favoriteCount: 67,
      shoeType: '休閒鞋',
      gender: 'UNISEX',
      season: '四季',
      heelHeight: 2.5,
      closure: '系帶',
      sole: '橡膠',
      features: JSON.stringify(['復古', '舒適', '耐穿']),
    },
  })

  // 為 NB 574 創建顏色變體
  await Promise.all([
    prisma.productVariant.create({
      data: {
        productId: product3.id,
        name: 'NB 574 - 灰色',
        sku: 'NB-574-001-GY',
        color: '灰色',
        colorHex: '#808080',
        material: '麂皮+網布',
        pattern: '純色',
        priceAdjustment: 0,
        stock: 70,
        attributes: JSON.stringify({ color: '灰色' }),
        isActive: true,
        isDefault: true,
        sortOrder: 1,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: product3.id,
        name: 'NB 574 - 海軍藍',
        sku: 'NB-574-001-NB',
        color: '海軍藍',
        colorHex: '#000080',
        material: '麂皮+網布',
        pattern: '純色',
        priceAdjustment: 0,
        stock: 65,
        attributes: JSON.stringify({ color: '海軍藍' }),
        isActive: true,
        isDefault: false,
        sortOrder: 2,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: product3.id,
        name: 'NB 574 - 酒紅色',
        sku: 'NB-574-001-WR',
        color: '酒紅色',
        colorHex: '#722F37',
        material: '麂皮+網布',
        pattern: '純色',
        priceAdjustment: 0,
        stock: 65,
        attributes: JSON.stringify({ color: '酒紅色' }),
        isActive: true,
        isDefault: false,
        sortOrder: 3,
      },
    }),
  ])

  // 為 NB 574 創建尺碼表
  await Promise.all(
    [
      { eu: '38', us: '6.5', uk: '5.5', cm: '24', footLength: 24.0, stock: 20 },
      { eu: '39', us: '7', uk: '6', cm: '24.5', footLength: 24.5, stock: 25 },
      { eu: '40', us: '7.5', uk: '6.5', cm: '25', footLength: 25.0, stock: 30 },
      { eu: '41', us: '8', uk: '7', cm: '25.5', footLength: 25.5, stock: 35 },
      { eu: '42', us: '8.5', uk: '7.5', cm: '26', footLength: 26.0, stock: 40 },
      { eu: '43', us: '9.5', uk: '8.5', cm: '27', footLength: 27.0, stock: 30 },
      { eu: '44', us: '10', uk: '9', cm: '27.5', footLength: 27.5, stock: 15 },
      { eu: '45', us: '11', uk: '10', cm: '28.5', footLength: 28.5, stock: 5 },
    ].map((size) =>
      prisma.sizeChart.create({
        data: {
          productId: product3.id,
          eu: size.eu,
          us: size.us,
          uk: size.uk,
          cm: size.cm,
          footLength: size.footLength,
          footWidth: '標準',
          stock: size.stock,
          isActive: true,
        },
      })
    )
  )

  // 產品 4: Converse Chuck Taylor All Star
  const product4 = await prisma.product.create({
    data: {
      name: 'Converse Chuck Taylor All Star',
      slug: 'converse-chuck-taylor-all-star',
      description: '經典帆布鞋，永不退流行的街頭時尚單品。高筒設計，百搭各種風格。',
      price: 2100,
      originalPrice: 2500,
      cost: 1000,
      stock: 300,
      minStock: 20,
      sku: 'CONV-CT-001',
      weight: 0.6,
      categoryId: categories[2].id, // 帆布鞋
      brandId: brands[3].id, // Converse
      images: JSON.stringify([
        '/images/products/converse-chuck-taylor-1.jpg',
        '/images/products/converse-chuck-taylor-2.jpg',
      ]),
      isActive: true,
      isFeatured: true,
      sortOrder: 4,
      viewCount: 2100,
      soldCount: 189,
      averageRating: 4.8,
      reviewCount: 56,
      favoriteCount: 95,
      shoeType: '帆布鞋',
      gender: 'UNISEX',
      season: '春夏',
      heelHeight: 2.0,
      closure: '系帶',
      sole: '橡膠',
      features: JSON.stringify(['經典', '百搭', '透氣']),
    },
  })

  // 為 Converse 創建顏色變體
  await Promise.all([
    prisma.productVariant.create({
      data: {
        productId: product4.id,
        name: 'Chuck Taylor - 黑色',
        sku: 'CONV-CT-001-BK',
        color: '黑色',
        colorHex: '#000000',
        material: '帆布',
        pattern: '純色',
        priceAdjustment: 0,
        stock: 100,
        attributes: JSON.stringify({ color: '黑色' }),
        isActive: true,
        isDefault: true,
        sortOrder: 1,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: product4.id,
        name: 'Chuck Taylor - 白色',
        sku: 'CONV-CT-001-WH',
        color: '白色',
        colorHex: '#FFFFFF',
        material: '帆布',
        pattern: '純色',
        priceAdjustment: 0,
        stock: 100,
        attributes: JSON.stringify({ color: '白色' }),
        isActive: true,
        isDefault: false,
        sortOrder: 2,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: product4.id,
        name: 'Chuck Taylor - 紅色',
        sku: 'CONV-CT-001-RD',
        color: '紅色',
        colorHex: '#FF0000',
        material: '帆布',
        pattern: '純色',
        priceAdjustment: 0,
        stock: 100,
        attributes: JSON.stringify({ color: '紅色' }),
        isActive: true,
        isDefault: false,
        sortOrder: 3,
      },
    }),
  ])

  // 為 Converse 創建尺碼表
  await Promise.all(
    [
      { eu: '36', us: '5', uk: '3.5', cm: '22.5', footLength: 22.5, stock: 30 },
      { eu: '37', us: '5.5', uk: '4.5', cm: '23', footLength: 23.0, stock: 40 },
      { eu: '38', us: '6.5', uk: '5.5', cm: '24', footLength: 24.0, stock: 50 },
      { eu: '39', us: '7', uk: '6', cm: '24.5', footLength: 24.5, stock: 60 },
      { eu: '40', us: '7.5', uk: '6.5', cm: '25', footLength: 25.0, stock: 50 },
      { eu: '41', us: '8', uk: '7', cm: '25.5', footLength: 25.5, stock: 40 },
      { eu: '42', us: '8.5', uk: '7.5', cm: '26', footLength: 26.0, stock: 20 },
      { eu: '43', us: '9.5', uk: '8.5', cm: '27', footLength: 27.0, stock: 10 },
    ].map((size) =>
      prisma.sizeChart.create({
        data: {
          productId: product4.id,
          eu: size.eu,
          us: size.us,
          uk: size.uk,
          cm: size.cm,
          footLength: size.footLength,
          footWidth: '標準',
          stock: size.stock,
          isActive: true,
        },
      })
    )
  )

  // 產品 5: Vans Old Skool
  const product5 = await prisma.product.create({
    data: {
      name: 'Vans Old Skool',
      slug: 'vans-old-skool',
      description: 'Vans 經典款式，側邊標誌性條紋設計。滑板鞋始祖，街頭潮流必備。',
      price: 2400,
      originalPrice: 2800,
      cost: 1200,
      stock: 180,
      minStock: 15,
      sku: 'VANS-OS-001',
      weight: 0.65,
      categoryId: categories[1].id, // 休閒鞋
      brandId: brands[5].id, // Vans
      images: JSON.stringify([
        '/images/products/vans-old-skool-1.jpg',
        '/images/products/vans-old-skool-2.jpg',
        '/images/products/vans-old-skool-3.jpg',
      ]),
      isActive: true,
      isFeatured: false,
      sortOrder: 5,
      viewCount: 1320,
      soldCount: 98,
      averageRating: 4.5,
      reviewCount: 28,
      favoriteCount: 52,
      shoeType: '滑板鞋',
      gender: 'UNISEX',
      season: '四季',
      heelHeight: 2.2,
      closure: '系帶',
      sole: '橡膠',
      features: JSON.stringify(['經典', '耐磨', '防滑']),
    },
  })

  // 為 Vans 創建尺碼表
  await Promise.all(
    [
      { eu: '38', us: '6.5', uk: '5.5', cm: '24', footLength: 24.0, stock: 20 },
      { eu: '39', us: '7', uk: '6', cm: '24.5', footLength: 24.5, stock: 30 },
      { eu: '40', us: '7.5', uk: '6.5', cm: '25', footLength: 25.0, stock: 35 },
      { eu: '41', us: '8', uk: '7', cm: '25.5', footLength: 25.5, stock: 35 },
      { eu: '42', us: '8.5', uk: '7.5', cm: '26', footLength: 26.0, stock: 30 },
      { eu: '43', us: '9.5', uk: '8.5', cm: '27', footLength: 27.0, stock: 20 },
      { eu: '44', us: '10', uk: '9', cm: '27.5', footLength: 27.5, stock: 10 },
    ].map((size) =>
      prisma.sizeChart.create({
        data: {
          productId: product5.id,
          eu: size.eu,
          us: size.us,
          uk: size.uk,
          cm: size.cm,
          footLength: size.footLength,
          footWidth: '標準',
          stock: size.stock,
          isActive: true,
        },
      })
    )
  )

  console.log('✅ 已創建 5 個產品（含顏色變體和尺碼表）')

  // ============================================
  // 6. 創建優惠券
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
        validUntil: new Date('2025-12-31'),
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
        validUntil: new Date('2025-11-30'),
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
        validUntil: new Date('2025-12-31'),
      },
    }),
  ])

  console.log(`✅ 已創建 ${coupons.length} 個優惠券`)

  // ============================================
  // 7. 創建公告（如果表存在）
  // ============================================
  console.log('📢 創建公告...')

  let announcements: any[] = []
  try {
    announcements = await Promise.all([
      prisma.announcement.create({
        data: {
          title: '🎉 新品上市！Nike Air Max 270 限時優惠',
          content: 'Nike Air Max 270 全新配色上架，現在購買享 9 折優惠！',
          type: 'PROMOTION',
          priority: 10,
          isActive: true,
          startDate: new Date(),
          endDate: new Date('2025-11-30'),
          actionUrl: '/products/nike-air-max-270',
          actionLabel: '立即選購',
        },
      }),
      prisma.announcement.create({
        data: {
          title: '📦 雙 11 購物節即將開始',
          content: '11/11 全館商品最低 5 折起，敬請期待！',
          type: 'INFO',
          priority: 8,
          isActive: true,
          startDate: new Date(),
          endDate: new Date('2025-11-11'),
          actionUrl: '/products',
          actionLabel: '查看商品',
        },
      }),
      prisma.announcement.create({
        data: {
          title: '✅ 系統更新完成',
          content: '購物車與結帳功能已優化，購物體驗更流暢！',
          type: 'SUCCESS',
          priority: 5,
          isActive: true,
          startDate: new Date(),
          endDate: new Date('2025-11-15'),
        },
      }),
    ])
    console.log(`✅ 已創建 ${announcements.length} 個公告`)
  } catch (error) {
    console.log('⚠️  公告表不存在，跳過...')
  }

  // ============================================
  // 8. 創建邀請碼（如果表存在）
  // ============================================
  console.log('🔗 創建邀請碼...')

  let referralCodes: any[] = []
  try {
    referralCodes = await Promise.all([
      prisma.referralCode.create({
        data: {
          userId: users[0].id,
          code: `REF${users[0].id.slice(0, 6).toUpperCase()}`,
          rewardAmount: 100,
          referrerReward: 100,
          isActive: true,
        },
      }),
      prisma.referralCode.create({
        data: {
          userId: users[1].id,
          code: `REF${users[1].id.slice(0, 6).toUpperCase()}`,
          rewardAmount: 100,
          referrerReward: 100,
          isActive: true,
        },
      }),
      prisma.referralCode.create({
        data: {
          userId: admin.id,
          code: `REFADMIN`,
          rewardAmount: 100,
          referrerReward: 100,
          isActive: true,
        },
      }),
    ])
    console.log(`✅ 已創建 ${referralCodes.length} 個邀請碼`)
  } catch (error) {
    console.log('⚠️  邀請碼表不存在，跳過...')
  }

  // ============================================
  // 9. 創建購物金
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
        validUntil: new Date('2025-12-31'),
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
        validUntil: new Date('2025-11-30'),
        isActive: true,
      },
    }),
  ])

  console.log(`✅ 已創建 ${credits.length} 筆購物金`)

  // ============================================
  // 10. 創建社群連結（如果表存在）
  // ============================================
  console.log('🌐 創建社群連結...')

  let socialLinks: any[] = []
  try {
    socialLinks = await Promise.all([
      prisma.socialLink.create({
        data: {
          platform: 'Facebook',
          url: 'https://facebook.com/shoestore',
          label: '追蹤我們的 Facebook',
          icon: 'facebook',
          isActive: true,
          sortOrder: 1,
        },
      }),
      prisma.socialLink.create({
        data: {
          platform: 'Instagram',
          url: 'https://instagram.com/shoestore',
          label: '追蹤我們的 Instagram',
          icon: 'instagram',
          isActive: true,
          sortOrder: 2,
        },
      }),
      prisma.socialLink.create({
        data: {
          platform: 'LINE',
          url: 'https://line.me/ti/p/@shoestore',
          label: '加入 LINE 官方帳號',
          icon: 'line',
          isActive: true,
          sortOrder: 3,
        },
      }),
    ])
    console.log(`✅ 已創建 ${socialLinks.length} 個社群連結`)
  } catch (error) {
    console.log('⚠️  社群連結表不存在，跳過...')
  }

  // ============================================
  // 11. 創建評論
  // ============================================
  console.log('⭐ 創建評論...')

  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        userId: users[0].id,
        productId: product1.id,
        rating: 5,
        title: '非常舒適！',
        content: 'Nike Air Max 270 穿起來非常舒適，氣墊效果很好，推薦購買！',
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
        productId: product3.id,
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
  console.log(`   - 品牌: ${brands.length} 個`)
  console.log(`   - 分類: ${categories.length} 個`)
  console.log(`   - 產品: 5 個（含顏色變體和尺碼表）`)
  console.log(`   - 優惠券: ${coupons.length} 個`)
  console.log(`   - 公告: ${announcements.length} 個（若表存在）`)
  console.log(`   - 邀請碼: ${referralCodes.length} 個（若表存在）`)
  console.log(`   - 購物金: ${credits.length} 筆`)
  console.log(`   - 社群連結: ${socialLinks.length} 個（若表存在）`)
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
