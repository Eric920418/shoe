'use client'

import Image from 'next/image'

/**
 * ProductImage - 優化的產品圖片組件
 *
 * 設計目的：減少 Vercel Image Transformations 用量
 *
 * 策略：
 * 1. 使用固定尺寸而非 fill，避免 Next.js 自動計算多種尺寸
 * 2. 對於 R2 CDN 圖片可選擇跳過優化（直接用原圖）
 * 3. 提供預設的產品卡片尺寸
 */

interface ProductImageProps {
  src: string
  alt: string
  /** 預設尺寸模式 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero'
  /** 自定義寬度（優先於 size） */
  width?: number
  /** 自定義高度（優先於 size） */
  height?: number
  /** 是否為優先載入（首屏圖片） */
  priority?: boolean
  /** 額外的 className */
  className?: string
  /** 是否跳過 Next.js 優化（用於 CDN 圖片） */
  unoptimized?: boolean
  /** hover 效果 */
  hoverScale?: boolean
}

// 預設尺寸對照表
const SIZE_MAP = {
  sm: { width: 150, height: 150 },   // 小型卡片（手機 2 欄）
  md: { width: 200, height: 200 },   // 中型卡片
  lg: { width: 280, height: 280 },   // 大型卡片（桌面 4 欄）
  xl: { width: 400, height: 400 },   // 產品詳情縮圖
  hero: { width: 1200, height: 600 }, // Hero 輪播圖
}

// 判斷是否為 R2 CDN 圖片
const isR2Image = (src: string) => {
  return src.includes('r2.dev') || src.includes('r2.cloudflarestorage.com')
}

export default function ProductImage({
  src,
  alt,
  size = 'md',
  width,
  height,
  priority = false,
  className = '',
  unoptimized,
  hoverScale = false,
}: ProductImageProps) {
  const dimensions = SIZE_MAP[size]
  const finalWidth = width || dimensions.width
  const finalHeight = height || dimensions.height

  // 自動判斷是否跳過優化：R2 圖片預設跳過
  const shouldSkipOptimization = unoptimized ?? isR2Image(src)

  // 處理空圖片
  if (!src || src === '/api/placeholder/200/200') {
    return (
      <div
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={{ width: finalWidth, height: finalHeight }}
      >
        <span className="text-gray-400 text-xs">No Image</span>
      </div>
    )
  }

  const baseClassName = hoverScale
    ? `object-cover transition-transform duration-300 group-hover:scale-105 ${className}`
    : `object-cover ${className}`

  // 如果跳過優化，使用原生 img
  if (shouldSkipOptimization) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={finalWidth}
        height={finalHeight}
        className={baseClassName}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    )
  }

  // 使用 Next.js Image 但固定尺寸
  return (
    <Image
      src={src}
      alt={alt}
      width={finalWidth}
      height={finalHeight}
      priority={priority}
      className={baseClassName}
      // 指定 sizes 避免生成過多變體
      sizes={`${finalWidth}px`}
    />
  )
}

/**
 * ProductCardImage - 產品卡片專用（aspect-square 容器內）
 *
 * 這個版本會填滿父容器，但使用固定的 srcset 尺寸
 */
export function ProductCardImage({
  src,
  alt,
  priority = false,
  className = '',
  hoverScale = true,
}: {
  src: string
  alt: string
  priority?: boolean
  className?: string
  hoverScale?: boolean
}) {
  // 處理空圖片
  if (!src || src === '/api/placeholder/200/200') {
    return (
      <div className={`w-full h-full bg-gray-100 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-xs">No Image</span>
      </div>
    )
  }

  const baseClassName = hoverScale
    ? `object-cover w-full h-full transition-transform duration-300 group-hover:scale-105 ${className}`
    : `object-cover w-full h-full ${className}`

  // R2 圖片使用原生 img
  if (isR2Image(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={baseClassName}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    )
  }

  // 非 CDN 圖片使用 Next.js Image，但限制 sizes
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      className={baseClassName}
      // 限制生成的尺寸變體
      sizes="(max-width: 640px) 180px, (max-width: 1024px) 220px, 280px"
    />
  )
}

/**
 * HeroImage - 首頁輪播圖專用
 */
export function HeroImage({
  src,
  alt,
  priority = false,
  className = '',
}: {
  src: string
  alt: string
  priority?: boolean
  className?: string
}) {
  if (!src) {
    return null
  }

  const baseClassName = `object-cover w-full h-full ${className}`

  // Hero 圖直接用原生 img（建議預先壓縮好）
  if (isR2Image(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={baseClassName}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    )
  }

  // 使用 Next.js Image 但指定固定尺寸
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      className={baseClassName}
      // Hero 只需要一個大尺寸
      sizes="100vw"
      quality={80}
    />
  )
}
