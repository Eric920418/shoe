'use client'

/**
 * 產品選項管理組件（鞋型、閉合方式、產品特性）
 * 提供新增、編輯、刪除選項的功能
 */

import { useState } from 'react'
import { useMutation } from '@apollo/client'
import {
  CREATE_PRODUCT_OPTION,
  UPDATE_PRODUCT_OPTION,
  DELETE_PRODUCT_OPTION,
  GET_ALL_PRODUCT_OPTIONS,
} from '@/graphql/queries'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'

interface ProductOption {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
}

interface ProductOptionManagerProps {
  type: 'SHOE_TYPE' | 'CLOSURE' | 'FEATURE'
  options: ProductOption[]
  onOptionCreated?: () => void
  onOptionUpdated?: () => void
  onOptionDeleted?: () => void
}

export default function ProductOptionManager({
  type,
  options,
  onOptionCreated,
  onOptionUpdated,
  onOptionDeleted,
}: ProductOptionManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newOptionName, setNewOptionName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const typeLabels = {
    SHOE_TYPE: '鞋型',
    CLOSURE: '閉合方式',
    FEATURE: '產品特性',
  }

  const [createOption, { loading: creating }] = useMutation(CREATE_PRODUCT_OPTION, {
    refetchQueries: [{ query: GET_ALL_PRODUCT_OPTIONS }],
    onCompleted: () => {
      toast.success(`新增${typeLabels[type]}成功`)
      setIsAdding(false)
      setNewOptionName('')
      onOptionCreated?.()
    },
    onError: (error) => {
      toast.error(`新增失敗：${error.message}`)
    },
  })

  const [updateOption, { loading: updating }] = useMutation(UPDATE_PRODUCT_OPTION, {
    refetchQueries: [{ query: GET_ALL_PRODUCT_OPTIONS }],
    onCompleted: () => {
      toast.success(`更新${typeLabels[type]}成功`)
      setEditingId(null)
      setEditingName('')
      onOptionUpdated?.()
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`)
    },
  })

  const [deleteOption, { loading: deleting }] = useMutation(DELETE_PRODUCT_OPTION, {
    refetchQueries: [{ query: GET_ALL_PRODUCT_OPTIONS }],
    onCompleted: () => {
      toast.success(`刪除${typeLabels[type]}成功`)
      onOptionDeleted?.()
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`)
    },
  })

  const handleAdd = async () => {
    if (!newOptionName.trim()) {
      toast.error('請輸入選項名稱')
      return
    }
    await createOption({
      variables: {
        input: {
          type,
          name: newOptionName.trim(),
        },
      },
    })
  }

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) {
      toast.error('請輸入選項名稱')
      return
    }
    await updateOption({
      variables: {
        id,
        input: {
          name: editingName.trim(),
        },
      },
    })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`確定要刪除「${name}」嗎？`)) return
    await deleteOption({ variables: { id } })
  }

  const startEditing = (option: ProductOption) => {
    setEditingId(option.id)
    setEditingName(option.name)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingName('')
  }

  return (
    <div className="space-y-2">
      {/* 選項列表 */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {options.map((option) => (
          <div
            key={option.id}
            className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg group hover:bg-gray-100"
          >
            {editingId === option.id ? (
              // 編輯模式
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="輸入名稱"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdate(option.id)
                    if (e.key === 'Escape') cancelEditing()
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleUpdate(option.id)}
                  disabled={updating}
                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                  title="確認"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="p-1 text-gray-500 hover:bg-gray-200 rounded"
                  title="取消"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // 顯示模式
              <>
                <span className="text-sm text-gray-700">{option.name}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => startEditing(option)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    title="編輯"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(option.id, option.name)}
                    disabled={deleting}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                    title="刪除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {options.length === 0 && !isAdding && (
          <p className="text-sm text-gray-500 text-center py-2">尚無選項</p>
        )}
      </div>

      {/* 新增區塊 */}
      {isAdding ? (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={newOptionName}
            onChange={(e) => setNewOptionName(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder={`輸入新${typeLabels[type]}名稱`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') {
                setIsAdding(false)
                setNewOptionName('')
              }
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={creating}
            className="px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {creating ? '...' : '新增'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false)
              setNewOptionName('')
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm text-primary-600 border border-dashed border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增{typeLabels[type]}
        </button>
      )}
    </div>
  )
}
