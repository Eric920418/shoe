'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

const VALIDATE_COUPON = gql`
  query ValidateCoupon($code: String!, $orderAmount: Float!) {
    validateCoupon(code: $code, orderAmount: $orderAmount) {
      valid
      message
      discount
      finalAmount
    }
  }
`;

interface CouponInputProps {
  orderAmount: number;
  onApplyCoupon: (couponCode: string, discount: number) => void;
  appliedCoupon?: { code: string; discount: number } | null;
  onRemoveCoupon?: () => void;
}

export default function CouponInput({
  orderAmount,
  onApplyCoupon,
  appliedCoupon: externalAppliedCoupon,
  onRemoveCoupon: externalOnRemoveCoupon
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [internalAppliedCoupon, setInternalAppliedCoupon] = useState<string | null>(null);

  // Use external state if provided, otherwise use internal state
  const appliedCoupon = externalAppliedCoupon ? externalAppliedCoupon.code : internalAppliedCoupon;
  const appliedDiscount = externalAppliedCoupon ? externalAppliedCoupon.discount : validationResult?.discount;

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setValidationResult({ valid: false, message: '請輸入優惠券代碼' });
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            query ValidateCoupon($code: String!, $orderAmount: Float!) {
              validateCoupon(code: $code, orderAmount: $orderAmount) {
                valid
                message
                discount
                finalAmount
              }
            }
          `,
          variables: {
            code: couponCode.toUpperCase(),
            orderAmount,
          },
        }),
      });

      const data = await response.json();
      const result = data.data?.validateCoupon;

      if (result) {
        setValidationResult(result);
        if (result.valid) {
          if (!externalAppliedCoupon) {
            setInternalAppliedCoupon(couponCode.toUpperCase());
          }
          onApplyCoupon(couponCode.toUpperCase(), result.discount);
        }
      }
    } catch (error) {
      console.error('驗證優惠券失敗:', error);
      setValidationResult({
        valid: false,
        message: '驗證優惠券時發生錯誤',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    if (externalOnRemoveCoupon) {
      externalOnRemoveCoupon();
    } else {
      setInternalAppliedCoupon(null);
      onApplyCoupon('', 0);
    }
    setCouponCode('');
    setValidationResult(null);
  };

  if (appliedCoupon && (validationResult?.valid || externalAppliedCoupon)) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-green-900">
                優惠券已套用：{appliedCoupon}
              </span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              折扣金額：NT$ {appliedDiscount?.toLocaleString() || 0}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemoveCoupon}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            移除
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs uppercase tracking-wide text-gray-500">
        優惠券代碼
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="輸入優惠券代碼"
          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors bg-white"
          disabled={isValidating}
        />
        <button
          type="button"
          onClick={handleValidateCoupon}
          disabled={isValidating || !couponCode.trim()}
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isValidating ? '驗證中...' : '套用'}
        </button>
      </div>

      {validationResult && !validationResult.valid && (
        <p className="text-sm text-red-600 mt-2">
          {validationResult.message}
        </p>
      )}
    </div>
  );
}