'use client'

/**
 * 認證上下文 - 管理全局用戶認證狀態
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createAuthenticatedClient } from '@/lib/apollo-client'

interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string | null
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: User) => void
  getAuthenticatedClient: () => ReturnType<typeof createAuthenticatedClient> | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 初始化：從 localStorage 讀取登入狀態
  useEffect(() => {
    const initAuth = () => {
      try {
        // 檢查是否在瀏覽器環境
        if (typeof window === 'undefined') {
          setIsLoading(false)
          return
        }

        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser)
          setToken(storedToken)
          setUser(parsedUser)
          console.log('✅ 認證狀態已載入:', {
            userId: parsedUser.id,
            role: parsedUser.role,
            email: parsedUser.email
          })
        } else {
          console.log('ℹ️ 未找到已儲存的認證狀態')
        }
      } catch (error) {
        console.error('❌ 載入認證狀態失敗:', error)
        // 清除可能損壞的資料
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } finally {
        // 確保無論如何都設置 isLoading 為 false
        setIsLoading(false)
        console.log('✅ 認證初始化完成')
      }
    }

    // 使用 setTimeout 確保在客戶端渲染後執行
    const timer = setTimeout(initAuth, 0)
    return () => clearTimeout(timer)
  }, [])

  // 登入
  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))

    // 設置 Cookie 給 middleware 使用
    document.cookie = `token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}` // 7 天
  }

  // 登出
  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('cart')
    sessionStorage.clear()

    // 清除 Cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'
  }

  // 更新用戶資訊
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  // 獲取帶認證的 Apollo Client
  const getAuthenticatedClient = () => {
    if (!token) return null
    return createAuthenticatedClient(token)
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    updateUser,
    getAuthenticatedClient,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 自定義 Hook 來使用 AuthContext
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
