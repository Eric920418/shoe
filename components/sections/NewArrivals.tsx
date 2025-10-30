import Link from 'next/link'
import Image from 'next/image'
import { getNewArrivals } from '@/lib/server-queries'

// ✅ 改為 Server Component（使用真實資料）
export default async function NewArrivals() {
  const products = await getNewArrivals(1) // 只獲取最新的一個產品
  const product = products[0]

  // 如果沒有產品，不顯示這個區塊
  if (!product) {
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

  const images = parseImages(product.images)
  const imageUrl = images[0] || '/placeholder.jpg'
  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPercent = hasDiscount
    ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
    : 0

  // 解析產品特性
  const parseFeatures = (features: any): Array<{label: string, value: string}> => {
    try {
      const parsed = typeof features === 'string' ? JSON.parse(features) : features
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 4).map((f: any) => {
          if (typeof f === 'string') {
            return { label: f, value: f }
          }
          return {
            label: f.label || f.name || '',
            value: f.value || f.name || ''
          }
        })
      }
      return []
    } catch {
      return []
    }
  }

  const productFeatures = parseFeatures(product.features)

  // 預設特性（如果產品沒有設定特性）
  const defaultFeatures = [
    { label: '輕量科技', value: '30% 更輕' },
    { label: '緩震升級', value: '2倍回彈' },
    { label: '透氣材質', value: '全天舒適' },
    { label: '防滑鞋底', value: '全地形' },
  ]

  const displayFeatures = productFeatures.length > 0 ? productFeatures : defaultFeatures

  return (
    <section className="py-20 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* 左側：文字內容 */}
          <div className="space-y-8">
            <div>
              <p className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-4">
                New Arrivals
              </p>
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
                新品
                <br />
                搶先體驗
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed mb-8">
                最新科技，突破性設計。
                <br />
                讓每一步都充滿力量與自信。
              </p>
              <Link
                href={`/products/${product.slug}`}
                className="inline-block bg-white text-black font-bold px-8 py-4 rounded-full hover:bg-gray-200 transition-all transform hover:scale-105"
              >
                搶先選購
              </Link>
            </div>

            {/* 特色標籤 */}
            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-gray-800">
              {displayFeatures.map((feature, index) => (
                <div key={index} className="space-y-2">
                  <div className="text-3xl font-black text-white">
                    {feature.value}
                  </div>
                  <div className="text-sm text-gray-400 font-semibold">
                    {feature.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右側：產品圖片 */}
          <div className="relative">
            <div className="relative aspect-square overflow-hidden rounded-lg">
              {/* 背景漸層 */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-blue-900/50" />

              {/* ✅ 產品圖片（使用 Next.js Image） */}
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />

              {/* ✅ 價格標籤（動態） */}
              {hasDiscount && (
                <div className="absolute top-6 right-6 bg-red-500 text-white px-6 py-3 rounded-full">
                  <div className="text-sm font-semibold">限時優惠</div>
                  <div className="text-2xl font-black">-{discountPercent}%</div>
                </div>
              )}

              {/* ✅ 底部產品資訊（動態） */}
              <div className="absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur-sm rounded-lg p-6">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">
                      {product.category?.name || '新品系列'}
                    </div>
                    <div className="text-2xl font-bold">{product.name}</div>
                  </div>
                  <div className="text-right">
                    {hasDiscount && (
                      <div className="text-sm text-gray-400 line-through">
                        NT$ {Number(product.originalPrice).toLocaleString()}
                      </div>
                    )}
                    <div className={`text-2xl font-bold ${hasDiscount ? 'text-red-500' : 'text-white'}`}>
                      NT$ {Number(product.price).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 裝飾元素 */}
            <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-purple-500/20 to-blue-500/20 blur-3xl rounded-full" />
          </div>
        </div>
      </div>
    </section>
  )
}
