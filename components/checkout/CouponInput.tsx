'use client';

import { useState, useEffect } from 'react';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: string;
  value: number;
  minAmount?: number;
  maxDiscount?: number;
}

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
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [showCouponList, setShowCouponList] = useState(false);

  // Use external state if provided, otherwise use internal state
  const appliedCoupon = externalAppliedCoupon ? externalAppliedCoupon.code : internalAppliedCoupon;
  const appliedDiscount = externalAppliedCoupon ? externalAppliedCoupon.discount : validationResult?.discountAmount;

  // 載入可用的公開優惠券
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            query: `
              query PublicCoupons {
                publicCoupons {
                  id
                  code
                  name
                  description
                  type
                  value
                  minAmount
                  maxDiscount
                }
              }
            `,
          }),
        });

        const data = await response.json();
        if (data.data?.publicCoupons) {
          setAvailableCoupons(data.data.publicCoupons);
        }
      } catch (error) {
        console.error('載入優惠券失敗:', error);
      } finally {
        setLoadingCoupons(false);
      }
    };

    fetchCoupons();
  }, []);

  // 計算優惠券的折扣金額（預覽用）
  const calculateDiscount = (coupon: Coupon): number => {
    if (coupon.minAmount && orderAmount < coupon.minAmount) {
      return 0;
    }

    let discount = 0;
    switch (coupon.type) {
      case 'PERCENTAGE':
        discount = orderAmount * (coupon.value / 100);
        if (coupon.maxDiscount) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
        break;
      case 'FIXED':
        discount = coupon.value;
        break;
      case 'FREE_SHIPPING':
        discount = 49; // 運費
        break;
    }
    return Math.floor(discount);
  };

  // 檢查優惠券是否可用
  const isCouponUsable = (coupon: Coupon): boolean => {
    if (coupon.minAmount && orderAmount < coupon.minAmount) {
      return false;
    }
    return true;
  };

  // 格式化優惠券顯示
  const formatCouponValue = (coupon: Coupon): string => {
    switch (coupon.type) {
      case 'PERCENTAGE':
        return `${coupon.value}% 折扣${coupon.maxDiscount ? `（上限 $${coupon.maxDiscount}）` : ''}`;
      case 'FIXED':
        return `折 $${coupon.value}`;
      case 'FREE_SHIPPING':
        return '免運費';
      default:
        return '';
    }
  };

  const handleValidateCoupon = async (code?: string) => {
    const codeToValidate = code || couponCode;
    if (!codeToValidate.trim()) {
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
                discountAmount
              }
            }
          `,
          variables: {
            code: codeToValidate.toUpperCase(),
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
            setInternalAppliedCoupon(codeToValidate.toUpperCase());
          }
          onApplyCoupon(codeToValidate.toUpperCase(), result.discountAmount || 0);
          setShowCouponList(false);
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

  const handleSelectCoupon = (coupon: Coupon) => {
    setCouponCode(coupon.code);
    handleValidateCoupon(coupon.code);
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
      <div className="flex items-center justify-between">
        <label className="block text-xs uppercase tracking-wide text-gray-500">
          優惠券
        </label>
        {availableCoupons.length > 0 && (
          <button
            type="button"
            onClick={() => setShowCouponList(!showCouponList)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {showCouponList ? '收起' : `查看可用優惠券 (${availableCoupons.length})`}
          </button>
        )}
      </div>

      {/* 可用優惠券列表 */}
      {showCouponList && availableCoupons.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
          <div className="max-h-48 overflow-y-auto">
            {availableCoupons.map((coupon) => {
              const usable = isCouponUsable(coupon);
              const discount = calculateDiscount(coupon);

              return (
                <div
                  key={coupon.id}
                  className={`p-3 border-b border-gray-100 last:border-b-0 ${
                    usable ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 text-sm">
                          {coupon.code}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {formatCouponValue(coupon)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1 truncate">{coupon.name}</p>
                      {coupon.minAmount && (
                        <p className={`text-xs mt-0.5 ${usable ? 'text-gray-500' : 'text-red-500'}`}>
                          {usable
                            ? `滿 $${coupon.minAmount} 可用`
                            : `需滿 $${coupon.minAmount}（差 $${coupon.minAmount - orderAmount}）`
                          }
                        </p>
                      )}
                      {usable && discount > 0 && (
                        <p className="text-xs text-green-600 mt-0.5">
                          可折抵 ${discount}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectCoupon(coupon)}
                      disabled={!usable || isValidating}
                      className={`ml-3 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        usable
                          ? 'bg-black text-white hover:bg-gray-800'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isValidating ? '...' : '使用'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 手動輸入優惠券代碼 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="輸入優惠券代碼"
          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors bg-white text-sm"
          disabled={isValidating}
        />
        <button
          type="button"
          onClick={() => handleValidateCoupon()}
          disabled={isValidating || !couponCode.trim()}
          className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
        >
          {isValidating ? '驗證中...' : '套用'}
        </button>
      </div>

      {validationResult && !validationResult.valid && (
        <p className="text-sm text-red-600">
          {validationResult.message}
        </p>
      )}

      {loadingCoupons && availableCoupons.length === 0 && (
        <p className="text-xs text-gray-400">載入優惠券中...</p>
      )}
    </div>
  );
}
