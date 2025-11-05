'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { TOGGLE_WISHLIST, IS_IN_WISHLIST, GET_MY_WISHLIST } from '@/graphql/queries'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface WishlistButtonProps {
  productId: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export default function WishlistButton({
  productId,
  size = 'md',
  showLabel = false,
  className = '',
}: WishlistButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)

  // 查詢產品是否在願望清單中
  const { data: wishlistData, loading: checkingWishlist } = useQuery(IS_IN_WISHLIST, {
    variables: { productId },
    skip: !user, // 如果未登入則跳過查詢
  })

  const isInWishlist = wishlistData?.isInWishlist || false

  // ✅ 優化：使用樂觀更新和快取修改，避免 refetch 重複請求
  const [toggleWishlist, { loading: toggling }] = useMutation(TOGGLE_WISHLIST, {
    // 樂觀更新：立即更新 UI，不等待伺服器回應
    optimisticResponse: {
      toggleWishlist: {
        __typename: 'ToggleWishlistResponse',
        isInWishlist: !isInWishlist,
        message: isInWishlist ? '已從願望清單移除' : '已添加到願望清單',
      },
    },
    // 手動更新快取，不需要 refetchQueries
    update: (cache, { data }) => {
      if (!data) return

      // 更新單個產品的願望清單狀態
      cache.writeQuery({
        query: IS_IN_WISHLIST,
        variables: { productId },
        data: { isInWishlist: data.toggleWishlist.isInWishlist },
      })

      // 如果是移除，從 GET_MY_WISHLIST 快取中移除該產品
      if (!data.toggleWishlist.isInWishlist) {
        cache.modify({
          fields: {
            myWishlist(existingWishlist = [], { readField }) {
              return existingWishlist.filter(
                (ref: any) => productId !== readField('productId', ref)
              )
            },
          },
        })
      }
    },
    onCompleted: (data) => {
      if (data.toggleWishlist.isInWishlist) {
        toast.success(data.toggleWishlist.message || '已添加到願望清單')
      } else {
        toast.success(data.toggleWishlist.message || '已從願望清單移除')
      }
    },
    onError: (error) => {
      if (error.message.includes('UNAUTHENTICATED')) {
        toast.error('請先登入')
        router.push('/auth/login')
      } else {
        toast.error(`操作失敗：${error.message}`)
      }
    },
  })

  const handleClick = async (e: React.MouseEvent) => {
    // 重要：阻止事件冒泡到父元素（如產品卡片的 Link）
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()

    if (!user) {
      toast.error('請先登入才能使用願望清單功能')
      router.push('/auth/login')
      return
    }

    try {
      await toggleWishlist({ variables: { productId } })
    } catch (error) {
      // Error handling is done in onError callback
      console.error('Toggle wishlist error:', error)
    }
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const isLoading = checkingWishlist || toggling

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={(e) => {
        // 額外的保護層：在 mousedown 階段也阻止冒泡
        e.stopPropagation()
      }}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        ${showLabel ? 'px-4 w-auto' : ''}
        flex items-center justify-center gap-2
        rounded-full
        bg-white
        border-2
        ${isInWishlist ? 'border-red-500 text-red-500' : 'border-gray-300 text-gray-400'}
        hover:border-red-500
        hover:bg-red-50
        transition-all
        duration-200
        disabled:opacity-50
        disabled:cursor-not-allowed
        shadow-md
        hover:shadow-lg
        relative
        z-10
        ${className}
      `}
      title={isInWishlist ? '從願望清單移除' : '加入願望清單'}
      aria-label={isInWishlist ? '從願望清單移除' : '加入願望清單'}
    >
      {isLoading ? (
        <svg
          className={`${iconSizeClasses[size]} animate-spin`}
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
      ) : (
        <>
          {isInWishlist ? (
            // 實心愛心（已收藏）
            <svg
              className={`${iconSizeClasses[size]} transition-transform ${isHovered ? 'scale-110' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            // 空心愛心（未收藏）
            <svg
              className={`${iconSizeClasses[size]} transition-transform ${isHovered ? 'scale-110' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}

          {showLabel && (
            <span className="text-sm font-medium whitespace-nowrap">
              {isInWishlist ? '已收藏' : '收藏'}
            </span>
          )}
        </>
      )}
    </button>
  )
}
