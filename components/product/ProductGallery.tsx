'use client'

/**
 * 產品圖片展示組件
 */

import { useState } from 'react'
import Image from 'next/image'

interface ProductGalleryProps {
  images: string[]
  productName: string
}

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)

  // 如果沒有圖片，顯示佔位圖
  const displayImages = images.length > 0 ? images : ['/placeholder-shoe.png']

  return (
    <div className="space-y-4">
      {/* 主圖 */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <Image
          src={displayImages[selectedImage]}
          alt={`${productName} - 圖${selectedImage + 1}`}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* 縮略圖 */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`
                relative aspect-square bg-gray-100 rounded-lg overflow-hidden
                border-2 transition-all
                ${
                  selectedImage === index
                    ? 'border-primary-600 ring-2 ring-primary-200'
                    : 'border-gray-300 hover:border-gray-400'
                }
              `}
            >
              <Image
                src={image}
                alt={`${productName} - 縮略圖${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
