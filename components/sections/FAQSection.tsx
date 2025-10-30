'use client'

import { useState } from 'react'
import { useQuery, gql } from '@apollo/client'

const GET_FAQS = gql`
  query GetFaqs {
    faqs {
      id
      question
      answer
      category
      sortOrder
    }
  }
`

interface FAQItem {
  id: string
  question: string
  answer: string
  category?: string
  sortOrder: number
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { data, loading, error } = useQuery(GET_FAQS)

  const faqs: FAQItem[] = data?.faqs || []

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  if (loading) {
    return (
      <section className="py-20 lg:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-gray-500 mb-4">
              FAQ
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black mb-6 tracking-tight">
              常見問題
            </h2>
            <p className="text-gray-600">載入中...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error || faqs.length === 0) {
    return null // 如果沒有 FAQ 或出錯，不顯示這個區塊
  }

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 標題區 */}
        <div className="text-center mb-16">
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-gray-500 mb-4">
            FAQ
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black mb-6 tracking-tight">
            常見問題
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            找不到答案？歡迎聯繫我們的 24/7 客服團隊
          </p>
        </div>

        {/* FAQ 手風琴列表 */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border-b border-gray-200 last:border-b-0 overflow-hidden"
            >
              {/* 問題按鈕 */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left py-6 px-2 flex items-center justify-between gap-4 group hover:bg-gray-50/50 transition-colors duration-200"
                aria-expanded={openIndex === index}
              >
                <span className="text-lg sm:text-xl font-bold text-black group-hover:text-gray-700 transition-colors pr-4">
                  {faq.question}
                </span>
                <div
                  className={`flex-shrink-0 w-8 h-8 flex items-center justify-center transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : 'rotate-0'
                  }`}
                >
                  <svg
                    className="w-6 h-6 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* 答案內容 */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index
                    ? 'max-h-96 opacity-100'
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-2 pb-6 text-gray-600 leading-relaxed text-base sm:text-lg">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 聯繫客服 CTA */}
        <div className="mt-16 text-center">
          <div className="inline-block">
            <p className="text-sm text-gray-500 mb-4">還有其他問題？</p>
            <a
              href="/account/support"
              className="inline-block bg-black text-white font-bold px-8 sm:px-12 py-4 rounded-full hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 text-sm sm:text-base tracking-wide"
            >
              聯繫客服
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
