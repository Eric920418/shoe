'use client'
import { useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface SingleImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
  folder?: string // 上傳資料夾分類（如 'banners', 'products'）
}

export default function SingleImageUpload({
  value,
  onChange,
  label = '圖片',
  folder = 'banners'
}: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 驗證文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('圖片大小不能超過 5MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '上傳失敗')
      }

      const data = await response.json()
      onChange(data.url)
      toast.success('圖片上傳成功')
    } catch (error: any) {
      console.error('圖片上傳失敗:', error)
      toast.error(error.message || '圖片上傳失敗，請重試')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleRemove = () => {
    onChange('')
    toast.success('圖片已移除')
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {value ? (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 group">
          {value.includes('/uploads/') || value.includes('/api/images/') ? (
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={value}
              alt={label}
              fill
              className="object-cover"
              sizes="400px"
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <label className="px-4 py-2 bg-white text-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-2">
              <Upload size={16} />
              <span className="text-sm">更換圖片</span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <X size={16} />
              <span className="text-sm">移除</span>
            </button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">上傳中...</p>
            </div>
          ) : (
            <div className="text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">點擊上傳圖片</p>
              <p className="text-xs text-gray-500">支援 JPG、PNG、WebP、SVG（最大 5MB）</p>
            </div>
          )}
        </label>
      )}

      {/* URL 輸入框（選擇性） */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="或直接輸入圖片網址..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
        />
      </div>
    </div>
  )
}
