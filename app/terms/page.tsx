'use client'

import React from 'react'
import Link from 'next/link'
import MarketplaceHeader from '@/components/navigation/MarketplaceHeader'
import MarketplaceFooter from '@/components/common/MarketplaceFooter'

export default function TermsPage() {
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
            <li className="text-orange-600 font-medium">服務條款</li>
          </ol>
        </nav>

        {/* 頁面內容 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">服務條款</h1>
          <p className="text-sm text-gray-600 mb-8">最後更新日期：2025年1月</p>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* 1. 服務條款的接受與適用 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. 服務條款的接受與適用</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  歡迎使用財神賣鞋電商平台（以下簡稱「本平台」）。當您使用本平台提供的服務時，即表示您已閱讀、了解並同意接受本服務條款之所有內容。
                </p>
                <p>
                  本平台保留隨時修改本服務條款的權利，修改後的條款將公布於網站上。若您於條款修改後繼續使用本服務，視為您已閱讀、了解並同意接受修改後的條款內容。
                </p>
              </div>
            </section>

            {/* 2. 會員註冊與帳號管理 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. 會員註冊與帳號管理</h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">2.1 註冊資格</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>會員必須年滿18歲或經法定代理人同意</li>
                  <li>註冊時應提供真實、正確、完整的個人資料</li>
                  <li>同一人不得重複註冊多個帳號</li>
                </ul>

                <p className="font-semibold mt-4">2.2 帳號安全</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>會員應妥善保管帳號及密碼，不得轉讓或出借他人使用</li>
                  <li>若發現帳號遭冒用或有安全疑慮，應立即通知本平台</li>
                  <li>會員需對其帳號下的所有行為負責</li>
                </ul>
              </div>
            </section>

            {/* 3. 商品與訂單 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. 商品與訂單</h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">3.1 商品資訊</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>本平台盡力確保商品資訊的準確性，但不保證完全無誤</li>
                  <li>商品圖片僅供參考，實際商品可能因拍攝或螢幕顯示而有色差</li>
                  <li>本平台保留隨時變更商品價格及庫存的權利</li>
                </ul>

                <p className="font-semibold mt-4">3.2 訂單處理</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>訂單成立後，系統將發送確認信至您的電子郵件</li>
                  <li>本平台保留接受或拒絕任何訂單的權利</li>
                  <li>若商品缺貨或價格錯誤，本平台將主動聯繫您處理</li>
                  <li>訂單確認後即進入處理流程，若需取消請立即聯繫客服</li>
                </ul>
              </div>
            </section>

            {/* 4. 付款方式 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. 付款方式</h2>
              <div className="space-y-3 text-gray-700">
                <p>本平台提供以下付款方式：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>信用卡線上刷卡</li>
                  <li>ATM 轉帳</li>
                  <li>超商代碼繳費</li>
                  <li>貨到付款</li>
                  <li>LINE Pay 行動支付</li>
                </ul>
                <p className="mt-4">
                  各付款方式可能有不同的手續費或限制，詳細資訊請參考結帳頁面說明。
                </p>
              </div>
            </section>

            {/* 5. 配送服務 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. 配送服務</h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>配送範圍限台灣本島及離島地區</li>
                  <li>一般商品約3-5個工作天送達（不含例假日）</li>
                  <li>超商取貨約2-3個工作天送達門市</li>
                  <li>宅配商品將由配合的物流公司送達指定地址</li>
                  <li>運費計算方式請參考購物須知或結帳頁面</li>
                </ul>
              </div>
            </section>

            {/* 6. 退換貨政策 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. 退換貨政策</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  依照消費者保護法規定，消費者享有商品到貨後7天猶豫期（非試用期）的權益。詳細退換貨規定請參閱
                  <Link href="/refund-policy" className="text-orange-600 hover:text-orange-700 underline">
                    退款政策
                  </Link>
                  頁面。
                </p>
              </div>
            </section>

            {/* 7. 會員權益與優惠 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. 會員權益與優惠</h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">7.1 會員等級制度</p>
                <p>
                  本平台設有會員等級制度（銅、銀、金、白金、鑽石），會員等級依累計消費金額自動升級，不同等級享有不同優惠。
                </p>

                <p className="font-semibold mt-4">7.2 購物金</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>購物金可於結帳時折抵部分金額</li>
                  <li>購物金有使用期限，逾期將自動失效</li>
                  <li>每筆訂單的購物金使用上限依活動規定而定</li>
                </ul>

                <p className="font-semibold mt-4">7.3 優惠券</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>優惠券使用條件依各券種規定而定</li>
                  <li>優惠券不得兌換現金或轉讓他人</li>
                  <li>每筆訂單限使用一張優惠券</li>
                </ul>
              </div>
            </section>

            {/* 8. 禁止事項 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. 禁止事項</h2>
              <div className="space-y-3 text-gray-700">
                <p>會員使用本平台服務時，不得有以下行為：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>利用本服務從事詐欺、洗錢或其他非法行為</li>
                  <li>散布電腦病毒或其他有害程式</li>
                  <li>破壞或干擾本平台系統運作</li>
                  <li>盜用他人帳號或個人資料</li>
                  <li>惡意大量下單後取消或退貨</li>
                  <li>以不正當手段獲取優惠或購物金</li>
                  <li>從事任何違反法律或本條款的行為</li>
                </ul>
              </div>
            </section>

            {/* 9. 智慧財產權 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. 智慧財產權</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  本平台所有內容，包括但不限於文字、圖片、影片、商標、標誌等，均受智慧財產權法保護。未經本平台書面同意，不得擅自重製、修改、散布或用於商業目的。
                </p>
              </div>
            </section>

            {/* 10. 責任限制 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. 責任限制</h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>本平台不對因天災、戰爭、罷工等不可抗力因素造成的服務中斷負責</li>
                  <li>本平台不對因網路傳輸問題、電腦故障等技術因素造成的損失負責</li>
                  <li>本平台不保證服務不會中斷或完全無錯誤</li>
                  <li>會員因違反本條款而產生的損害，本平台概不負責</li>
                </ul>
              </div>
            </section>

            {/* 11. 終止服務 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. 終止服務</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  若會員違反本服務條款或從事不當行為，本平台有權暫停或終止會員資格，並取消未完成的訂單，不另行通知。
                </p>
              </div>
            </section>

            {/* 12. 糾紛處理 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. 糾紛處理</h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">12.1 協商解決</p>
                <p>
                  若您對本平台服務有任何問題或糾紛，請先聯繫我們的客服團隊，我們將盡力協助解決。
                </p>

                <p className="font-semibold mt-4">12.2 客服聯絡方式</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>客服電話：0923-101-058</li>
                  <li>LINE 客服：@308mstvl</li>
                  <li>電子郵件：caishenmaixie@gmail.com</li>
                </ul>

                <p className="font-semibold mt-4">12.3 法律途徑</p>
                <p>
                  若無法透過協商解決，雙方同意以台灣台中地方法院為第一審管轄法院。
                </p>
              </div>
            </section>

            {/* 13. 其他條款 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. 其他條款</h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>本服務條款之解釋與適用，以及與本服務條款有關的爭議，均以中華民國法律為準據法</li>
                  <li>若本服務條款的任何條款被認定無效或無法執行，不影響其他條款的效力</li>
                  <li>本平台保留隨時修改或終止服務內容的權利</li>
                </ul>
              </div>
            </section>

            {/* 聯絡資訊 */}
            <section className="bg-orange-50 border border-orange-200 rounded-lg p-6 mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-3">如有疑問，歡迎聯絡我們</h3>
              <p className="text-gray-700 mb-2">財神賣鞋客服團隊</p>
              <p className="text-gray-700 mb-2">電話：0923-101-058</p>
              <p className="text-gray-700 mb-2">LINE：@308mstvl</p>
              <p className="text-gray-700">Email：caishenmaixie@gmail.com</p>
            </section>
          </div>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  )
}
