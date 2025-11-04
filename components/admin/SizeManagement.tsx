'use client'

/**
 * 尺碼管理組件 - 頁面內編輯版本（無彈窗）
 */

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_PRODUCT_SIZE_CHARTS,
  CREATE_SIZE_CHART,
  UPDATE_SIZE_CHART,
  DELETE_SIZE_CHART,
} from '@/graphql/queries'
import toast from 'react-hot-toast'

interface SizeChart {
  id: string
  productId: string
  variantId?: string | null
  eu: string
  us: string
  uk: string
  cm: string
  footLength: number
  footWidth: string | null
  stock: number
  isActive: boolean
}

interface SizeManagementProps {
  productId: string
}

// 預設尺碼對照表（男鞋）
const defaultMenSizes: Omit<SizeChart, 'id' | 'productId' | 'variantId' | 'stock' | 'isActive'>[] = [
  { eu: '39', us: '6.5', uk: '6', cm: '24.5', footLength: 24.5, footWidth: '標準' },
  { eu: '40', us: '7', uk: '6.5', cm: '25', footLength: 25.0, footWidth: '標準' },
  { eu: '41', us: '8', uk: '7', cm: '25.5', footLength: 25.5, footWidth: '標準' },
  { eu: '42', us: '8.5', uk: '7.5', cm: '26', footLength: 26.0, footWidth: '標準' },
  { eu: '43', us: '9.5', uk: '8.5', cm: '27', footLength: 27.0, footWidth: '標準' },
  { eu: '44', us: '10', uk: '9', cm: '27.5', footLength: 27.5, footWidth: '標準' },
  { eu: '45', us: '11', uk: '10', cm: '28.5', footLength: 28.5, footWidth: '標準' },
  { eu: '46', us: '12', uk: '11', cm: '29', footLength: 29.0, footWidth: '標準' },
]

// 預設尺碼對照表（女鞋）
const defaultWomenSizes: Omit<SizeChart, 'id' | 'productId' | 'variantId' | 'stock' | 'isActive'>[] = [
  { eu: '35', us: '5', uk: '2.5', cm: '22', footLength: 22.0, footWidth: '標準' },
  { eu: '36', us: '6', uk: '3.5', cm: '23', footLength: 23.0, footWidth: '標準' },
  { eu: '37', us: '6.5', uk: '4', cm: '23.5', footLength: 23.5, footWidth: '標準' },
  { eu: '38', us: '7', uk: '4.5', cm: '24', footLength: 24.0, footWidth: '標準' },
  { eu: '39', us: '8', uk: '5.5', cm: '24.5', footLength: 24.5, footWidth: '標準' },
  { eu: '40', us: '9', uk: '6.5', cm: '25.5', footLength: 25.5, footWidth: '標準' },
  { eu: '41', us: '10', uk: '7.5', cm: '26', footLength: 26.0, footWidth: '標準' },
]

export default function SizeManagement({ productId }: SizeManagementProps) {
  const [editingSize, setEditingSize] = useState<Partial<SizeChart> | null>(null)
  const [showBatchImport, setShowBatchImport] = useState(false)

  // 查詢尺碼數據
  const { data, loading, error, refetch } = useQuery(GET_PRODUCT_SIZE_CHARTS, {
    variables: { productId },
    fetchPolicy: 'network-only',
  })

  const sizeCharts: SizeChart[] = data?.productSizeChart || []

  // 創建尺碼
  const [createSizeChart, { loading: creating }] = useMutation(CREATE_SIZE_CHART, {
    onCompleted: () => {
      toast.success('尺碼新增成功！')
      setEditingSize(null)
      refetch()
    },
    onError: (error) => {
      console.error('創建尺碼失敗:', error)
      toast.error(`新增失敗：${error.message}`)
    },
  })

  // 更新尺碼
  const [updateSizeChart, { loading: updating }] = useMutation(UPDATE_SIZE_CHART, {
    onCompleted: () => {
      toast.success('尺碼更新成功！')
      setEditingSize(null)
      refetch()
    },
    onError: (error) => {
      console.error('更新尺碼失敗:', error)
      toast.error(`更新失敗：${error.message}`)
    },
  })

  // 刪除尺碼
  const [deleteSizeChart] = useMutation(DELETE_SIZE_CHART, {
    onCompleted: () => {
      toast.success('尺碼刪除成功！')
      refetch()
    },
    onError: (error) => {
      console.error('刪除尺碼失敗:', error)
      toast.error(`刪除失敗：${error.message}`)
    },
  })

  // 打開編輯表單
  const handleEdit = (size: SizeChart) => {
    setEditingSize(size)
    // 滾動到表單位置
    setTimeout(() => {
      document.getElementById('size-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }

  // 打開新增表單
  const handleAdd = () => {
    setEditingSize({
      productId,
      eu: '',
      us: '',
      uk: '',
      cm: '',
      footLength: 0,
      footWidth: '標準',
      stock: 0,
      isActive: true,
    })
    // 滾動到表單位置
    setTimeout(() => {
      document.getElementById('size-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }

  // 保存尺碼
  const handleSave = async () => {
    if (!editingSize) return

    // 驗證必填欄位
    if (!editingSize.eu || !editingSize.us || !editingSize.uk || !editingSize.cm) {
      toast.error('請填寫所有必填欄位（EU、US、UK、CM）')
      return
    }

    if (!editingSize.footLength || editingSize.footLength <= 0) {
      toast.error('請輸入有效的腳長')
      return
    }

    if (editingSize.stock === undefined || editingSize.stock < 0) {
      toast.error('請輸入有效的庫存數量')
      return
    }

    try {
      if (editingSize.id) {
        // 更新現有尺碼
        await updateSizeChart({
          variables: {
            id: editingSize.id,
            input: {
              eu: editingSize.eu,
              us: editingSize.us,
              uk: editingSize.uk,
              cm: editingSize.cm,
              footLength: Number(editingSize.footLength),
              footWidth: editingSize.footWidth || null,
              stock: Number(editingSize.stock),
              isActive: editingSize.isActive ?? true,
            },
          },
        })
      } else {
        // 新增尺碼
        await createSizeChart({
          variables: {
            input: {
              productId,
              variantId: editingSize.variantId || null,
              eu: editingSize.eu,
              us: editingSize.us,
              uk: editingSize.uk,
              cm: editingSize.cm,
              footLength: Number(editingSize.footLength),
              footWidth: editingSize.footWidth || null,
              stock: Number(editingSize.stock),
            },
          },
        })
      }
    } catch (error) {
      console.error('保存尺碼時發生錯誤:', error)
    }
  }

  // 刪除尺碼
  const handleDelete = async (id: string, eu: string) => {
    if (!confirm(`確定要刪除尺碼 EU ${eu} 嗎？此操作無法復原。`)) {
      return
    }

    try {
      await deleteSizeChart({
        variables: { id },
      })
    } catch (error) {
      console.error('刪除尺碼時發生錯誤:', error)
    }
  }

  // 批量導入尺碼
  const handleBatchImport = async (gender: 'men' | 'women') => {
    const template = gender === 'men' ? defaultMenSizes : defaultWomenSizes

    try {
      const promises = template.map((size) =>
        createSizeChart({
          variables: {
            input: {
              productId,
              variantId: null,
              ...size,
              stock: 0,
            },
          },
        })
      )

      await Promise.all(promises)
      setShowBatchImport(false)
      toast.success(`已成功導入 ${template.length} 個${gender === 'men' ? '男款' : '女款'}尺碼模板！`)
      refetch()
    } catch (error: any) {
      console.error('批量導入失敗:', error)
      toast.error(`批量導入失敗：${error.message}`)
    }
  }

  // 更新編輯中的尺碼欄位
  const updateEditingField = (field: keyof SizeChart, value: any) => {
    setEditingSize((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">載入尺碼中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">載入尺碼失敗：{error.message}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          重試
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 操作按鈕 */}
      <div className="flex gap-3">
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          + 新增尺碼
        </button>
        <button
          onClick={() => setShowBatchImport(!showBatchImport)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showBatchImport ? '取消批量導入' : '批量導入'}
        </button>
      </div>

      {/* 批量導入選擇 */}
      {showBatchImport && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">批量導入尺碼模板</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleBatchImport('men')}
              disabled={creating}
              className="px-4 py-3 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
            >
              <div className="font-semibold text-blue-700">男款尺碼模板</div>
              <div className="text-sm text-gray-600 mt-1">包含 EU 39-46 (US 6.5-12)</div>
            </button>

            <button
              onClick={() => handleBatchImport('women')}
              disabled={creating}
              className="px-4 py-3 border-2 border-pink-500 rounded-lg hover:bg-pink-50 transition-colors text-left disabled:opacity-50"
            >
              <div className="font-semibold text-pink-700">女款尺碼模板</div>
              <div className="text-sm text-gray-600 mt-1">包含 EU 35-41 (US 5-10)</div>
            </button>
          </div>
        </div>
      )}

      {/* 尺碼列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">歐碼 (EU)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">美碼 (US)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">英碼 (UK)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">厘米 (CM)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">腳長 (cm)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">腳寬</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">庫存</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">狀態</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sizeCharts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    暫無尺碼數據，請新增或批量導入
                  </td>
                </tr>
              ) : (
                sizeCharts.map((size) => (
                  <tr key={size.id} className={`hover:bg-gray-50 ${editingSize?.id === size.id ? 'bg-primary-50' : ''}`}>
                    <td className="px-4 py-3 font-semibold text-gray-900">{size.eu}</td>
                    <td className="px-4 py-3 text-gray-700">{size.us}</td>
                    <td className="px-4 py-3 text-gray-700">{size.uk}</td>
                    <td className="px-4 py-3 text-gray-700">{size.cm}</td>
                    <td className="px-4 py-3 text-gray-700">{size.footLength}</td>
                    <td className="px-4 py-3 text-gray-700">{size.footWidth || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          size.stock === 0
                            ? 'text-red-600'
                            : size.stock <= 10
                            ? 'text-orange-600'
                            : 'text-green-600'
                        }`}
                      >
                        {size.stock} 件
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          size.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {size.isActive ? '啟用' : '停用'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(size)}
                          className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(size.id, size.eu)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 統計資訊 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">總尺碼數</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{sizeCharts.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">總庫存</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {sizeCharts.reduce((sum, size) => sum + size.stock, 0)} 件
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">缺貨尺碼</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {sizeCharts.filter((size) => size.stock === 0).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">低庫存尺碼</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {sizeCharts.filter((size) => size.stock > 0 && size.stock <= 10).length}
          </p>
        </div>
      </div>

      {/* 編輯/新增表單（在頁面中顯示，不使用彈窗） */}
      {editingSize && (
        <div id="size-form" className="bg-white rounded-lg shadow-lg border-2 border-primary-500 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {editingSize.id ? `編輯尺碼 EU ${editingSize.eu}` : '新增尺碼'}
            </h3>
            <button
              onClick={() => setEditingSize(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                歐碼 (EU) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editingSize.eu}
                onChange={(e) => updateEditingField('eu', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="例如: 42"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                美碼 (US) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editingSize.us}
                onChange={(e) => updateEditingField('us', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="例如: 8.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                英碼 (UK) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editingSize.uk}
                onChange={(e) => updateEditingField('uk', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="例如: 7.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                厘米 (CM) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editingSize.cm}
                onChange={(e) => updateEditingField('cm', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="例如: 26"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                腳長 (cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={editingSize.footLength}
                onChange={(e) => updateEditingField('footLength', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="26.0"
                step="0.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">腳寬</label>
              <select
                value={editingSize.footWidth || '標準'}
                onChange={(e) => updateEditingField('footWidth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="窄版">窄版</option>
                <option value="標準">標準</option>
                <option value="寬版">寬版</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                庫存 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={editingSize.stock}
                onChange={(e) => updateEditingField('stock', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
              <select
                value={editingSize.isActive ? 'true' : 'false'}
                onChange={(e) => updateEditingField('isActive', e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="true">啟用</option>
                <option value="false">停用</option>
              </select>
            </div>
          </div>

          {/* 儲存按鈕區域 */}
          <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={() => setEditingSize(null)}
              disabled={creating || updating}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={creating || updating}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating || updating ? '保存中...' : '儲存'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
