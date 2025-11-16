'use client'

import React from 'react'
import Link from 'next/link'
import MarketplaceHeader from '@/components/navigation/MarketplaceHeader'
import MarketplaceFooter from '@/components/common/MarketplaceFooter'
import { Shield, Eye, Lock, Database, UserCheck, AlertCircle } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* 麵包屑導航 */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li>
              <Link href="/" className="hover:text-orange-600 transition-colors">
                首頁
              </Link>
            </li>
            <li>/</li>
            <li className="text-orange-600 font-medium">隱私權政策</li>
          </ol>
        </nav>

        {/* 頁面內容 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">隱私權政策</h1>
          </div>
          <p className="text-sm text-gray-600 mb-8">最後更新日期：2025年1月</p>

          {/* 重點摘要 */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-600" />
              隱私保護承諾
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              財神賣鞋重視您的隱私權，我們承諾依據個人資料保護法及相關法規，妥善保護您的個人資料安全。
              本隱私權政策說明我們如何蒐集、使用、儲存及保護您的個人資料。
            </p>
          </div>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* 1. 適用範圍 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. 適用範圍</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  本隱私權政策適用於您在財神賣鞋網站及相關服務中所提供的個人資料。
                  當您使用本網站服務時，即表示您已閱讀、了解並同意本隱私權政策的所有內容。
                </p>
                <p className="font-semibold">不適用範圍：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>本網站連結的其他第三方網站</li>
                  <li>非本網站委託或參與管理的人員</li>
                </ul>
              </div>
            </section>

            {/* 2. 個人資料的蒐集 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="w-6 h-6 text-orange-600" />
                2. 個人資料的蒐集
              </h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">2.1 我們蒐集的資料類型</p>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">會員註冊資料：</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>姓名、電子郵件、電話號碼</li>
                    <li>出生日期（用於生日優惠）</li>
                    <li>性別（選填）</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">交易與訂單資料：</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>收貨地址、聯絡資訊</li>
                    <li>付款方式資訊（不儲存完整信用卡號）</li>
                    <li>訂單歷史紀錄</li>
                    <li>購物金與優惠券使用紀錄</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">自動蒐集資料：</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>IP 位址、瀏覽器類型</li>
                    <li>裝置資訊（作業系統、螢幕解析度）</li>
                    <li>Cookie 與類似技術</li>
                    <li>網站使用行為（瀏覽頁面、點擊紀錄）</li>
                  </ul>
                </div>

                <p className="font-semibold mt-4">2.2 蒐集方式</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>會員主動註冊或填寫資料</li>
                  <li>使用網站服務時自動記錄</li>
                  <li>透過客服互動提供的資訊</li>
                  <li>參加活動或問卷調查</li>
                </ul>
              </div>
            </section>

            {/* 3. 個人資料的使用目的 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. 個人資料的使用目的</h2>
              <div className="space-y-3 text-gray-700">
                <p>我們蒐集您的個人資料，用於以下目的：</p>

                <div className="space-y-4">
                  <div className="border-l-4 border-orange-500 pl-4">
                    <p className="font-semibold">訂單處理與配送</p>
                    <p className="text-sm">處理您的訂單、安排商品配送、提供售後服務</p>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4">
                    <p className="font-semibold">帳戶管理</p>
                    <p className="text-sm">建立及管理您的會員帳戶、會員等級升級</p>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4">
                    <p className="font-semibold">客戶服務</p>
                    <p className="text-sm">回應您的詢問、處理退換貨、解決問題</p>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4">
                    <p className="font-semibold">行銷推廣</p>
                    <p className="text-sm">發送促銷活動、新品資訊、會員專屬優惠（需經您同意）</p>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4">
                    <p className="font-semibold">網站改善</p>
                    <p className="text-sm">分析網站使用情況、優化使用者體驗</p>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4">
                    <p className="font-semibold">法律遵循</p>
                    <p className="text-sm">遵守法律要求、防止詐欺、保護權益</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. 個人資料的分享與揭露 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. 個人資料的分享與揭露</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  我們不會販售您的個人資料。僅在以下情況下，會與第三方分享您的資料：
                </p>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">服務提供商：</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>物流配送公司（配送訂單所需）</li>
                    <li>金流服務商（處理付款交易）</li>
                    <li>雲端儲存服務商（資料託管）</li>
                    <li>行銷服務商（經您同意後）</li>
                  </ul>
                  <p className="text-sm mt-2 text-gray-600">
                    這些第三方僅能在提供服務範圍內使用您的資料，並負有保密義務。
                  </p>
                </div>

                <p className="font-semibold mt-4">法律要求：</p>
                <p>
                  當政府機關依法要求、法院命令、或為保護本網站及使用者的權益安全時，
                  我們可能會揭露您的個人資料。
                </p>
              </div>
            </section>

            {/* 5. Cookie 與追蹤技術 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookie 與追蹤技術</h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">5.1 什麼是 Cookie？</p>
                <p>
                  Cookie 是網站儲存在您瀏覽器中的小型文字檔案，用於記錄您的偏好設定和瀏覽行為。
                </p>

                <p className="font-semibold mt-4">5.2 我們如何使用 Cookie？</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>必要 Cookie：</strong>維持網站基本功能（如購物車、登入狀態）</li>
                  <li><strong>分析 Cookie：</strong>了解網站使用情況、改善服務</li>
                  <li><strong>功能 Cookie：</strong>記住您的偏好設定</li>
                  <li><strong>行銷 Cookie：</strong>提供個人化廣告（需經您同意）</li>
                </ul>

                <p className="font-semibold mt-4">5.3 如何管理 Cookie？</p>
                <p>
                  您可以透過瀏覽器設定來拒絕或刪除 Cookie，但這可能影響網站的部分功能。
                </p>
              </div>
            </section>

            {/* 6. 資料安全保護 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-orange-600" />
                6. 資料安全保護
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>我們採取以下措施保護您的個人資料：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>使用 SSL/TLS 加密技術保護資料傳輸</li>
                  <li>資料庫加密儲存敏感資訊</li>
                  <li>定期進行系統安全檢測</li>
                  <li>限制員工存取權限，僅授權人員可存取個人資料</li>
                  <li>定期備份資料以防資料遺失</li>
                </ul>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <span>
                      雖然我們盡力保護您的資料安全，但網路傳輸無法保證100%安全。
                      請妥善保管您的帳號密碼，不要與他人分享。
                    </span>
                  </p>
                </div>
              </div>
            </section>

            {/* 7. 資料保存期限 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. 資料保存期限</h2>
              <div className="space-y-3 text-gray-700">
                <p>我們會依據以下原則保存您的個人資料：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>會員資料：</strong>保存至您要求刪除或帳戶閒置超過2年</li>
                  <li><strong>交易紀錄：</strong>依稅法規定保存7年</li>
                  <li><strong>行銷資料：</strong>經您同意後使用，可隨時取消訂閱</li>
                  <li><strong>Cookie：</strong>依各 Cookie 類型設定的期限</li>
                </ul>
              </div>
            </section>

            {/* 8. 您的權利 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-orange-600" />
                8. 您的權利
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>依據個人資料保護法，您擁有以下權利：</p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold mb-2">查詢與閱覽</p>
                    <p className="text-sm">查看我們持有的您的個人資料</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold mb-2">製給複製本</p>
                    <p className="text-sm">要求提供個人資料的副本</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold mb-2">補充或更正</p>
                    <p className="text-sm">更新或修正不正確的資料</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold mb-2">停止蒐集、處理或利用</p>
                    <p className="text-sm">要求停止使用您的個人資料</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold mb-2">刪除</p>
                    <p className="text-sm">要求刪除您的個人資料</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold mb-2">取消行銷</p>
                    <p className="text-sm">隨時取消訂閱行銷郵件</p>
                  </div>
                </div>

                <p className="mt-4">
                  如需行使上述權利，請透過以下方式聯繫我們：
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>客服電話：0923-101-058</li>
                  <li>LINE：@308mstvl</li>
                  <li>Email：caishenmaixie@gmail.com</li>
                </ul>
              </div>
            </section>

            {/* 9. 未成年人隱私 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. 未成年人隱私</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  本網站服務對象為年滿18歲之成年人。若您未滿18歲，請在法定代理人同意下使用本服務。
                  我們不會故意蒐集未成年人的個人資料。
                </p>
              </div>
            </section>

            {/* 10. 隱私權政策的變更 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. 隱私權政策的變更</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  我們保留隨時修改本隱私權政策的權利。當我們進行重大變更時，
                  會在網站上公告並透過電子郵件通知您（若您已提供聯絡資訊）。
                </p>
                <p>
                  建議您定期查閱本政策，以了解我們如何保護您的個人資料。
                </p>
              </div>
            </section>

            {/* 11. 國際資料傳輸 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. 國際資料傳輸</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  您的個人資料主要儲存於台灣。若因服務需要將資料傳輸至其他國家，
                  我們會確保該國家或接收方提供足夠的資料保護措施。
                </p>
              </div>
            </section>

            {/* 聯絡資訊 */}
            <section className="bg-orange-50 border border-orange-200 rounded-lg p-6 mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-3">隱私權相關問題</h3>
              <p className="text-gray-700 mb-4">
                如對本隱私權政策有任何疑問，或需行使您的個人資料權利，歡迎聯繫我們：
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>財神賣鞋客服團隊</strong></p>
                <p>電話：0923-101-058</p>
                <p>LINE：@308mstvl</p>
                <p>Email：caishenmaixie@gmail.com</p>
                <p className="text-sm text-gray-600 mt-3">
                  我們將在收到您的請求後，於10個工作天內回覆。
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  )
}
