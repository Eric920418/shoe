import Link from 'next/link'
import Image from 'next/image'
import { getFeaturedProducts } from '@/lib/server-queries'

// ✅ 改為 Server Component（使用真實資料）
export default async function FeaturedProducts() {
  const products = await getFeaturedProducts(4) // 最多顯示 4 個精選產品

  // 如果沒有精選產品，不顯示這個區塊
  if (products.length === 0) {
    return null
  }

  // ✅ 解析圖片 URL
  const parseImages = (images: string | string[]): string[] => {
    try {
      if (typeof images === 'string') {
        const parsed = JSON.parse(images)
        return Array.isArray(parsed) ? parsed : []
      }
      return Array.isArray(images) ? images : []
    } catch {
      return []
    }
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 標題區 */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <p className="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-2">
              Featured Collection
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-black">
              精選推薦
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden sm:inline-flex items-center text-black font-semibold hover:gap-3 gap-2 transition-all group"
          >
            查看全部
            <svg
              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>

        {/* 產品網格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const images = parseImages(product.images)
            const imageUrl = images[0] || '/placeholder.jpg'
            const hasDiscount = product.originalPrice && product.originalPrice > product.price

            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group"
              >
                <div className="relative overflow-hidden bg-gray-100 rounded-lg aspect-square mb-4">
                  {/* ✅ Badge（如果有折扣或是新品） */}
                  {hasDiscount && (
                    <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      特價
                    </div>
                  )}
                  {product.isFeatured && !hasDiscount && (
                    <div className="absolute top-4 left-4 z-10 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      精選
                    </div>
                  )}

                  {/* ✅ 產品圖片（使用 Next.js Image） */}
                  <div className="relative w-full h-full overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>

                  {/* Hover 遮罩 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

                  {/* 快速查看按鈕 */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white text-black font-bold px-6 py-3 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      快速查看
                    </div>
                  </div>
                </div>

                {/* 產品資訊 */}
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">{product.category?.name || '未分類'}</p>
                  <h3 className="font-bold text-lg text-black group-hover:underline">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-black">
                      NT$ {Number(product.price).toLocaleString()}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-gray-400 line-through">
                        NT$ {Number(product.originalPrice).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* 移動端查看全部按鈕 */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/products"
            className="inline-flex items-center text-black font-semibold gap-2"
          >
            查看全部
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
