'use client'

/**
 * 產品圖片/影片展示組件
 */

import { useState, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { HeroImage, ProductCardImage } from '@/components/common/ProductImage'

interface ProductGalleryProps {
  images: string[]
  productName: string
}

// 判斷 URL 是否為影片
const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.webm']
  const lowerUrl = url.toLowerCase()
  return videoExtensions.some((ext) => lowerUrl.includes(ext))
}

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  // 如果沒有圖片，顯示佔位圖
  const displayImages = images.length > 0 ? images : ['/placeholder-shoe.png']
  const currentMedia = displayImages[selectedImage]
  const isCurrentVideo = isVideoUrl(currentMedia)

  // 切換播放/暫停
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // 切換靜音
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // 當切換媒體時重置狀態
  const handleMediaSelect = (index: number) => {
    if (videoRef.current) {
      videoRef.current.pause()
    }
    setIsPlaying(false)
    setSelectedImage(index)
  }

  return (
    <div className="space-y-4">
      {/* 主圖/主影片 */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
        {isCurrentVideo ? (
          // 影片播放器
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              src={currentMedia}
              className="w-full h-full object-cover"
              muted={isMuted}
              playsInline
              loop
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* 影片控制按鈕 */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 flex items-center justify-center shadow-lg transition-all"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-gray-800" />
                ) : (
                  <Play className="w-6 h-6 text-gray-800 ml-1" />
                )}
              </button>
              <button
                onClick={toggleMute}
                className="w-10 h-10 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 flex items-center justify-center shadow-lg transition-all"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-gray-800" />
                ) : (
                  <Volume2 className="w-5 h-5 text-gray-800" />
                )}
              </button>
            </div>

            {/* 影片標籤 */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full">
              影片
            </div>

            {/* 點擊播放覆蓋層（僅在未播放時顯示） */}
            {!isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black bg-opacity-20"
                onClick={togglePlay}
              >
                <div className="w-20 h-20 rounded-full bg-white bg-opacity-90 flex items-center justify-center shadow-xl">
                  <Play className="w-10 h-10 text-gray-800 ml-1" />
                </div>
              </div>
            )}
          </div>
        ) : (
          // 圖片顯示 - 使用 HeroImage 減少 Vercel 用量
          <HeroImage
            src={currentMedia}
            alt={`${productName} - 圖${selectedImage + 1}`}
            priority
          />
        )}
      </div>

      {/* 縮略圖 */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {displayImages.map((media, index) => {
            const isVideo = isVideoUrl(media)
            return (
              <button
                key={index}
                onClick={() => handleMediaSelect(index)}
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
                {isVideo ? (
                  // 影片縮略圖
                  <div className="absolute inset-0">
                    <video
                      src={media}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <div className="w-8 h-8 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                        <Play className="w-4 h-4 text-gray-800 ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  // 圖片縮略圖 - 使用 ProductCardImage 減少 Vercel 用量
                  <ProductCardImage
                    src={media}
                    alt={`${productName} - 縮略圖${index + 1}`}
                    hoverScale={false}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
