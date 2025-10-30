'use client'

/**
 * 訪客購物車 Context - 使用 localStorage 管理
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// 購物車項目類型
export interface GuestCartItem {
  productId: string
  productName: string
  productImage: string | null
  variantId?: string | null
  variantName?: string | null
  sizeEu: string
  color?: string | null
  quantity: number
  price: number
  stock: number
}

interface GuestCartContextType {
  items: GuestCartItem[]
  totalItems: number
  total: number
  addItem: (item: GuestCartItem) => void
  removeItem: (productId: string, variantId?: string | null, sizeEu?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string | null, sizeEu?: string) => void
  clearCart: () => void
  isLoading: boolean
}

const GuestCartContext = createContext<GuestCartContextType | undefined>(undefined)

const STORAGE_KEY = 'guest_cart'

export function GuestCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<GuestCartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 初始化：從 localStorage 載入購物車
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setItems(Array.isArray(parsed) ? parsed : [])
      }
    } catch (error) {
      console.error('載入訪客購物車失敗:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 每次 items 變化時同步到 localStorage
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      } catch (error) {
        console.error('儲存訪客購物車失敗:', error)
      }
    }
  }, [items, isLoading])

  // 計算總數量
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  // 計算總金額
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // 添加商品到購物車
  const addItem = (newItem: GuestCartItem) => {
    setItems((prev) => {
      // 檢查是否已存在（產品ID + 變體ID + 尺碼）
      const existingIndex = prev.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.variantId === newItem.variantId &&
          item.sizeEu === newItem.sizeEu
      )

      if (existingIndex >= 0) {
        // 已存在，增加數量
        const updated = [...prev]
        const newQuantity = updated[existingIndex].quantity + newItem.quantity

        // 檢查庫存限制
        if (newQuantity > newItem.stock) {
          alert(`${newItem.productName} 庫存不足（最多 ${newItem.stock} 件）`)
          return prev
        }

        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQuantity,
        }
        return updated
      } else {
        // 不存在，新增項目
        return [...prev, newItem]
      }
    })
  }

  // 移除商品
  const removeItem = (productId: string, variantId?: string | null, sizeEu?: string) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.variantId === variantId &&
            item.sizeEu === sizeEu
          )
      )
    )
  }

  // 更新數量
  const updateQuantity = (
    productId: string,
    quantity: number,
    variantId?: string | null,
    sizeEu?: string
  ) => {
    if (quantity <= 0) {
      removeItem(productId, variantId, sizeEu)
      return
    }

    setItems((prev) =>
      prev.map((item) => {
        if (
          item.productId === productId &&
          item.variantId === variantId &&
          item.sizeEu === sizeEu
        ) {
          // 檢查庫存限制
          if (quantity > item.stock) {
            alert(`${item.productName} 庫存不足（最多 ${item.stock} 件）`)
            return item
          }
          return { ...item, quantity }
        }
        return item
      })
    )
  }

  // 清空購物車
  const clearCart = () => {
    setItems([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <GuestCartContext.Provider
      value={{
        items,
        totalItems,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isLoading,
      }}
    >
      {children}
    </GuestCartContext.Provider>
  )
}

// Hook 使用 Context
export function useGuestCart() {
  const context = useContext(GuestCartContext)
  if (context === undefined) {
    throw new Error('useGuestCart must be used within a GuestCartProvider')
  }
  return context
}

// 匯出儲存鍵，供外部使用（例如登入後合併購物車）
export { STORAGE_KEY }
