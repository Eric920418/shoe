'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, gql } from '@apollo/client'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ShoppingCart, Heart, Share2, Package, Tag, Clock,
  CheckCircle, AlertCircle, Percent, Gift
} from 'lucide-react'

// GraphQL 查詢：獲取單個組合套裝
const GET_BUNDLE = gql`
  query GetBundle($slug: String!) {
    productBundle(slug: $slug) {
      id
      name
      slug
      description
      originalPrice
      bundlePrice
      discount
      discountPercent
      image
      images
      isFeatured
      startDate
      endDate
      maxPurchaseQty
      items {
        id
        quantity
        allowVariantSelection
        product {
          id
          name
          slug
          price
          originalPrice
          images
          stock
          variants {
            id
            name
            color
            colorHex
            stock
          }
          sizeCharts {
            id
            eu
            us
            uk
            cm
            stock
          }
        }
        variant {
          id
          name
          color
          colorHex
        }
      }
    }
  }
`

// GraphQL Mutation：加入購物車（單個產品）
const ADD_TO_CART = gql`
  mutation AddToCart(
    $productId: ID!
    $variantId: ID
    $sizeChartId: ID!
    $quantity: Int!
    $bundleId: ID
    $isBundleItem: Boolean
    $bundleItemPrice: Decimal
  ) {
    addToCart(
      productId: $productId
      variantId: $variantId
      sizeChartId: $sizeChartId
      quantity: $quantity
      bundleId: $bundleId
      isBundleItem: $isBundleItem
      bundleItemPrice: $bundleItemPrice
    ) {
      id
      items {
        id
        quantity
      }
    }
  }
`

