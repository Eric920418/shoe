'use client'
import { useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

export default function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  // 確保 images 始終是陣列
  const safeImages = Array.isArray(images) ? images : []

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (safeImages.length + files.length > maxImages) {
      toast.error('最多只能上傳 ' + maxImages + ' 張圖片')
      return
    }

    setUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
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
      onChange([...safeImages, ...uploadedUrls])
      toast.success('成功上傳 ' + uploadedUrls.length + ' 張圖片')
    } catch (error: any) {
      console.error('圖片上傳失敗:', error)
      toast.error(error.message || '圖片上傳失敗，請重試')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleRemove = (index: number) => {
    const newImages = safeImages.filter((_, i) => i !== index)
    onChange(newImages)
    toast.success('圖片已移除')
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newImages = [...safeImages]
    const [removed] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, removed)
    onChange(newImages)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          產品圖片 {safeImages.length > 0 && '(' + safeImages.length + '/' + maxImages + ')'}
        </label>
        <div className="flex items-center gap-4">
          <label className={'px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors ' + (uploading || safeImages.length >= maxImages ? 'opacity-50 cursor-not-allowed' : '')}>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
              multiple
              onChange={handleFileChange}
              disabled={uploading || safeImages.length >= maxImages}
              className="hidden"
            />
            <span className="text-sm text-gray-600">
              {uploading ? '上傳中...' : '+ 選擇圖片'}
            </span>
          </label>
          <p className="text-xs text-gray-500">支援 JPG、PNG、WebP、SVG，單個文件不超過 5MB</p>
        </div>
      </div>

      {safeImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {safeImages.map((url, index) => {
            const isSelected = selectedIndex === index
            return (
              <div
                key={index}
                className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200"
                onClick={() => setSelectedIndex(isSelected ? null : index)}
              >
                {index === 0 && (
                  <div className="absolute top-2 left-2 z-10 bg-primary-600 text-white text-xs px-2 py-1 rounded">主圖</div>
                )}
                {/* 相對路徑用 img，絕對 URL（含 R2）用 Next.js Image 優化 */}
                {url.startsWith('/') && !url.startsWith('//') ? (
                  <img
                    src={url}
                    alt={'產品圖片 ' + (index + 1)}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={url}
                    alt={'產品圖片 ' + (index + 1)}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                )}
                {/* 桌面版：hover 顯示；手機版：點擊後顯示 */}
                <div className={`absolute inset-0 bg-black bg-opacity-50 transition-opacity flex items-center justify-center gap-2 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleReorder(index, index - 1); setSelectedIndex(index - 1); }}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center text-lg"
                      title="左移"
                    >
                      ←
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemove(index); setSelectedIndex(null); }}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 active:bg-red-800 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center text-lg"
                    title="刪除"
                  >
                    ×
                  </button>
                  {index < safeImages.length - 1 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleReorder(index, index + 1); setSelectedIndex(index + 1); }}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center text-lg"
                      title="右移"
                    >
                      →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {safeImages.length === 0 && <p className="text-sm text-gray-500">尚未上傳任何圖片</p>}

      {safeImages.length > 1 && (
        <p className="text-xs text-gray-500 md:hidden">
          點擊圖片可顯示排序按鈕，第一張為主圖
        </p>
      )}
    </div>
  )
}
