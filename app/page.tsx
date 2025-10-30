import ModernHeader from '@/components/navigation/ModernHeader'
import ModernFooter from '@/components/common/ModernFooter'
import ModernHeroSection from '@/components/sections/ModernHeroSection'
import FeaturedProducts from '@/components/sections/FeaturedProducts'
import CategoryShowcase from '@/components/sections/CategoryShowcase'
import NewArrivals from '@/components/sections/NewArrivals'
import BrandStory from '@/components/sections/BrandStory'
import FAQSection from '@/components/sections/FAQSection'
import AnnouncementWrapper from '@/components/common/AnnouncementWrapper'
import ReferralTracker from '@/components/common/ReferralTracker'

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden w-full">
      {/* 邀請碼追蹤 */}
      <ReferralTracker />

      {/* 導航欄 */}
      <ModernHeader />

      {/* 系統公告 */}
      <AnnouncementWrapper />

      {/* 全屏英雄區塊 */}
      <ModernHeroSection />

      {/* 精選產品 */}
      <FeaturedProducts />

      {/* 分類展示 */}
      <CategoryShowcase />

      {/* 新品上市 */}
      <NewArrivals />

      {/* 品牌故事 */}
      <BrandStory />

      {/* 常見問題 */}
      <FAQSection />

      {/* 頁尾 */}
      <ModernFooter />
    </div>
  )
}
