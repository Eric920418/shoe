import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import MainNav from '@/components/navigation/MainNav'
import ReferralTracker from '@/components/common/ReferralTracker'
import Link from 'next/link'

// 動態導入重組件，減少首次載入
const HeroSection = dynamic(() => import('@/components/sections/HeroSection'), {
  loading: () => <div className="h-[600px] bg-gradient-to-br from-amber-900/20 to-black animate-pulse" />,
})

const OptimizedProductsSection = dynamic(() => import('@/components/sections/OptimizedProductsSection'), {
  loading: () => <div className="h-[800px] bg-black animate-pulse" />,
})

const BrandsSection = dynamic(() => import('@/components/sections/BrandsSection'), {
  loading: () => <div className="h-[400px] bg-black animate-pulse" />,
})

const AboutSection = dynamic(() => import('@/components/sections/AboutSection'), {
  loading: () => <div className="h-[400px] bg-black animate-pulse" />,
})

const AnnouncementWrapper = dynamic(() => import('@/components/common/AnnouncementWrapper'), {
  ssr: true, // 保持 SSR 以便 SEO
})

// 優化 metadata
export const metadata: Metadata = {
  title: '潮流鞋店 | 專業鞋類電商平台',
  description: '提供多國尺碼對照、豐富配色選擇與智能尺碼建議，輕鬆找到最適合的鞋款',
  keywords: '運動鞋,休閒鞋,潮鞋,跑鞋,籃球鞋,尺碼對照',
  openGraph: {
    title: '潮流鞋店 - 專業鞋類電商平台',
    description: '嚴選全球頂尖品牌，提供最完整的尺碼與配色選擇',
    type: 'website',
  },
}

// 啟用靜態生成
export const revalidate = 3600 // 每小時重新驗證一次

// 精簡的 Footer 組件（避免重複代碼）
function OptimizedFooter() {
  const footerLinks = {
    quick: [
      { href: '/products', label: '所有商品' },
      { href: '/cart', label: '購物車' },
      { href: '/account', label: '我的帳戶' },
    ],
    service: [
      { href: '/size-guide', label: '尺碼對照表' },
      { href: '/return-policy', label: '退換貨政策' },
      { href: '/faq', label: '常見問題' },
    ],
  }

  return (
    <footer className="black-color py-12 border-t border-amber-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* 品牌資訊 */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold-deep)] rounded-lg flex items-center justify-center">
                <span className="text-2xl">👟</span>
              </div>
              <h3 className="text-2xl font-bold text-amber-100">潮流鞋店</h3>
            </div>
            <p className="text-amber-100/70 mb-4 max-w-md">
              專業的在線鞋履電商平台，提供最佳購物體驗
            </p>
          </div>

          {/* 快速連結 */}
          <div>
            <h4 className="text-lg font-semibold text-amber-100 mb-4">快速連結</h4>
            <ul className="space-y-2">
              {footerLinks.quick.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-amber-100/70 hover:text-[var(--gold-base)] transition-colors"
                    prefetch={false}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 客戶服務 */}
          <div>
            <h4 className="text-lg font-semibold text-amber-100 mb-4">客戶服務</h4>
            <ul className="space-y-2">
              {footerLinks.service.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-amber-100/70 hover:text-[var(--gold-base)] transition-colors"
                    prefetch={false}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 版權資訊 */}
        <div className="pt-8 border-t border-amber-900/30 text-center text-amber-100/60">
          <p>&copy; 2025 潮流鞋店. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default function OptimizedHomePage() {
  return (
    <div className="min-h-screen">
      {/* 關鍵組件保持同步載入 */}
      <ReferralTracker />
      <MainNav />

      {/* 公告使用動態載入但保持 SSR */}
      <AnnouncementWrapper />

      {/* 主要內容區塊使用動態載入 */}
      <HeroSection />
      <OptimizedProductsSection />
      <BrandsSection />
      <AboutSection />

      {/* 優化的頁尾 */}
      <OptimizedFooter />
    </div>
  )
}