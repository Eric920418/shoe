'use client'

/**
 * 統一購物車 Context - 避免重複查詢
 *
 * 優化說明：
 * ✅ 統一管理會員購物車查詢，避免多個組件重複調用 GET_CART
 * ✅ 統一管理願望清單查詢，避免重複調用 GET_MY_WISHLIST
 * ✅ 使用 cache-first 策略減少網路請求
 * ✅ 自動根據登入狀態切換到訪客購物車
 *
 * 使用方式：
 * import { useCart } from '@/contexts/CartContext'
 * const { cartCount, wishlistCount, refetchCart } = useCart()
 */

import { createContext, useContext, ReactNode, useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { GET_CART, GET_MY_WISHLIST } from '@/graphql/queries'
import { useAuth } from './AuthContext'
import { useGuestCart } from './GuestCartContext'

interface CartContextType {
  // 購物車數據
  cartCount: number
  cartTotal: number
  cartItems: any[]
  cartLoading: boolean

  // 願望清單數據
  wishlistCount: number
  wishlistItems: any[]
  wishlistLoading: boolean

  // 重新獲取數據
  refetchCart: () => void
  refetchWishlist: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const guestCart = useGuestCart()

  // 會員購物車查詢（只在登入時執行）
  const { data: cartData, loading: cartLoading, refetch: refetchCart } = useQuery(GET_CART, {
    skip: !isAuthenticated, // 👈 未登入時跳過查詢
    fetchPolicy: 'cache-first', // 👈 優先使用快取
    nextFetchPolicy: 'cache-first',
  })

  // 願望清單查詢（只在登入時執行）
  const { data: wishlistData, loading: wishlistLoading, refetch: refetchWishlist } = useQuery(GET_MY_WISHLIST, {
    skip: !isAuthenticated, // 👈 未登入時跳過查詢
    fetchPolicy: 'cache-first', // 👈 優先使用快取
    nextFetchPolicy: 'cache-first',
  })

  // 計算購物車數量（會員或訪客）
  const cartCount = useMemo(() => {
    if (isAuthenticated) {
      return cartData?.cart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
    }
    return guestCart.items.reduce((sum, item) => sum + item.quantity, 0)
  }, [isAuthenticated, cartData, guestCart.items])

  // 計算購物車總額
  const cartTotal = useMemo(() => {
    if (isAuthenticated) {
      return cartData?.cart?.total || 0
    }
    return guestCart.total
  }, [isAuthenticated, cartData, guestCart.total])

  // 購物車項目
  const cartItems = useMemo(() => {
    if (isAuthenticated) {
      return cartData?.cart?.items || []
    }
    return guestCart.items
  }, [isAuthenticated, cartData, guestCart.items])

  // 願望清單數量
  const wishlistCount = wishlistData?.myWishlist?.length || 0
  const wishlistItems = wishlistData?.myWishlist || []

  const value: CartContextType = {
    cartCount,
    cartTotal,
    cartItems,
    cartLoading: isAuthenticated ? cartLoading : guestCart.isLoading,
    wishlistCount,
    wishlistItems,
    wishlistLoading,
    refetchCart,
    refetchWishlist,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// 自定義 Hook
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
