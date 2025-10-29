import type { Metadata } from 'next'
import './globals.css'
import { ApolloProvider } from '@/components/providers/ApolloProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import MainNav from '@/components/navigation/MainNav'

export const metadata: Metadata = {
  title: '鞋店電商系統',
  description: '專業的線上鞋店電商平臺',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">
        <ApolloProvider>
          <AuthProvider>
            <MainNav />
            <main className="pt-16">
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
          </AuthProvider>
        </ApolloProvider>
      </body>
    </html>
  )
}
