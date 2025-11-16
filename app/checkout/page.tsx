'use client'

/**
 * 簡化結帳頁面 - 僅收集聯絡資訊，由藍新金流處理收件地址與付款
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
import CouponInput from '@/components/checkout/CouponInput'
import MembershipBenefitsBanner from '@/components/common/MembershipBenefitsBanner'

// 解析圖片陣列
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
  // 聯絡資訊（訪客結帳時必填）
  contactName: string
  contactPhone: string
  contactEmail: string
  notes: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const guestCart = useGuestCart()

  const [formData, setFormData] = useState<CheckoutFormData>({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [creditsToUse, setCreditsToUse] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)

  // 預填用戶資訊
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        contactName: user.name || '',
        contactPhone: user.phone || '',
        contactEmail: user.email || '',
      }))
    }
  }, [user])

  // 會員模式：從 GraphQL 獲取購物車
  const { data: cartData, loading: cartLoading } = useQuery(GET_CART, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only',
  })

  const [createOrder, { loading: creating }] = useMutation(CREATE_ORDER, {
    onCompleted: async (data) => {
      const orderId = data.createOrder.id
      const orderNumber = data.createOrder.orderNumber

      // 訪客模式：清空訪客購物車
      if (!isAuthenticated) {
        guestCart.clearCart()
      }

      // 立即跳轉到藍新金流支付
      try {
        const paymentResponse = await fetch('/api/newebpay/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            paymentTypes: ['CREDIT_CARD', 'VACC', 'CVS'], // 信用卡、ATM、超商
            itemDesc: `訂單 ${orderNumber}`,
          }),
        })

        const paymentData = await paymentResponse.json()

        if (paymentData.success) {
          // 自動提交表單到藍新金流
          const form = document.createElement('form')
          form.method = 'POST'
          form.action = paymentData.data.mpgUrl

          Object.entries(paymentData.data.formData).forEach(([key, value]) => {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            input.value = value as string
            form.appendChild(input)
          })

          document.body.appendChild(form)
          form.submit()
        } else {
          alert('建立付款失敗，請稍後再試')
          router.push(`/orders/${orderId}`)
        }
      } catch (error) {
        console.error('付款流程錯誤:', error)
        alert('付款流程發生錯誤，請稍後再試')
        router.push(`/orders/${orderId}`)
      }
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

  // 計算最終金額（扣除購物金和優惠券）
  const subtotal = cartTotal
  const couponDiscount = appliedCoupon?.discount || 0
  const creditDiscount = isGuest ? 0 : creditsToUse
  const finalTotal = Math.max(0, subtotal - couponDiscount - creditDiscount)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleApplyCoupon = (code: string, discount: number) => {
    setAppliedCoupon({ code, discount })
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // 驗證聯絡資訊
    if (!formData.contactName.trim()) {
      newErrors.contactName = '請輸入您的姓名'
    }
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = '請輸入您的手機號碼'
    } else if (!/^09\d{8}$/.test(formData.contactPhone.trim())) {
      newErrors.contactPhone = '請輸入有效的台灣手機號碼（例：0912345678）'
    }
    // Email 選填但要驗證格式
    if (formData.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim())) {
      newErrors.contactEmail = '請輸入有效的電子郵件'
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
      // 會員模式：傳遞空數組（後端會從購物車獲取）
      const orderItems = isGuest
        ? guestCart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            sizeEu: item.sizeEu,
            quantity: item.quantity,
          }))
        : [] // 會員模式：空數組（後端從購物車獲取）

      await createOrder({
        variables: {
          input: {
            // 訪客資訊
            isGuest,
            guestName: isGuest ? formData.contactName.trim() : null,
            guestPhone: isGuest ? formData.contactPhone.trim() : null,
            guestEmail: isGuest && formData.contactEmail ? formData.contactEmail.trim() : null,
            // 訂單項目
            items: orderItems,
            // 收件資訊（使用聯絡資訊作為佔位符，實際地址由藍新金流收集）
            shippingName: formData.contactName.trim(),
            shippingPhone: formData.contactPhone.trim(),
            shippingCountry: '台灣',
            shippingCity: '由藍新金流處理',
            shippingDistrict: '',
            shippingStreet: '將於付款時填寫收件地址',
            shippingZipCode: '',
            // 付款方式固定為藍新金流
            paymentMethod: 'NEWEBPAY',
            notes: formData.notes.trim() || null,
            // 購物金（僅會員可用）
            creditsToUse: !isGuest && creditsToUse > 0 ? creditsToUse : null,
            // 優惠券
            couponCode: appliedCoupon?.code || null,
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
            {/* 左側：聯絡資訊表單 */}
            <div className="lg:col-span-2 space-y-8">
              {/* 訪客模式：會員好處提示 */}
              {isGuest && (
                <MembershipBenefitsBanner variant="prominent" />
              )}

              {/* 藍新金流說明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">付款與物流說明</h3>
                    <p className="text-sm text-blue-800">
                      本網站使用<strong>藍新金流</strong>處理付款與物流。提交訂單後，您將跳轉到藍新金流頁面完成：
                    </p>
                    <ul className="mt-2 text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>選擇付款方式（信用卡/ATM/超商代碼）</li>
                      <li>填寫詳細收件地址</li>
                      <li>完成安全付款流程</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 聯絡資訊 */}
              <div>
                <h2 className="text-lg font-bold text-black uppercase tracking-tight mb-2">
                  聯絡資訊
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  請提供您的聯絡資訊以便訂單追蹤
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contactName" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                      姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="contactName"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 ${errors.contactName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                      placeholder="請輸入您的姓名"
                    />
                    {errors.contactName && (
                      <p className="mt-2 text-sm text-red-600">{errors.contactName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contactPhone" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                      手機號碼 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="contactPhone"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 ${errors.contactPhone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                      placeholder="0912345678"
                    />
                    {errors.contactPhone && (
                      <p className="mt-2 text-sm text-red-600">{errors.contactPhone}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      用於訂單追蹤和聯繫
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="contactEmail" className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
                      電子郵件（選填）
                    </label>
                    <input
                      type="email"
                      id="contactEmail"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 ${errors.contactEmail ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-black transition-colors bg-white`}
                      placeholder="your@email.com"
                    />
                    {errors.contactEmail && (
                      <p className="mt-2 text-sm text-red-600">{errors.contactEmail}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 訂單備註 */}
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
                    訂單摘要
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

                  {/* 優惠券輸入（會員和訪客都可用） */}
                  <div className="mb-6">
                    <CouponInput
                      orderAmount={subtotal}
                      onApplyCoupon={handleApplyCoupon}
                      appliedCoupon={appliedCoupon}
                      onRemoveCoupon={handleRemoveCoupon}
                    />
                  </div>

                  {/* 購物金選擇器（僅會員可用） */}
                  {!isGuest && (
                    <div className="mb-6">
                      <CreditSelector
                        subtotal={subtotal - couponDiscount}
                        onChange={setCreditsToUse}
                      />
                    </div>
                  )}

                  {/* 價格明細 */}
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">小計</span>
                      <span className="text-black font-medium">
                        NT$ {subtotal.toLocaleString()}
                      </span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">優惠券折扣</span>
                        <span className="text-green-600 font-medium">
                          -NT$ {couponDiscount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {!isGuest && creditsToUse > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">購物金折抵</span>
                        <span className="text-green-600 font-medium">
                          -NT$ {creditsToUse.toLocaleString()}
                        </span>
                      </div>
                    )}
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
                          NT$ {finalTotal.toLocaleString()}
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
                      {creating ? '處理中...' : '前往藍新金流付款'}
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
                  <span>由藍新金流提供安全付款</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
