'use client'

/**
 * 購物車頁面 - 支援會員和訪客模式
 */

import { useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { GET_CART, UPDATE_CART_ITEM, REMOVE_FROM_CART, CLEAR_CART } from '@/graphql/queries'
import { useAuth } from '@/contexts/AuthContext'
import { useGuestCart } from '@/contexts/GuestCartContext'
import MembershipBenefitsBanner from '@/components/common/MembershipBenefitsBanner'

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

export default function CartPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const guestCart = useGuestCart()

  // ✅ 不再強制跳轉登入，允許訪客查看購物車
  // useEffect(() => {
  //   if (!authLoading && !isAuthenticated) {
  //     alert('請先登入以查看購物車')
  //     router.push('/auth/login')
  //   }
  // }, [isAuthenticated, authLoading, router])

  // 會員模式：從 GraphQL 獲取購物車
  const { data, loading, error, refetch } = useQuery(GET_CART, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only',
    onError: (error) => {
      console.error('❌ 購物車載入失敗:', error)

      // ✅ 處理認證錯誤（包含用戶不存在的情況）
      const authErrorPatterns = ['請先登入', '用戶不存在', '請重新登入', '認證']
      const isAuthError = authErrorPatterns.some(pattern =>
        error.message.includes(pattern)
      )

      if (isAuthError) {
        console.warn('🔒 檢測到認證錯誤，自動登出:', error.message)
        logout()
      }
    },
  })

  // 判斷是否為訪客模式
  const isGuest = !isAuthenticated

  const [updateCartItem, { loading: updating }] = useMutation(UPDATE_CART_ITEM, {
    onCompleted: () => {
      refetch()
    },
    onError: (error) => {
      console.error('更新失敗:', error)
      alert(error.message || '更新失敗，請重試')
    },
  })

  const [removeFromCart, { loading: removing }] = useMutation(REMOVE_FROM_CART, {
    onCompleted: () => {
      refetch()
      alert('商品已移除')
    },
    onError: (error) => {
      console.error('移除失敗:', error)
      alert(error.message || '移除失敗，請重試')
    },
  })

  const [clearCart, { loading: clearing }] = useMutation(CLEAR_CART, {
    onCompleted: () => {
      refetch()
      alert('購物車已清空')
    },
    onError: (error) => {
      console.error('清空失敗:', error)
      alert(error.message || '清空失敗，請重試')
    },
  })

  const handleUpdateQuantity = async (itemId: string, newQuantity: number, productId?: string, variantId?: string, sizeEu?: string) => {
    if (newQuantity < 1) return

    // 訪客模式：使用 localStorage
    if (isGuest && productId) {
      guestCart.updateQuantity(productId, newQuantity, variantId, sizeEu)
      return
    }

    // 會員模式：使用 GraphQL
    try {
      await updateCartItem({
        variables: {
          cartItemId: itemId,
          quantity: newQuantity,
        },
      })
    } catch (error) {
      console.error('更新數量失敗:', error)
    }
  }

  const handleRemoveItem = async (itemId: string, productName: string, productId?: string, variantId?: string, sizeEu?: string) => {
    if (!confirm(`確定要移除「${productName}」嗎？`)) return

    // 訪客模式：使用 localStorage
    if (isGuest && productId) {
      guestCart.removeItem(productId, variantId, sizeEu)
      return
    }

    // 會員模式：使用 GraphQL
    try {
      await removeFromCart({
        variables: {
          cartItemId: itemId,
        },
      })
    } catch (error) {
      console.error('移除商品失敗:', error)
    }
  }

  const handleClearCart = async () => {
    if (!confirm('確定要清空購物車嗎？')) return

    // 訪客模式：使用 localStorage
    if (isGuest) {
      guestCart.clearCart()
      return
    }

    // 會員模式：使用 GraphQL
    try {
      await clearCart()
    } catch (error) {
      console.error('清空購物車失敗:', error)
    }
  }

  // 獲取購物車數據（會員或訪客）
  const cartItems = isGuest ? guestCart.items : (data?.cart?.items || [])
  const cartTotal = isGuest ? guestCart.total : (data?.cart?.total || 0)
  const cartIsEmpty = cartItems.length === 0

  // 載入中狀態（訪客模式不需要等待）
  if (!isGuest && (authLoading || loading)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900 mb-2">載入中...</div>
          <p className="text-gray-600">正在獲取購物車資訊</p>
        </div>
      </div>
    )
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-2xl font-semibold text-red-600 mb-2">載入失敗</div>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            重新載入
          </button>
        </div>
      </div>
    )
  }

  const isProcessing = updating || removing || clearing

  // 空購物車狀態
  if (cartIsEmpty) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">購物車是空的</h1>
          <p className="text-gray-600 mb-8">還沒有新增任何商品到購物車</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            繼續購物
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 訪客模式：會員好處提示 */}
      {isGuest && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <MembershipBenefitsBanner variant="compact" />
        </div>
      )}

      {/* 頂部標題區 - Nike/Adidas 風格 */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
                購物袋
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {cartItems.length} 件商品
              </p>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={handleClearCart}
                disabled={isProcessing}
                className="text-sm text-gray-600 hover:text-black underline disabled:opacity-50 transition-colors"
              >
                清空購物袋
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* 左側：商品列表 */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item: any, index: number) => {
              // 訪客購物車與會員購物車數據結構不同
              const productName = isGuest ? item.productName : item.product.name
              const productImage = isGuest ? item.productImage : parseImages(item.product.images)[0]
              const productSlug = isGuest ? '#' : `/products/${item.product.slug}`
              const brandName = isGuest ? null : item.product?.brand?.name
              const variantName = isGuest ? item.variantName : item.variant?.color
              const sizeEu = isGuest ? item.sizeEu : item.sizeEu
              const quantity = item.quantity
              const price = isGuest ? item.price : item.addedPrice
              const subtotal = isGuest ? (item.price * item.quantity) : item.subtotal
              const itemId = isGuest ? `guest-${index}` : item.id

              return (
                <div
                  key={itemId}
                  className="border-b border-gray-200 pb-6 last:border-0"
                >
                  <div className="flex gap-6">
                    {/* 商品圖片 - 更大尺寸 */}
                    <div className="w-40 h-40 sm:w-48 sm:h-48 bg-gray-100 flex-shrink-0 overflow-hidden">
                      {productImage ? (
                        <Image
                          src={productImage}
                          alt={productName}
                          width={192}
                          height={192}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <div className="text-5xl mb-2">👟</div>
                            <div className="text-xs">無圖片</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 商品資訊 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 pr-4">
                          <Link
                            href={productSlug}
                            className="text-base font-medium text-black hover:opacity-60 transition-opacity"
                          >
                            {productName}
                          </Link>
                          {brandName && (
                            <p className="text-sm text-gray-600 mt-1">
                              {brandName}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(
                            itemId,
                            productName,
                            isGuest ? item.productId : undefined,
                            isGuest ? item.variantId : undefined,
                            isGuest ? item.sizeEu : undefined
                          )}
                          disabled={isProcessing}
                          className="text-gray-400 hover:text-black disabled:opacity-50 transition-colors flex-shrink-0"
                          title="移除"
                        >
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* 規格資訊 - 極簡風格 */}
                      <div className="space-y-1 text-sm text-gray-600 mb-4">
                        {variantName && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase tracking-wide text-gray-500">
                              顏色
                            </span>
                            <span>{variantName}</span>
                          </div>
                        )}
                        {sizeEu && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase tracking-wide text-gray-500">
                              尺碼
                            </span>
                            <span>EU {sizeEu}</span>
                          </div>
                        )}
                      </div>

                      {/* 底部：數量和價格 */}
                      <div className="flex items-center justify-between">
                        {/* 數量調整 - Nike 風格 */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center border border-gray-300 rounded-full">
                            <button
                              onClick={() => handleUpdateQuantity(
                                itemId,
                                quantity - 1,
                                isGuest ? item.productId : undefined,
                                isGuest ? item.variantId : undefined,
                                isGuest ? item.sizeEu : undefined
                              )}
                              disabled={isProcessing || quantity <= 1}
                              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-l-full"
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
                            <div className="w-12 text-center font-medium text-sm">
                              {quantity}
                            </div>
                            <button
                              onClick={() => handleUpdateQuantity(
                                itemId,
                                quantity + 1,
                                isGuest ? item.productId : undefined,
                                isGuest ? item.variantId : undefined,
                                isGuest ? item.sizeEu : undefined
                              )}
                              disabled={isProcessing}
                              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 transition-colors rounded-r-full"
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

                        {/* 價格 */}
                        <div className="text-right">
                          <p className="text-base font-medium text-black">
                            NT$ {subtotal.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 右側：訂單摘要 */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-bold text-black uppercase tracking-tight mb-6">
                  摘要
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">小計</span>
                    <span className="text-black font-medium">
                      NT$ {cartTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">運費</span>
                    <span className="text-green-600 font-medium">免運費</span>
                  </div>
                  <div className="border-t border-gray-300 pt-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-base font-bold text-black uppercase">
                        總計
                      </span>
                      <span className="text-2xl font-black text-black">
                        NT$ {cartTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CTA 按鈕 */}
                <div className="space-y-3">
                  <Link
                    href="/checkout"
                    className="block w-full py-4 bg-black text-white text-center rounded-full hover:bg-gray-800 transition-colors font-medium text-sm uppercase tracking-wide"
                  >
                    結帳
                  </Link>

                  <Link
                    href="/"
                    className="block w-full py-4 border-2 border-black text-black text-center rounded-full hover:bg-gray-50 transition-colors font-medium text-sm uppercase tracking-wide"
                  >
                    繼續購物
                  </Link>
                </div>

                {/* 付款方式 */}
                <div className="mt-6 pt-6 border-t border-gray-300">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
                    接受的付款方式
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <div className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700">
                      銀行轉帳
                    </div>
                    <div className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700">
                      LINE Pay
                    </div>
                    <div className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700">
                      貨到付款
                    </div>
                  </div>
                </div>
              </div>

              {/* 安全提示 */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>安全結帳保護</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
