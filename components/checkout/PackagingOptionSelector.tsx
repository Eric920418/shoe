'use client'

import { useState } from 'react'

interface PackagingOptionSelectorProps {
  canCombinePackaging: boolean
  requiresBatching: boolean
  batchCount?: number
  onOptionChange: (option: 'STANDARD' | 'COMBINED' | 'SEPARATE') => void
}

export default function PackagingOptionSelector({
  canCombinePackaging,
  requiresBatching,
  batchCount = 1,
  onOptionChange
}: PackagingOptionSelectorProps) {
  const [selectedOption, setSelectedOption] = useState<'STANDARD' | 'COMBINED' | 'SEPARATE'>('STANDARD')

  const handleOptionChange = (option: 'STANDARD' | 'COMBINED' | 'SEPARATE') => {
    setSelectedOption(option)
    onOptionChange(option)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">包裝方式選擇</h3>

      {requiresBatching && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            由於商品數量較多，需要分 {batchCount} 批配送。請選擇您偏好的包裝方式。
          </p>
        </div>
      )}

      <div className="space-y-3">
        {/* 標準包裝 */}
        <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
          <input
            type="radio"
            value="STANDARD"
            checked={selectedOption === 'STANDARD'}
            onChange={() => handleOptionChange('STANDARD')}
            className="mt-1 mr-3"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900">標準包裝</div>
            <div className="text-sm text-gray-600 mt-1">
              每雙鞋子使用原廠鞋盒獨立包裝，提供最佳保護
            </div>
            <div className="text-xs text-gray-500 mt-2">
              • 保持鞋盒完整性
              • 適合作為禮物贈送
              • 方便個別存放
            </div>
          </div>
        </label>

        {/* 合併包裝 - 只在允許時顯示 */}
        {canCombinePackaging && (
          <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
            <input
              type="radio"
              value="COMBINED"
              checked={selectedOption === 'COMBINED'}
              onChange={() => handleOptionChange('COMBINED')}
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                合併包裝
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">環保推薦</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                多雙鞋子裝在同一個包裝盒，減少包材使用
              </div>
              <div className="text-xs text-gray-500 mt-2">
                • 減少包裝材料，更環保
                • 可能降低運費（體積較小）
                • 適合自用購買
                • 鞋子仍有基本保護
              </div>
              {requiresBatching && (
                <div className="text-xs text-orange-600 mt-2">
                  注意：即使選擇合併包裝，由於7-11取貨限制，仍需分批配送
                </div>
              )}
            </div>
          </label>
        )}

        {/* 分開包裝 - 特殊需求 */}
        <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
          <input
            type="radio"
            value="SEPARATE"
            checked={selectedOption === 'SEPARATE'}
            onChange={() => handleOptionChange('SEPARATE')}
            className="mt-1 mr-3"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900">強制分開包裝</div>
            <div className="text-sm text-gray-600 mt-1">
              每雙鞋子獨立包裝並加強保護（可能增加運費）
            </div>
            <div className="text-xs text-gray-500 mt-2">
              • 最高等級的保護
              • 適合高價值商品
              • 可能需要額外包裝費用
            </div>
          </div>
        </label>
      </div>

      {/* 額外說明 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>提醒：</strong>
          {requiresBatching ? (
            <>由於您的訂單需要分批配送，每批將單獨計算運費。包裝方式會影響每批的體積和運費。</>
          ) : (
            <>包裝方式可能影響運費計算。選擇合併包裝可能有助於減少整體運費。</>
          )}
        </p>
      </div>
    </div>
  )
}