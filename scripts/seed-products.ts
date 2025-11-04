// 商品和分類種子資料
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('開始初始化商品資料...')

  // 1. 建立分類
  console.log('建立分類...')
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'sports' },
      update: {},
      create: {
        name: '運動鞋',
        slug: 'sports',
      }
    }),
    prisma.category.upsert({
      where: { slug: 'casual' },
      update: {},
      create: {
        name: '休閒鞋',
        slug: 'casual',
      }
    }),
    prisma.category.upsert({
      where: { slug: 'formal' },
      update: {},
      create: {
        name: '正裝鞋',
        slug: 'formal',
      }
    }),
    prisma.category.upsert({
      where: { slug: 'boots' },
      update: {},
      create: {
        name: '靴子',
        slug: 'boots',
      }
    }),
  ])

  // 2. 建立商品
  console.log('建立商品...')
  const products = [
    {
      name: 'Nike Air Max 90',
      slug: 'nike-air-max-90',
      description: '經典 Air Max 90 運動鞋，舒適氣墊設計',
      price: '3990',
      originalPrice: '4990',
      images: ['/images/products/nike-air-max-90.jpg'],
      categoryId: categories[0].id, // 運動鞋
      stock: 50,
      soldCount: 156,
      viewCount: 2340,
      averageRating: '4.5',
      reviewCount: 48,
      shoeType: 'SNEAKERS',
      gender: 'UNISEX',
      isActive: true,
    },
    {
      name: 'Adidas Ultra Boost 22',
      slug: 'adidas-ultra-boost-22',
      description: 'Boost 科技緩震跑鞋',
      price: '5990',
      originalPrice: '6990',
      images: ['/images/products/adidas-ultra-boost.jpg'],
      categoryId: categories[0].id, // 運動鞋
      stock: 35,
      soldCount: 89,
      viewCount: 1567,
      averageRating: '4.8',
      reviewCount: 23,
      shoeType: 'SNEAKERS',
      gender: 'UNISEX',
      isActive: true,
    },
    {
      name: 'Converse Chuck Taylor',
      slug: 'converse-chuck-taylor',
      description: '經典帆布鞋',
      price: '1990',
      originalPrice: '2490',
      images: ['/images/products/converse-chuck.jpg'],
      categoryId: categories[1].id, // 休閒鞋
      stock: 100,
      soldCount: 445,
      viewCount: 5678,
      averageRating: '4.3',
      reviewCount: 156,
      shoeType: 'SNEAKERS',
      gender: 'UNISEX',
      isActive: true,
    },
    {
      name: 'Dr. Martens 1460',
      slug: 'dr-martens-1460',
      description: '經典 8 孔馬丁靴',
      price: '6990',
      originalPrice: '7990',
      images: ['/images/products/dr-martens.jpg'],
      categoryId: categories[3].id, // 靴子
      stock: 25,
      soldCount: 67,
      viewCount: 1234,
      averageRating: '4.7',
      reviewCount: 34,
      shoeType: 'BOOTS',
      gender: 'UNISEX',
      isActive: true,
    },
    {
      name: 'Clarks Desert Boot',
      slug: 'clarks-desert-boot',
      description: '經典沙漠靴',
      price: '4990',
      originalPrice: '5990',
      images: ['/images/products/clarks-desert.jpg'],
      categoryId: categories[1].id, // 休閒鞋
      stock: 40,
      soldCount: 234,
      viewCount: 3456,
      averageRating: '4.6',
      reviewCount: 67,
      shoeType: 'BOOTS',
      gender: 'MEN',
      isActive: true,
    },
    {
      name: 'Oxford 皮鞋',
      slug: 'oxford-leather-shoes',
      description: '商務正裝皮鞋',
      price: '3990',
      originalPrice: null,
      images: ['/images/products/oxford.jpg'],
      categoryId: categories[2].id, // 正裝鞋
      stock: 30,
      soldCount: 123,
      viewCount: 890,
      averageRating: '4.4',
      reviewCount: 12,
      shoeType: 'DRESS_SHOES',
      gender: 'MEN',
      isActive: true,
    },
    {
      name: 'New Balance 574',
      slug: 'new-balance-574',
      description: '經典復古運動鞋',
      price: '2990',
      originalPrice: '3490',
      images: ['/images/products/nb-574.jpg'],
      categoryId: categories[0].id, // 運動鞋
      stock: 60,
      soldCount: 567,
      viewCount: 7890,
      averageRating: '4.5',
      reviewCount: 89,
      shoeType: 'SNEAKERS',
      gender: 'UNISEX',
      isActive: true,
    },
    {
      name: 'Vans Old Skool',
      slug: 'vans-old-skool',
      description: '經典滑板鞋',
      price: '2490',
      originalPrice: '2990',
      images: ['/images/products/vans-old-skool.jpg'],
      categoryId: categories[1].id, // 休閒鞋
      stock: 80,
      soldCount: 890,
      viewCount: 9876,
      averageRating: '4.6',
      reviewCount: 234,
      shoeType: 'SNEAKERS',
      gender: 'UNISEX',
      isActive: true,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    })
  }

  // 3. 建立限時搶購配置和產品
  console.log('建立限時搶購配置...')

  // 選擇前 4 個商品作為限時搶購商品
  const flashSaleProducts = await prisma.product.findMany({
    take: 4,
    orderBy: { soldCount: 'desc' }
  })

  // 準備產品配置的 JSON 資料
  const flashSaleProductsConfig = flashSaleProducts.map((product, index) => ({
    productId: product.id,
    discountPercentage: 50,
    discountPrice: Math.floor(parseFloat(product.price.toString()) * 0.5),
    stock: 10,
    soldCount: 0,
    sortOrder: index + 1
  }))

  const flashSaleConfig = await prisma.flashSaleConfig.upsert({
    where: { id: 'default-flash-sale' },
    update: {
      name: '限時搶購 - 2小時特賣',
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2小時後
      products: flashSaleProductsConfig,
      maxProducts: 6,
      isActive: true,
    },
    create: {
      id: 'default-flash-sale',
      name: '限時搶購 - 2小時特賣',
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      products: flashSaleProductsConfig,
      maxProducts: 6,
      isActive: true,
    },
  })

  // 4. 建立熱門產品配置
  console.log('建立熱門產品配置...')

  // 選擇銷量前 6 的商品作為熱門產品
  const popularProducts = await prisma.product.findMany({
    take: 6,
    orderBy: { viewCount: 'desc' }
  })

  // 準備產品 ID 列表
  const popularProductIds = popularProducts.map(p => p.id)

  await prisma.popularProductsConfig.upsert({
    where: { id: 'default-popular' },
    update: {
      title: '人氣精選',
      subtitle: '大家都在買',
      algorithm: 'MANUAL', // 手動選擇
      productIds: popularProductIds,
      maxProducts: 8,
      isActive: true,
    },
    create: {
      id: 'default-popular',
      title: '人氣精選',
      subtitle: '大家都在買',
      algorithm: 'MANUAL',
      productIds: popularProductIds,
      maxProducts: 8,
      isActive: true,
    },
  })

  console.log('✅ 商品資料初始化完成！')
  console.log(`- 建立了 ${categories.length} 個分類`)
  console.log(`- 建立了 ${products.length} 個商品`)
  console.log(`- 設定了 ${flashSaleProducts.length} 個限時搶購商品`)
  console.log(`- 設定了 ${popularProducts.length} 個熱門商品`)
}

main()
  .catch((e) => {
    console.error('初始化失敗:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })