'use client'

import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { CREATE_REVIEW } from '@/graphql/queries'
import ImageUpload from './ImageUpload'

interface ReviewFormProps {
  productId: string
  productName: string
  orderId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ReviewForm({ productId, productName, orderId, onSuccess, onCancel }: ReviewFormProps) {
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    content: '',
    sizeFit: '',
    boughtSize: '',
  })
  const [images, setImages] = useState<string[]>([])

  const [createReview, { loading }] = useMutation(CREATE_REVIEW, {
    onCompleted: () => {
      alert('評論提交成功！審核通過後將會顯示')
      if (onSuccess) onSuccess()
    },
    onError: (error) => {
      alert(error.message || '評論提交失敗')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.content.trim().length < 10) {
      alert('評論內容至少需要10個字')
      return
    }

    await createReview({
      variables: {
        input: {
          productId,
          orderId: orderId || null,
          rating: formData.rating,
          title: formData.title.trim() || null,
          content: formData.content.trim(),
          sizeFit: formData.sizeFit || null,
          boughtSize: formData.boughtSize || null,
          images,
        },
      },
    })
  }

  const renderStars = () => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setFormData({ ...formData, rating: star })}
            className="transition-colors"
          >
            <svg
              className={`w-8 h-8 ${star <= formData.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
              viewBox="0 0 20 20"
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-bold mb-4">評論商品</h2>
      <p className="text-gray-600 mb-6">{productName}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 評分 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            評分 <span className="text-red-500">*</span>
          </label>
          {renderStars()}
        </div>

        {/* 標題 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">評論標題（選填）</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="簡短描述您的評價"
            maxLength={100}
          />
        </div>

        {/* 評論內容 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            評論內容 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            rows={5}
            placeholder="分享您的使用體驗（至少10個字）"
            required
            minLength={10}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.content.length} 個字</p>
        </div>

        {/* 尺寸資訊 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">購買尺寸（選填）</label>
            <input
              type="text"
              value={formData.boughtSize}
              onChange={(e) => setFormData({ ...formData, boughtSize: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="例如: 40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">尺寸感受（選填）</label>
            <select
              value={formData.sizeFit}
              onChange={(e) => setFormData({ ...formData, sizeFit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">請選擇</option>
              <option value="TOO_SMALL">偏小</option>
              <option value="PERFECT">剛好</option>
              <option value="TOO_LARGE">偏大</option>
            </select>
          </div>
        </div>

        {/* 圖片上傳 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">評論圖片（選填）</label>
          <ImageUpload
            value={images}
            onChange={setImages}
            maxFiles={5}
            maxSize={5}
          />
        </div>

        {/* 提示 */}
        {orderId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">
              ✓ 已驗證購買 - 您的評論將顯示「已驗證購買」標誌
            </p>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">
            提示：評論提交後需要經過審核才會顯示在商品頁面
          </p>
        </div>

        {/* 按鈕 */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? '提交中...' : '提交評論'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
