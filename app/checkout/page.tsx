'use client'

/**
 * 結帳頁面 - 收集運送資訊並創建訂單（支援訪客結帳）
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { GET_CART, CREATE_ORDER } from '@/graphql/queries'
import { useAuth } from '@/contexts/AuthContext'
import { useGuestCart } from '@/contexts/GuestCartContext'
import CreditSelector from '@/components/checkout/CreditSelector'
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

interface CheckoutFormData {
  // 訪客資訊（訪客結帳時必填）
  guestName: string
  guestPhone: string
  guestEmail: string
  // 收件資訊
  shippingName: string
  shippingPhone: string
  shippingCity: string
  shippingDistrict: string
  shippingStreet: string
  shippingZipCode: string
  shippingCountry: string
  paymentMethod: string
  notes: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const guestCart = useGuestCart()

  const [formData, setFormData] = useState<CheckoutFormData>({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    shippingName: '',
    shippingPhone: '',
    shippingCity: '',
    shippingDistrict: '',
    shippingStreet: '',
    shippingZipCode: '',
    shippingCountry: '台灣',
    paymentMethod: 'BANK_TRANSFER',
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [creditsToUse, setCreditsToUse] = useState(0)

  // ✅ 訪客模式：不強制登入
  // useEffect(() => {
  //   if (!authLoading && !isAuthenticated) {
  //     alert('請先登入以進行結帳')
  //     router.push('/auth/login')
  //   }
  // }, [isAuthenticated, authLoading, router])

  // 預填用戶資訊
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        shippingName: user.name || '',
        shippingPhone: user.phone || '',
      }))
    }
  }, [user])

  // 會員模式：從 GraphQL 獲取購物車
  const { data: cartData, loading: cartLoading } = useQuery(GET_CART, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only',
  })

  const [createOrder, { loading: creating }] = useMutation(CREATE_ORDER, {
    onCompleted: (data) => {
      alert('訂單創建成功！訂單編號：' + data.createOrder.orderNumber)

      // 訪客模式：清空訪客購物車
      if (!isAuthenticated) {
        guestCart.clearCart()
      }

      // 跳轉到訂單完成頁（之後會創建這個頁面）
      router.push(`/orders/success?orderNumber=${data.createOrder.orderNumber}&phone=${formData.guestPhone || user?.phone}`)
    },
    onError: (error) => {
      console.error('創建訂單失敗:', error)
      alert(error.message || '創建訂單失敗，請重試')
    },
  })

  // 判斷是否為訪客模式
  const isGuest = !isAuthenticated

  // 獲取購物車數據（會員或訪客）
  const cartItems = isGuest ? guestCart.items : (cartData?.cart?.items || [])
  const cartTotal = isGuest ? guestCart.total : (cartData?.cart?.total || 0)
  const cartIsEmpty = cartItems.length === 0

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // 清除錯誤訊息
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // 訪客模式：驗證訪客資訊
    if (isGuest) {
      if (!formData.guestName.trim()) {
        newErrors.guestName = '請輸入您的姓名'
      }
      if (!formData.guestPhone.trim()) {
        newErrors.guestPhone = '請輸入您的手機號碼'
      } else if (!/^09\d{8}$/.test(formData.guestPhone.trim())) {
        newErrors.guestPhone = '請輸入有效的台灣手機號碼（例：0912345678）'
      }
      // Email 選填但要驗證格式
      if (formData.guestEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guestEmail.trim())) {
        newErrors.guestEmail = '請輸入有效的電子郵件'
      }
    }

    // 收件資訊驗證
    if (!formData.shippingName.trim()) {
      newErrors.shippingName = '請輸入收件人姓名'
    }
    if (!formData.shippingPhone.trim()) {
      newErrors.shippingPhone = '請輸入收件人手機'
    } else if (!/^09\d{8}$/.test(formData.shippingPhone.trim())) {
      newErrors.shippingPhone = '請輸入有效的台灣手機號碼'
    }
    if (!formData.shippingCity.trim()) {
      newErrors.shippingCity = '請輸入城市'
    }
    if (!formData.shippingDistrict.trim()) {
      newErrors.shippingDistrict = '請輸入區域'
    }
    if (!formData.shippingStreet.trim()) {
      newErrors.shippingStreet = '請輸入街道地址'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      // 訪客模式：從 guestCart.items 構建訂單項目
      const orderItems = isGuest
        ? guestCart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            sizeEu: item.sizeEu,
            quantity: item.quantity,
          }))
        : undefined // 會員模式：後端從購物車獲取

      await createOrder({
        variables: {
          input: {
            // 訪客資訊
            isGuest,
            guestName: isGuest ? formData.guestName.trim() : null,
            guestPhone: isGuest ? formData.guestPhone.trim() : null,
            guestEmail: isGuest && formData.guestEmail ? formData.guestEmail.trim() : null,
            // 訂單項目（僅訪客模式需要）
            items: orderItems,
            // 收件資訊
            shippingName: formData.shippingName.trim(),
            shippingPhone: formData.shippingPhone.trim(),
            shippingCountry: formData.shippingCountry,
            shippingCity: formData.shippingCity.trim(),
            shippingDistrict: formData.shippingDistrict.trim(),
            shippingStreet: formData.shippingStreet.trim(),
            shippingZipCode: formData.shippingZipCode.trim(),
            paymentMethod: formData.paymentMethod,
            notes: formData.notes.trim() || null,
            // 購物金（僅會員可用）
            creditsToUse: !isGuest && creditsToUse > 0 ? creditsToUse : null,
          },
        },
      })
    } catch (error) {
      console.error('提交訂單失敗:', error)
    }
  }

  // 載入中狀態（訪客模式不需要等待）
  if (!isGuest && (authLoading || cartLoading)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900 mb-2">載入中...</div>
          <p className="text-gray-600">正在獲取購物車資訊</p>
        </div>
      </div>
    )
  }

  // 空購物車
  if (cartIsEmpty) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">購物車是空的</h1>
          <p className="text-gray-600 mb-8">請先新增商品到購物車</p>
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
      <form onSubmit={handleSubmit}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* 左側：收件資訊表單 */}
            <div className="lg:col-span-2 space-y-8">
              {/* 訪客模式：會員好處提示 */}
              {isGuest && (
                <MembershipBenefitsBanner variant="prominent" />
              )}

              {/* 訪客模式：訪客資訊表單 */}
              {isGuest && (
                <div>
                  <h2 className="text-lg font-bold text-black uppercase tracking-tight mb-2">
                    聯絡資訊
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    請提供您的聯絡資訊以便追蹤訂單
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="guestName" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                        您的姓名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="guestName"
                        name="guestName"
                        value={formData.guestName}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 ${errors.guestName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                        placeholder="請輸入您的姓名"
                      />
                      {errors.guestName && (
                        <p className="mt-2 text-sm text-red-600">{errors.guestName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="guestPhone" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                        您的手機號碼 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="guestPhone"
                        name="guestPhone"
                        value={formData.guestPhone}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 ${errors.guestPhone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                        placeholder="0912345678"
                      />
                      {errors.guestPhone && (
                        <p className="mt-2 text-sm text-red-600">{errors.guestPhone}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        用於訂單追蹤和聯繫
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="guestEmail" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                        電子郵件（選填）
                      </label>
                      <input
                        type="email"
                        id="guestEmail"
                        name="guestEmail"
                        value={formData.guestEmail}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 ${errors.guestEmail ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                        placeholder="your@email.com"
                      />
                      {errors.guestEmail && (
                        <p className="mt-2 text-sm text-red-600">{errors.guestEmail}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 收件人資訊 */}
              <div>
                <h2 className="text-lg font-bold text-black uppercase tracking-tight mb-6">
                  收件人資訊
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="shippingName" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                      收件人姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="shippingName"
                      name="shippingName"
                      value={formData.shippingName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 ${errors.shippingName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                      placeholder="請輸入姓名"
                    />
                    {errors.shippingName && (
                      <p className="mt-2 text-sm text-red-600">{errors.shippingName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="shippingPhone" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                      收件人手機 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="shippingPhone"
                      name="shippingPhone"
                      value={formData.shippingPhone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 ${errors.shippingPhone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                      placeholder="0912345678"
                    />
                    {errors.shippingPhone && (
                      <p className="mt-2 text-sm text-red-600">{errors.shippingPhone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 收件地址 */}
              <div>
                <h2 className="text-lg font-bold text-black uppercase tracking-tight mb-6">
                  收件地址
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label htmlFor="shippingCity" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                      城市 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="shippingCity"
                      name="shippingCity"
                      value={formData.shippingCity}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 ${errors.shippingCity ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                      placeholder="台北市"
                    />
                    {errors.shippingCity && (
                      <p className="mt-2 text-sm text-red-600">{errors.shippingCity}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="shippingDistrict" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                      區域 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="shippingDistrict"
                      name="shippingDistrict"
                      value={formData.shippingDistrict}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 ${errors.shippingDistrict ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                      placeholder="信義區"
                    />
                    {errors.shippingDistrict && (
                      <p className="mt-2 text-sm text-red-600">{errors.shippingDistrict}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="shippingZipCode" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                      郵遞區號
                    </label>
                    <input
                      type="text"
                      id="shippingZipCode"
                      name="shippingZipCode"
                      value={formData.shippingZipCode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors bg-white"
                      placeholder="110"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="shippingStreet" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                    街道地址 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="shippingStreet"
                    name="shippingStreet"
                    value={formData.shippingStreet}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 ${errors.shippingStreet ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                    placeholder="信義路五段7號"
                  />
                  {errors.shippingStreet && (
                    <p className="mt-2 text-sm text-red-600">{errors.shippingStreet}</p>
                  )}
                </div>
              </div>

              {/* 付款方式 */}
              <div>
                <h2 className="text-lg font-bold text-black uppercase tracking-tight mb-6">付款方式</h2>

                <div className="space-y-4">
                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'BANK_TRANSFER' ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="BANK_TRANSFER"
                      checked={formData.paymentMethod === 'BANK_TRANSFER'}
                      onChange={handleChange}
                      className="w-5 h-5 mr-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-black">銀行轉帳</div>
                      <div className="text-sm text-gray-600">訂單確認後將提供匯款資訊</div>
                    </div>
                  </label>

                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'LINE_PAY' ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="LINE_PAY"
                      checked={formData.paymentMethod === 'LINE_PAY'}
                      onChange={handleChange}
                      className="w-5 h-5 mr-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-black">LINE Pay</div>
                      <div className="text-sm text-gray-600">使用 LINE Pay 線上支付</div>
                    </div>
                  </label>

                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'COD' ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={formData.paymentMethod === 'COD'}
                      onChange={handleChange}
                      className="w-5 h-5 mr-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-black">貨到付款</div>
                      <div className="text-sm text-gray-600">收到商品時現金付款</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 備註 */}
              <div>
                <h2 className="text-lg font-bold text-black uppercase tracking-tight mb-6">訂單備註</h2>

                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors bg-white"
                  placeholder="如有特殊需求請在此說明（選填）"
                />
              </div>
            </div>

          {/* 右側：訂單摘要 */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-bold text-black uppercase tracking-tight mb-6">
                  摘要
                </h2>

                {/* 商品列表 */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {cartItems.map((item: any, index: number) => {
                    // 訪客購物車與會員購物車數據結構不同
                    const productName = isGuest ? item.productName : item.product.name
                    const productImage = isGuest ? item.productImage : parseImages(item.product.images)[0]
                    const quantity = item.quantity
                    const subtotal = isGuest ? (item.price * item.quantity) : item.subtotal

                    return (
                    <div key={isGuest ? `guest-${index}` : item.id} className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-100 flex-shrink-0 overflow-hidden">
                        {productImage ? (
                          <Image
                            src={productImage}
                            alt={productName}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            無圖
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black truncate">
                          {productName}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          數量: {quantity}
                        </p>
                        <p className="text-sm font-medium text-black mt-1">
                          NT$ {subtotal.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    )
                  })}
                </div>

                {/* 購物金選擇器（僅會員可用） */}
                {!isGuest && (
                  <div className="mb-6">
                    <CreditSelector
                      subtotal={cartTotal}
                      onChange={setCreditsToUse}
                    />
                  </div>
                )}

                {/* 價格明細 */}
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
                  {!isGuest && creditsToUse > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">購物金折抵</span>
                      <span className="text-green-600 font-medium">-NT$ {creditsToUse.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-base font-bold text-black uppercase">
                        總計
                      </span>
                      <span className="text-2xl font-black text-black">
                        NT$ {Math.max(0, cartTotal - (isGuest ? 0 : creditsToUse)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 提交按鈕 */}
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full py-4 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? '處理中...' : '確認訂單'}
                  </button>

                  <Link
                    href="/cart"
                    className="block w-full py-4 border-2 border-black text-black text-center rounded-full hover:bg-gray-50 transition-colors font-medium text-sm uppercase tracking-wide"
                  >
                    返回購物袋
                  </Link>
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
      </form>
    </div>
  )
}
