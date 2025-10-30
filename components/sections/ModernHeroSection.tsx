'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useQuery, gql } from '@apollo/client'

const GET_ACTIVE_HERO_SLIDES = gql`
  query GetActiveHeroSlides {
    activeHeroSlides {
      id
      title
      subtitle
      description
      image
      cta
      link
      sortOrder
    }
  }
`

export default function ModernHeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const { data, loading } = useQuery(GET_ACTIVE_HERO_SLIDES, {
    fetchPolicy: 'cache-and-network',
  })

  const slides = data?.activeHeroSlides || []

  useEffect(() => {
    if (slides.length === 0) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  // 載入中
  if (loading) {
    return (
      <section className="relative h-screen w-full overflow-hidden bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </section>
    )
  }

  // 沒有輪播圖
  if (slides.length === 0) {
    return null
  }

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* 輪播圖片背景 */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            currentSlide === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* 背景圖片 */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${slide.image})`,
            }}
          >
            {/* 漸層遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
          </div>

          {/* 內容 */}
          <div className="relative h-full flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-2xl">
                {/* 小標題 */}
                <div className="overflow-hidden mb-3 sm:mb-4">
                  <p
                    className={`text-xs sm:text-sm md:text-base font-semibold tracking-wider sm:tracking-widest uppercase text-white/80 transform transition-all duration-700 delay-200 ${
                      currentSlide === index
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-full opacity-0'
                    }`}
                  >
                    {slide.subtitle}
                  </p>
                </div>

                {/* 主標題 */}
                <div className="overflow-hidden mb-4 sm:mb-6">
                  <h1
                    className={`text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-tight sm:leading-none transform transition-all duration-700 delay-300 ${
                      currentSlide === index
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-full opacity-0'
                    }`}
                  >
                    {slide.title}
                  </h1>
                </div>

                {/* 描述 */}
                <div className="overflow-hidden mb-6 sm:mb-8">
                  <p
                    className={`text-base sm:text-xl md:text-2xl text-white/90 transform transition-all duration-700 delay-400 ${
                      currentSlide === index
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-full opacity-0'
                    }`}
                  >
                    {slide.description}
                  </p>
                </div>

                {/* CTA 按鈕 */}
                <div className="overflow-hidden">
                  <Link
                    href={slide.link}
                    className={`inline-block px-6 py-3 sm:px-8 sm:py-4 bg-white text-black font-bold text-base sm:text-lg rounded-full hover:bg-gray-100 transition-all transform hover:scale-105 duration-700 delay-500 ${
                      currentSlide === index
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-full opacity-0'
                    }`}
                  >
                    {slide.cta}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* 輪播指示器 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSlide === index
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* 向下滾動提示 */}
      <div className="absolute bottom-8 right-8 z-20 animate-bounce">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  )
}
