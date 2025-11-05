/**
 * 通用手機版表格卡片組件
 * 用於在手機端將表格數據轉換為卡片式顯示
 */

interface MobileTableCardProps {
  title: string
  subtitle?: string
  status?: {
    label: string
    color: string
    icon?: string
  }
  details: Array<{
    label: string
    value: string | number | React.ReactNode
    highlight?: boolean
  }>
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'danger'
    icon?: string
  }>
  onSelect?: () => void
  isSelected?: boolean
  expandable?: boolean
  expandedContent?: React.ReactNode
}

export default function MobileTableCard({
  title,
  subtitle,
  status,
  details,
  actions,
  onSelect,
  isSelected,
  expandable,
  expandedContent,
}: MobileTableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getActionButtonClass = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-600 text-white hover:bg-primary-700'
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700'
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'} overflow-hidden`}>
      {/* 卡片頭部 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                className="mt-1 w-4 h-4 text-primary-600 rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
              {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            </div>
          </div>
          {status && (
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${status.color} flex items-center gap-1`}>
              {status.icon && <span>{status.icon}</span>}
              {status.label}
            </span>
          )}
        </div>
      </div>

      {/* 卡片內容 */}
      <div className="p-4 space-y-3">
        {/* 詳情列表 */}
        <div className="space-y-2">
          {details.map((detail, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{detail.label}</span>
              <span className={`text-sm ${detail.highlight ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                {detail.value}
              </span>
            </div>
          ))}
        </div>

        {/* 展開內容 */}
        {expandable && expandedContent && (
          <>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-left text-sm text-primary-600 font-medium flex items-center justify-between pt-2 border-t"
            >
              <span>{isExpanded ? '收起詳情' : '展開詳情'}</span>
              <svg
                className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isExpanded && <div className="pt-3 border-t">{expandedContent}</div>}
          </>
        )}

        {/* 操作按鈕 */}
        {actions && actions.length > 0 && (
          <div className={`flex gap-2 pt-3 ${!expandable ? 'border-t' : ''}`}>
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${getActionButtonClass(action.variant)}`}
              >
                {action.icon && <span>{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'