export default function BundlePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [selectedVariants, setSelectedVariants] = useState<Record<string, { variantId?: string; sizeId?: string }>>({})
  const [quantity, setQuantity] = useState(1)

  // 查詢組合套裝數據
  const { data, loading, error } = useQuery(GET_BUNDLE, {
    variables: { slug },
    skip: !slug,
  })

  // 加入購物車 mutation
  const [addToCart, { loading: addingToCart }] = useMutation(ADD_TO_CART)

  const bundle = data?.productBundle

  // 處理變體選擇
  const handleVariantSelect = (productId: string, variantId: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: { ...prev[productId], variantId }
    }))
  }

  // 處理尺碼選擇
  const handleSizeSelect = (productId: string, sizeId: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: { ...prev[productId], sizeId }
    }))
  }

  // 檢查是否所有必需的選項都已選擇
  const canAddToCart = () => {
    if (!bundle) return false

    for (const item of bundle.items) {
      const selected = selectedVariants[item.product.id]

      // 檢查產品是否有尺碼（所有產品都必須有尺碼才能加入購物車）
      if (item.product.sizeCharts.length === 0) {
        console.error(`產品 ${item.product.name} 沒有設定尺碼`)
        return false
      }

      // 如果產品有變體但未選擇
      if (item.product.variants.length > 0 && item.allowVariantSelection && !selected?.variantId) {
        return false
      }

      // 如果產品有尺碼但未選擇（所有產品都需要選擇尺碼）
      if (!selected?.sizeId) {
        return false
      }
    }

    return true
  }

  // 加入購物車
  const handleAddToCart = async () => {
    if (!bundle) return

    // 檢查所有產品是否都有尺碼
    const productsWithoutSizes = bundle.items.filter(item => item.product.sizeCharts.length === 0)
    if (productsWithoutSizes.length > 0) {
      toast.error(`以下產品尚未設定尺碼：${productsWithoutSizes.map(i => i.product.name).join('、')}`)
      return
    }

    if (!canAddToCart()) {
      toast.error('請選擇所有產品的尺碼和顏色')
      return
    }

    try {
      // 計算組合優惠比例
      const originalPrice = parseFloat(bundle.originalPrice)
      const bundlePrice = parseFloat(bundle.bundlePrice)
      const discountRatio = bundlePrice / originalPrice

      console.log('💰 組合優惠計算:', {
        originalPrice,
        bundlePrice,
        discountRatio
      })

      // 逐個添加套裝中的產品到購物車
      let addedCount = 0
      for (const item of bundle.items) {
        const selected = selectedVariants[item.product.id]

        // 確保 sizeId 存在
        if (!selected?.sizeId) {
          throw new Error(`請為 ${item.product.name} 選擇尺碼`)
        }

        // 計算此產品的組合優惠價格
        // 公式：產品原價 × 組合折扣比例，取整數
        const productOriginalPrice = parseFloat(item.product.price)
        const bundleItemPrice = Math.round(productOriginalPrice * discountRatio)

        console.log(`💰 ${item.product.name} 價格計算:`, {
          productOriginalPrice,
          bundleItemPriceBeforeRound: productOriginalPrice * discountRatio,
          bundleItemPrice,
          quantity: item.quantity
        })

        await addToCart({
          variables: {
            productId: item.product.id,
            variantId: selected.variantId || null,
            sizeChartId: selected.sizeId,
            quantity: item.quantity * quantity,
            bundleId: bundle.id,
            isBundleItem: true,
            bundleItemPrice: bundleItemPrice
          }
        })
        addedCount++
      }

      toast.success(`已將組合優惠 ${addedCount} 件商品加入購物車！`)
      router.push('/cart')
    } catch (error) {
      console.error('加入購物車失敗:', error)
      toast.error(error instanceof Error ? error.message : '加入購物車失敗')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  if (error || !bundle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={64} />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">找不到此組合套裝</h1>
          <p className="text-gray-600 mb-6">{error?.message || '此組合套裝不存在或已下架'}</p>
          <Link href="/super-deals" className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium inline-block">
            返回優惠專區
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="flex items-center justify-center gap-2 text-sm sm:text-base">
            <Tag size={18} />
            <span>超值組合優惠 · 省 ${parseFloat(bundle.discount || 0).toFixed(0)} ({parseFloat(bundle.discountPercent || 0).toFixed(0)}% OFF)</span>
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側：圖片 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
              {bundle.image ? (
                <Image
                  src={bundle.image}
                  alt={bundle.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={64} className="text-gray-300" />
                </div>
              )}
              {bundle.isFeatured && (
                <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                  熱門
                </div>
              )}
            </div>

            {/* 縮圖 */}
            {bundle.images && bundle.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {bundle.images.map((img: string, idx: number) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-75">
                    <Image src={img} alt={`${bundle.name} ${idx + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右側：資訊 */}
          <div className="space-y-6">
            {/* 標題與價格 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{bundle.name}</h1>
              {bundle.description && (
                <p className="text-gray-600 mb-4">{bundle.description}</p>
              )}

              <div className="flex items-end gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">原價</p>
                  <p className="text-xl text-gray-400 line-through">
                    ${parseFloat(bundle.originalPrice).toFixed(0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">套裝價</p>
                  <p className="text-4xl font-bold text-purple-600">
                    ${parseFloat(bundle.bundlePrice).toFixed(0)}
                  </p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <Percent className="text-red-500" size={20} />
                <span className="text-red-600 font-medium">
                  立即省下 ${parseFloat(bundle.discount || 0).toFixed(0)} ({parseFloat(bundle.discountPercent || 0).toFixed(0)}% OFF)
                </span>
              </div>
            </div>

            {/* 套裝內容 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Gift className="text-purple-500" />
                套裝內容
              </h3>

              <div className="space-y-4">
                {bundle.items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex gap-4 mb-3">
                      <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 relative">
                        {item.product.images && item.product.images[0] && (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover rounded"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 truncate">{item.product.name}</h4>
                        <p className="text-sm text-gray-500">數量: {item.quantity}</p>
                      </div>
                    </div>

                    {/* 顏色選擇 */}
                    {item.product.variants.length > 0 && item.allowVariantSelection && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">選擇顏色</label>
                        <div className="flex flex-wrap gap-2">
                          {item.product.variants.map((variant) => (
                            <button
                              key={variant.id}
                              onClick={() => handleVariantSelect(item.product.id, variant.id)}
                              className={`px-3 py-2 rounded-lg border text-sm ${
                                selectedVariants[item.product.id]?.variantId === variant.id
                                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {variant.colorHex && (
                                  <div
                                    className="w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: variant.colorHex }}
                                  />
                                )}
                                <span>{variant.color || variant.name}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 尺碼選擇 */}
                    {item.product.sizeCharts.length > 0 ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">選擇尺碼</label>
                        <div className="grid grid-cols-4 gap-2">
                          {item.product.sizeCharts.map((size) => (
                            <button
                              key={size.id}
                              onClick={() => handleSizeSelect(item.product.id, size.id)}
                              disabled={size.stock === 0}
                              className={`px-3 py-2 rounded-lg border text-sm ${
                                selectedVariants[item.product.id]?.sizeId === size.id
                                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                                  : size.stock === 0
                                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              EU {size.eu}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 flex items-center gap-2">
                          <AlertCircle size={16} />
                          此產品尚未設定尺碼，請聯繫管理員添加尺碼後才能購買
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 數量與購買按鈕 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm font-medium text-gray-700">數量:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart() || addingToCart}
                className={`w-full py-4 rounded-lg font-medium text-white text-lg flex items-center justify-center gap-2 ${
                  canAddToCart() && !addingToCart
                    ? 'bg-purple-500 hover:bg-purple-600'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {addingToCart ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    處理中...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    加入購物車
                  </>
                )}
              </button>

              {!canAddToCart() && (
                <p className="text-sm text-red-500 mt-2 text-center">
                  請選擇所有產品的顏色和尺碼
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
