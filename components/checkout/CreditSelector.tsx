'use client'

import { useQuery, gql } from '@apollo/client'
import { useState, useEffect } from 'react'

const GET_AVAILABLE_CREDITS = gql`
  query GetAvailableCredits {
    myCredits {
      id
      amount
      balance
      source
      maxUsagePerOrder
      minOrderAmount
      validFrom
      validUntil
    }
    availableCreditAmount
  }
`

interface CreditSelectorProps {
  subtotal: number
  onChange: (amount: number) => void
}

export default function CreditSelector({ subtotal, onChange }: CreditSelectorProps) {
  const [selectedAmount, setSelectedAmount] = useState(0)
  const [useAll, setUseAll] = useState(false)

  const { data, loading } = useQuery(GET_AVAILABLE_CREDITS, {
    fetchPolicy: 'network-only',
  })

  // 計算可用的購物金總額（考慮限制）
  const calculateMaxUsable = () => {
    if (!data?.myCredits) return 0

    const now = new Date()
    let total = 0

    for (const credit of data.myCredits) {
      const validFrom = new Date(credit.validFrom)
      const validUntil = new Date(credit.validUntil)

      // 檢查是否在有效期內
      if (now < validFrom || now > validUntil) continue

      // 檢查最低訂單金額限制
      if (credit.minOrderAmount && subtotal < parseFloat(credit.minOrderAmount)) {
        continue
      }

      const balance = parseFloat(credit.balance)

      // 檢查單筆訂單使用限制
      if (credit.maxUsagePerOrder) {
        total += Math.min(balance, parseFloat(credit.maxUsagePerOrder))
      } else {
        total += balance
      }
    }

    // 購物金不能超過訂單金額
    return Math.min(total, subtotal)
  }

  const maxUsable = calculateMaxUsable()

  useEffect(() => {
    if (useAll) {
      setSelectedAmount(maxUsable)
      onChange(maxUsable)
    }
  }, [useAll, maxUsable])

  const handleAmountChange = (value: number) => {
    const amount = Math.min(Math.max(0, value), maxUsable)
    setSelectedAmount(amount)
    onChange(amount)
    setUseAll(amount === maxUsable)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const totalAvailable = data?.availableCreditAmount || 0

  if (totalAvailable === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 text-gray-500">
          <span className="text-2xl">💰</span>
          <div>
            <h3 className="font-medium text-gray-700">購物金</h3>
            <p className="text-sm">目前沒有可用的購物金</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <h3 className="font-medium text-gray-900">使用購物金</h3>
        </div>
        <span className="text-sm text-gray-600">
          可用：<span className="font-bold text-green-600">${totalAvailable.toFixed(0)}</span>
        </span>
      </div>

      {maxUsable < totalAvailable && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          ⚠️ 部分購物金因訂單金額或使用限制，本次最多可使用 ${maxUsable.toFixed(0)}
        </div>
      )}

      <div className="space-y-4">
        {/* 快速選擇 */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleAmountChange(0)}
            className={`flex-1 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
              selectedAmount === 0
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            不使用
          </button>
          <button
            type="button"
            onClick={() => setUseAll(true)}
            className={`flex-1 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
              useAll
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            全部使用
          </button>
        </div>

        {/* 自訂金額 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            自訂使用金額（上限 ${maxUsable.toFixed(0)}）
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              min="0"
              max={maxUsable}
              step="1"
              value={selectedAmount}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        </div>

        {/* 滑動條 */}
        {maxUsable > 0 && (
          <div>
            <input
              type="range"
              min="0"
              max={maxUsable}
              step="10"
              value={selectedAmount}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$0</span>
              <span>${maxUsable.toFixed(0)}</span>
            </div>
          </div>
        )}

        {/* 預覽折抵 */}
        {selectedAmount > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">購物金折抵</span>
              <span className="font-bold text-green-600">-${selectedAmount.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600">實付金額</span>
              <span className="font-bold text-blue-600">${(subtotal - selectedAmount).toFixed(0)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
