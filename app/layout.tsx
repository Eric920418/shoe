import type { Metadata } from 'next'
import './globals.css'
import { ApolloProvider } from '@/components/providers/ApolloProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { GuestCartProvider } from '@/contexts/GuestCartContext'
import { CartProvider } from '@/contexts/CartContext'
import { Toaster } from 'react-hot-toast'
import { Suspense } from 'react'
import ReferralTracker from '@/components/common/ReferralTracker'

export const metadata: Metadata = {
  title: '財神賣鞋 - 現代化鞋履電商',
  description: '打造你的完美風格 - 提供最新潮流鞋款、專業尺碼建議與頂級購物體驗',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" className="overflow-x-hidden">
      <body className="antialiased bg-white overflow-x-hidden">
        <ApolloProvider>
          <AuthProvider>
            <GuestCartProvider>
              <CartProvider>
                <Suspense fallback={null}>
                  <ReferralTracker />
                </Suspense>
                <main>
                  {children}
                </main>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </CartProvider>
            </GuestCartProvider>
          </AuthProvider>
        </ApolloProvider>
      </body>
    </html>
  )
}
