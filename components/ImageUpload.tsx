'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface ImageUploadProps {
  value?: string[]
  onChange?: (urls: string[]) => void
  maxFiles?: number
  maxSize?: number // MB
  className?: string
}

export default function ImageUpload({
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = 5,
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>(value)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // 檢查檔案數量
    if (images.length + files.length > maxFiles) {
      alert(`最多只能上傳 ${maxFiles} 張圖片`)
      return
    }

    setUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // 驗證檔案大小
        if (file.size > maxSize * 1024 * 1024) {
          alert(`檔案 ${file.name} 大小超過 ${maxSize}MB`)
          return null
        }

        // 驗證檔案類型
        if (!file.type.startsWith('image/')) {
          alert(`檔案 ${file.name} 不是圖片`)
          return null
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || '上傳失敗')
        }

        const data = await response.json()
        return data.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      const validUrls = uploadedUrls.filter((url): url is string => url !== null)

      const newImages = [...images, ...validUrls]
      setImages(newImages)

      if (onChange) {
        onChange(newImages)
      }
    } catch (error) {
      console.error('上傳失敗:', error)
      alert(error instanceof Error ? error.message : '圖片上傳失敗')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)

    if (onChange) {
      onChange(newImages)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* 已上傳的圖片 */}
        {images.map((url, index) => (
          <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
            <Image
              src={url}
              alt={`上傳圖片 ${index + 1}`}
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        ))}

        {/* 上傳按鈕 */}
        {images.length < maxFiles && (
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <svg
                  className="animate-spin h-8 w-8 text-primary-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm text-gray-600">上傳中...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="text-sm text-gray-600">上傳圖片</span>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* 提示文字 */}
      <p className="text-xs text-gray-500 mt-2">
        最多上傳 {maxFiles} 張圖片，每張不超過 {maxSize}MB
        {images.length > 0 && ` (已上傳 ${images.length}/${maxFiles})`}
      </p>
    </div>
  )
}
