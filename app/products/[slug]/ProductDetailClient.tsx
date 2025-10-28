'use client'

import { useState } from 'react'
import ProductGallery from '@/components/product/ProductGallery'
import ColorSelector from '@/components/product/ColorSelector'
import SizeSelector from '@/components/product/SizeSelector'
import SocialShareButtons from '@/components/product/SocialShareButtons'

export default function ProductDetailClient({ product }: { product: any }) {
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.find((v: any) => v.isDefault) || product.variants?.[0]
  )
  const [selectedSize, setSelectedSize] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)

  const finalPrice = selectedVariant
    ? product.price + Number(selectedVariant.priceAdjustment)
    : product.price

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('請選擇尺碼')
      return
    }
    alert('已新增到購物車: ' + product.name)
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/" className="hover:text-primary-600">首頁</a>
            <span>/</span>
            <a href="/products" className="hover:text-primary-600">產品</a>
            <span>/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-700 mt-2">{product.description}</p>
            </div>

            <div className="border-t border-b border-gray-200 py-4">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary-600">
                  ${finalPrice}
                </span>
              </div>
            </div>

            {product.variants && product.variants.length > 0 && (
              <ColorSelector
                variants={product.variants}
                selectedVariant={selectedVariant}
                onVariantChange={setSelectedVariant}
              />
            )}

            {product.sizeCharts && product.sizeCharts.length > 0 && (
              <SizeSelector
                sizeCharts={product.sizeCharts}
                selectedSize={selectedSize?.eu}
                onSizeChange={setSelectedSize}
              />
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">數量</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-16 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!selectedSize}
              className="w-full py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              加入購物車
            </button>

            {/* 社群分享按鈕 */}
            <SocialShareButtons
              productName={product.name}
              productUrl={`/products/${product.slug}`}
              productImage={product.images?.[0]}
              productPrice={finalPrice}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
