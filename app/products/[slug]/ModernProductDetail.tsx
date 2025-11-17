'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client'
import { ADD_TO_CART } from '@/graphql/queries'
import { useAuth } from '@/contexts/AuthContext'
import { useGuestCart } from '@/contexts/GuestCartContext'
import toast from 'react-hot-toast'
import Breadcrumb from '@/components/common/Breadcrumb'

// ✅ 解析圖片陣列（提取為獨立函數）
const parseImages = (images: string[] | string): string[] => {
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

// ✅ 解析特色功能陣列（提取為獨立函數）
const parseFeatures = (features: string[] | string): string[] => {
  try {
    if (typeof features === 'string') {
      const parsed = JSON.parse(features)
      return Array.isArray(parsed) ? parsed : []
    }
    return Array.isArray(features) ? features : []
  } catch {
    return []
  }
}

export default function ModernProductDetail({ product }: { product: any }) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const guestCart = useGuestCart()

  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.find((v: any) => v.isDefault) || product.variants?.[0]
  )
  const [selectedSize, setSelectedSize] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const [addToCart, { loading: addingToCart }] = useMutation(ADD_TO_CART)

  // 統一的 loading 狀態
  const isLoading = isAdding || addingToCart

  // ✅ 使用 useMemo 避免重複解析
  const displayImages = useMemo(() => parseImages(product.images), [product.images])
  const hasImages = displayImages.length > 0
  const displayFeatures = useMemo(() =>
    product.features ? parseFeatures(product.features) : [],
    [product.features]
  )

  // ✅ 檢查是否有可用庫存
  const hasAvailableStock = useMemo(() => {
    if (!product.sizeCharts || product.sizeCharts.length === 0) return false
    return product.sizeCharts.some((size: any) => size.stock > 0)
  }, [product.sizeCharts])

  const finalPrice = selectedVariant
    ? product.price + Number(selectedVariant.priceAdjustment || 0)
    : product.price

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.error('請選擇尺碼')
      return
    }

    setIsAdding(true)
    try {
      // 會員模式：使用 GraphQL mutation
      if (isAuthenticated) {
        await addToCart({
          variables: {
            productId: product.id,
            variantId: selectedVariant?.id,
            sizeChartId: selectedSize.id,
            quantity,
          },
        })
        toast.success('已加入購物車，正在前往購物車...')
        // 跳轉到購物車頁面
        setTimeout(() => {
          router.push('/cart')
        }, 500)
      }
      // 訪客模式：使用 localStorage
      else {
        guestCart.addItem({
          productId: product.id,
          productName: product.name,
          productImage: displayImages[0] || null,
          variantId: selectedVariant?.id || null,
          variantName: selectedVariant?.color || null,
          sizeEu: selectedSize.eu,
          color: selectedVariant?.color || null,
          quantity,
          price: finalPrice,
          stock: selectedSize.stock,
        })
        toast.success('已加入購物車，正在前往購物車...')
        // 跳轉到購物車頁面
        setTimeout(() => {
          router.push('/cart')
        }, 500)
      }
    } catch (error: any) {
      console.error('加入購物車失敗:', error)
      toast.error(error.message || '加入購物車失敗')
      setIsAdding(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 麵包屑導航 */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb
            items={[
              { label: product.name }
            ]}
            showCartLink={true}
          />
        </div>
      </div>

      {/* 主要內容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* 左側：圖片區 */}
          <div className="space-y-4">
            {/* 主圖 */}
            <div className="relative aspect-square bg-gray-100 overflow-hidden">
              {hasImages ? (
                <Image
                  src={displayImages[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">👟</div>
                    <div className="text-lg">無商品圖片</div>
                  </div>
                </div>
              )}
            </div>

            {/* 縮略圖 */}
            {displayImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {displayImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square bg-gray-100 overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-black'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 右側：產品資訊 */}
          <div className="space-y-6">
            {/* 標題區 */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-black mb-2">
                {product.name}
              </h1>
              {product.category && (
                <p className="text-sm text-gray-600">{product.category.name}</p>
              )}
            </div>

            {/* 價格 */}
            <div className="py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-black">
                  NT$ {finalPrice.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > finalPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    NT$ {product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* 描述 */}
            {product.description && (
              <div>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* 顏色選擇器 */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-black mb-3 uppercase">
                  選擇顏色
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`group relative`}
                      title={variant.color}
                    >
                      <div
                        className={`w-12 h-12 rounded-full border-2 transition-all ${
                          selectedVariant?.id === variant.id
                            ? 'border-black scale-110'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: variant.colorHex || '#ccc' }}
                      />
                      {selectedVariant?.id === variant.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-white drop-shadow-lg"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 尺碼選擇器 */}
            {product.sizeCharts && product.sizeCharts.length > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-black uppercase">
                    選擇尺碼
                  </h3>
                  <button className="text-sm text-gray-600 hover:text-black underline">
                    尺碼指南
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {product.sizeCharts.map((size: any) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size)}
                      disabled={size.stock === 0}
                      className={`py-3 text-sm font-medium border transition-all ${
                        selectedSize?.id === size.id
                          ? 'bg-black text-white border-black'
                          : size.stock === 0
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                          : 'bg-white text-black border-gray-300 hover:border-black'
                      }`}
                    >
                      EU {size.eu}
                    </button>
                  ))}
                </div>

                {/* ✅ 全部缺貨提示 */}
                {product.sizeCharts.every((size: any) => size.stock === 0) && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-red-900">此商品目前缺貨</p>
                        <p className="text-xs text-red-700 mt-1">所有尺碼均已售完，請稍後再查看或聯繫客服詢問到貨時間</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ✅ 無尺碼資料提示 */
              <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-yellow-900">此商品尚未設定庫存</p>
                    <p className="text-xs text-yellow-700 mt-1">商品資訊尚未完善，暫時無法購買。請聯繫客服獲取更多資訊。</p>
                  </div>
                </div>
              </div>
            )}

            {/* 數量選擇 */}
            <div>
              <h3 className="text-sm font-bold text-black mb-3 uppercase">數量</h3>
              <div className="flex items-center">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 12H4"
                    />
                  </svg>
                </button>
                <div className="w-16 h-12 flex items-center justify-center border-t border-b border-gray-300 font-medium">
                  {quantity}
                </div>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 flex items-center justify-center border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* 加入購物車按鈕 */}
            <button
              onClick={handleAddToCart}
              disabled={!hasAvailableStock || !selectedSize || isLoading}
              className="w-full py-4 bg-black text-white font-bold rounded-full hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading
                ? '加入中...'
                : !hasAvailableStock
                ? '暫時缺貨'
                : '加入購物車'}
            </button>

            {/* 商品資訊 */}
            {displayFeatures.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-bold text-black mb-3 uppercase">
                  商品特色
                </h3>
                <ul className="space-y-2">
                  {displayFeatures.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 品牌資訊 */}
            {product.brand && (
              <div className="border-t pt-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">品牌：</span>
                  <span className="text-sm font-semibold text-black">
                    {product.brand.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
