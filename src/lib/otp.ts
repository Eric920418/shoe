/**
 * OTP 驗證服務
 *
 * 功能：
 * 1. 生成並儲存 OTP
 * 2. 驗證 OTP
 * 3. 防止暴力破解（限制嘗試次數）
 * 4. 自動清理過期 OTP
 */

import { prisma } from './prisma'
import { generateOtpCode, sendLineOtp } from './line'

// ============================================
// OTP 配置
// ============================================

const OTP_EXPIRY_MINUTES = 10 // OTP 有效期限（分鐘）
const MAX_ATTEMPTS = 5 // 最大嘗試次數
const RESEND_COOLDOWN_SECONDS = 60 // 重發冷卻時間（秒）

// ============================================
// OTP 核心功能
// ============================================

/**
 * 發送 OTP 到 LINE
 *
 * @param lineUserId LINE User ID
 * @param purpose 用途（REGISTER 或 LOGIN）
 * @returns OTP ID（用於後續驗證）
 */
export async function sendOtp(
  lineUserId: string,
  purpose: 'REGISTER' | 'LOGIN'
): Promise<{ otpId: string; expiresAt: Date }> {
  // 檢查是否在冷卻時間內
  const recentOtp = await prisma.otpVerification.findFirst({
    where: {
      phone: lineUserId, // 這裡用 lineUserId 暫存在 phone 欄位
      purpose,
      createdAt: {
        gte: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (recentOtp) {
    const remainingSeconds = Math.ceil(
      (RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000
    )
    throw new Error(`請等待 ${remainingSeconds} 秒後再重新發送`)
  }

  // 生成 6 位數 OTP
  const code = generateOtpCode()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  // 儲存到資料庫
  const otpRecord = await prisma.otpVerification.create({
    data: {
      phone: lineUserId, // 暫存 lineUserId
      code,
      purpose,
      expiresAt,
    },
  })

  // 發送到 LINE
  try {
    await sendLineOtp(lineUserId, code)
  } catch (error) {
    // 發送失敗，刪除記錄
    await prisma.otpVerification.delete({
      where: { id: otpRecord.id },
    })
    throw new Error('發送驗證碼失敗，請稍後再試')
  }

  return {
    otpId: otpRecord.id,
    expiresAt,
  }
}

/**
 * 驗證 OTP
 *
 * @param lineUserId LINE User ID
 * @param code 用戶輸入的驗證碼
 * @param purpose 用途
 * @returns 驗證是否成功
 */
export async function verifyOtp(
  lineUserId: string,
  code: string,
  purpose: 'REGISTER' | 'LOGIN'
): Promise<{ success: boolean; message: string }> {
  // 查找最新的 OTP
  const otpRecord = await prisma.otpVerification.findFirst({
    where: {
      phone: lineUserId,
      purpose,
      isUsed: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (!otpRecord) {
    return {
      success: false,
      message: '找不到驗證碼記錄，請重新發送',
    }
  }

  // 檢查是否已過期
  if (new Date() > otpRecord.expiresAt) {
    return {
      success: false,
      message: '驗證碼已過期，請重新發送',
    }
  }

  // 檢查嘗試次數
  if (otpRecord.attempts >= MAX_ATTEMPTS) {
    return {
      success: false,
      message: `嘗試次數過多，請重新發送驗證碼`,
    }
  }

  // 驗證碼錯誤
  if (otpRecord.code !== code) {
    // 增加嘗試次數
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: {
        attempts: {
          increment: 1,
        },
      },
    })

    const remainingAttempts = MAX_ATTEMPTS - otpRecord.attempts - 1
    return {
      success: false,
      message: `驗證碼錯誤，剩餘 ${remainingAttempts} 次嘗試機會`,
    }
  }

  // 驗證成功，標記為已使用
  await prisma.otpVerification.update({
    where: { id: otpRecord.id },
    data: {
      isUsed: true,
      usedAt: new Date(),
    },
  })

  return {
    success: true,
    message: '驗證成功',
  }
}

/**
 * 清理過期的 OTP（定期執行）
 */
export async function cleanupExpiredOtps(): Promise<number> {
  const result = await prisma.otpVerification.deleteMany({
    where: {
      OR: [
        {
          expiresAt: {
            lt: new Date(),
          },
        },
        {
          isUsed: true,
          usedAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 已使用且超過 24 小時
          },
        },
      ],
    },
  })

  return result.count
}

/**
 * 取消特定用戶的所有未使用 OTP
 */
export async function cancelUserOtps(lineUserId: string): Promise<void> {
  await prisma.otpVerification.updateMany({
    where: {
      phone: lineUserId,
      isUsed: false,
    },
    data: {
      isUsed: true,
      usedAt: new Date(),
    },
  })
}
