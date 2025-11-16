'use client'

import React from 'react'
import Link from 'next/link'
import MarketplaceHeader from '@/components/navigation/MarketplaceHeader'
import MarketplaceFooter from '@/components/common/MarketplaceFooter'
import {
  Store, Users, Award, TrendingUp, Heart, Shield,
  MapPin, Phone, Mail, Clock
} from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* 麵包屑導航 */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li>
              <Link href="/" className="hover:text-orange-600 transition-colors">
                首頁
              </Link>
            </li>
            <li>/</li>
            <li className="text-orange-600 font-medium">關於我們</li>
          </ol>
        </nav>

        {/* 頁面標題 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">關於財神賣鞋</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            您值得信賴的鞋履專賣平台，為您提供優質商品與專業服務
          </p>
        </div>

        {/* 品牌故事 */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Store className="w-8 h-8 text-orange-600" />
            <h2 className="text-3xl font-bold text-gray-900">品牌故事</h2>
          </div>

          <div className="prose prose-gray max-w-none space-y-4 text-gray-700">
            <p className="text-lg leading-relaxed">
              財神賣鞋成立於台中，是一家專注於提供優質鞋履商品的專業電商平台。
              我們深信，一雙好鞋不僅能帶來舒適的穿著體驗，更能為生活增添自信與活力。
            </p>

            <p className="leading-relaxed">
              多年來，我們堅持從全球精選優質品牌鞋款，包含運動鞋、休閒鞋、皮鞋、靴子等多元品類，
              致力於為每一位顧客找到最適合的鞋子。無論您是追求時尚潮流、注重運動機能，
              或是需要正式商務鞋款，在財神賣鞋都能找到理想的選擇。
            </p>

            <p className="leading-relaxed">
              我們不僅提供商品銷售，更重視與顧客之間的信任關係。從專業的商品諮詢、完善的售後服務，
              到便利的購物體驗，每一個環節都是我們用心經營的成果。
            </p>
          </div>
        </div>

        {/* 核心價值 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">100% 正品保證</h3>
            <p className="text-sm text-gray-600">
              所有商品皆為原廠正品，絕不販售仿冒品，給您最安心的購物保障
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">專業客服</h3>
            <p className="text-sm text-gray-600">
              24小時全年無休客服團隊，隨時為您解答疑問，提供專業建議
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">品質嚴選</h3>
            <p className="text-sm text-gray-600">
              嚴格把關每一件商品，確保品質優良，讓您買得放心、穿得舒心
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">持續創新</h3>
            <p className="text-sm text-gray-600">
              不斷優化購物體驗，引進最新商品，滿足顧客多元需求
            </p>
          </div>
        </div>

        {/* 服務特色 */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-8 h-8 text-orange-600" />
            <h2 className="text-3xl font-bold text-gray-900">服務特色</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">多元付款方式</h3>
              <p className="text-gray-700 text-sm">
                支援信用卡、ATM轉帳、超商代碼、貨到付款、LINE Pay等多種付款方式，
                讓您選擇最方便的結帳方式。
              </p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">快速配送</h3>
              <p className="text-gray-700 text-sm">
                提供宅配到府、超商取貨等配送服務，一般商品3-5個工作天即可送達，
                讓您快速收到心儀的鞋款。
              </p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">7天鑑賞期</h3>
              <p className="text-gray-700 text-sm">
                依照消費者保護法，提供7天鑑賞期服務。若商品不符需求，
                可於收貨後7天內申請退換貨。
              </p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">會員回饋制度</h3>
              <p className="text-gray-700 text-sm">
                完善的會員等級制度，消費累積購物金，升級享更多優惠。
                定期推出會員專屬活動與折扣。
              </p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">專業尺碼建議</h3>
              <p className="text-gray-700 text-sm">
                提供詳細尺碼對照表（EUR/US/UK/CM），並有專業客服協助選擇合適尺寸，
                降低尺寸不合的困擾。
              </p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">安全交易保障</h3>
              <p className="text-gray-700 text-sm">
                採用SSL加密技術保護交易安全，個人資料嚴格保密，
                讓您安心購物無後顧之憂。
              </p>
            </div>
          </div>
        </div>

        {/* 公司資訊 */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-8 h-8 text-orange-600" />
            <h2 className="text-3xl font-bold text-gray-900">公司資訊</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">公司名稱</h3>
                <p className="text-gray-700">財神賣鞋</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">統一編號</h3>
                <p className="text-gray-700">14975713</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">營業地址</h3>
                <p className="text-gray-700 flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  台中市自由路二段9號1樓
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">客服電話</h3>
                <p className="text-gray-700 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-orange-600" />
                  <a href="tel:0923-101-058" className="hover:text-orange-600 transition-colors">
                    0923-101-058
                  </a>
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">客服信箱</h3>
                <p className="text-gray-700 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-orange-600" />
                  <a
                    href="mailto:caishenmaixie@gmail.com"
                    className="hover:text-orange-600 transition-colors"
                  >
                    caishenmaixie@gmail.com
                  </a>
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">服務時間</h3>
                <p className="text-gray-700 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  24小時全年無休
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">LINE 客服</h3>
                <p className="text-gray-700">
                  <a
                    href="https://lin.ee/McVV87T"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 transition-colors"
                  >
                    @308mstvl（點擊加入）
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 營業項目 */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">營業項目</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">運動鞋類</h3>
              <p className="text-sm text-gray-600">
                各大品牌運動鞋、跑鞋、籃球鞋、訓練鞋等
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">休閒鞋類</h3>
              <p className="text-sm text-gray-600">
                帆布鞋、板鞋、懶人鞋、樂福鞋等
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">皮鞋類</h3>
              <p className="text-sm text-gray-600">
                商務皮鞋、牛津鞋、德比鞋、孟克鞋等
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">靴類</h3>
              <p className="text-sm text-gray-600">
                短靴、長靴、雪靴、馬丁靴等
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">涼鞋/拖鞋</h3>
              <p className="text-sm text-gray-600">
                運動涼鞋、休閒拖鞋、室內拖鞋等
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">兒童鞋類</h3>
              <p className="text-sm text-gray-600">
                兒童運動鞋、學步鞋、童鞋等
              </p>
            </div>
          </div>
        </div>

        {/* 聯絡我們CTA */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">有任何問題嗎？</h2>
          <p className="text-lg mb-6">
            我們的客服團隊隨時準備為您服務，歡迎透過以下方式與我們聯繫
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              聯絡我們
            </Link>
            <a
              href="https://lin.ee/McVV87T"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              LINE 客服
            </a>
            <a
              href="tel:0923-101-058"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              撥打電話
            </a>
          </div>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  )
}
