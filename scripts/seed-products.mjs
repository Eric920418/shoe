import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 測試產品資料
const testProducts = [
  // Nike 系列
  { name: 'Nike Air Max 90', brand: 'Nike', price: 3990, originalPrice: 4990, category: '運動鞋', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500' },
  { name: 'Nike Air Force 1', brand: 'Nike', price: 3290, originalPrice: 4290, category: '運動鞋', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500' },
  { name: 'Nike React Infinity', brand: 'Nike', price: 4590, originalPrice: 5990, category: '運動鞋', image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500' },
  { name: 'Nike Blazer Mid 77', brand: 'Nike', price: 3190, originalPrice: 3990, category: '休閒鞋', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500' },

  // Adidas 系列
  { name: 'Adidas Ultraboost 21', brand: 'Adidas', price: 4990, originalPrice: 6990, category: '運動鞋', image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500' },
  { name: 'Adidas Stan Smith', brand: 'Adidas', price: 2490, originalPrice: 2990, category: '休閒鞋', image: 'https://images.unsplash.com/photo-1470116945706-e6bf5d5a53ca?w=500' },
  { name: 'Adidas Superstar', brand: 'Adidas', price: 2790, originalPrice: 3290, category: '休閒鞋', image: 'https://images.unsplash.com/photo-1612902376453-14d82d7d0d9c?w=500' },
  { name: 'Adidas NMD R1', brand: 'Adidas', price: 3890, originalPrice: 4890, category: '運動鞋', image: 'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=500' },

  // New Balance 系列
  { name: 'New Balance 530', brand: 'New Balance', price: 2990, originalPrice: 3990, category: '休閒鞋', image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=500' },
  { name: 'New Balance 327', brand: 'New Balance', price: 2790, originalPrice: 3490, category: '休閒鞋', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500' },
  { name: 'New Balance 550', brand: 'New Balance', price: 3490, originalPrice: 4490, category: '運動鞋', image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=500' },

  // Converse 系列
  { name: 'Converse Chuck 70', brand: 'Converse', price: 1990, originalPrice: 2490, category: '休閒鞋', image: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=500' },
  { name: 'Converse All Star', brand: 'Converse', price: 1690, originalPrice: 1990, category: '休閒鞋', image: 'https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=500' },
  { name: 'Converse Run Star Hike', brand: 'Converse', price: 2990, originalPrice: 3490, category: '休閒鞋', image: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500' },

  // Vans 系列
  { name: 'Vans Old Skool', brand: 'Vans', price: 1890, originalPrice: 2290, category: '休閒鞋', image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500' },
  { name: 'Vans Authentic', brand: 'Vans', price: 1690, originalPrice: 1990, category: '休閒鞋', image: 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=500' },
  { name: 'Vans SK8-Hi', brand: 'Vans', price: 2190, originalPrice: 2590, category: '休閒鞋', image: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=500' },

  // Puma 系列
  { name: 'Puma Suede Classic', brand: 'Puma', price: 2290, originalPrice: 2790, category: '休閒鞋', image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=500' },
  { name: 'Puma RS-X', brand: 'Puma', price: 3290, originalPrice: 3990, category: '運動鞋', image: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=500' },
  { name: 'Puma Cali Sport', brand: 'Puma', price: 2690, originalPrice: 3190, category: '休閒鞋', image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500' },
]

async function main() {
  console.log('🌱 開始新增測試產品...')

  // 先獲取所有品牌和分類
  const brands = await prisma.brand.findMany()
  const categories = await prisma.category.findMany()

  console.log(`✅ 找到 ${brands.length} 個品牌`)
  console.log(`✅ 找到 ${categories.length} 個分類`)

  let successCount = 0
  let skipCount = 0

  for (const productData of testProducts) {
    try {
      // 生成 slug
      const slug = productData.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

      // 檢查產品是否已存在
      const existing = await prisma.product.findUnique({
        where: { slug }
      })

      if (existing) {
        console.log(`⏭️  跳過已存在的產品: ${productData.name}`)
        skipCount++
        continue
      }

      // 找到對應的品牌
      const brand = brands.find(b => b.name === productData.brand)
      if (!brand) {
        console.log(`⚠️  找不到品牌: ${productData.brand}`)
        continue
      }

      // 找到對應的分類
      const category = categories.find(c => c.name === productData.category)
      if (!category) {
        console.log(`⚠️  找不到分類: ${productData.category}`)
        continue
      }

      // 創建產品
      await prisma.product.create({
        data: {
          name: productData.name,
          slug,
          description: `${productData.name} - ${productData.brand}品牌經典款式，舒適耐穿，適合日常穿搭。`,
          price: productData.price,
          stock: Math.floor(Math.random() * 50) + 20, // 20-70 庫存
          images: JSON.stringify([productData.image]),
          brandId: brand.id,
          categoryId: category.id,
          isActive: true,
          shoeType: productData.category === '運動鞋' ? 'SPORTS' : 'CASUAL',
          gender: 'UNISEX',
          season: 'ALL_SEASON'
        }
      })

      console.log(`✅ 新增產品: ${productData.name}`)
      successCount++
    } catch (error) {
      console.error(`❌ 新增失敗 ${productData.name}:`, error.message)
    }
  }

  console.log('\n📊 新增結果:')
  console.log(`   成功: ${successCount} 個`)
  console.log(`   跳過: ${skipCount} 個`)
  console.log(`   總計: ${successCount + skipCount} 個`)
}

main()
  .catch((e) => {
    console.error('❌ 錯誤:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
