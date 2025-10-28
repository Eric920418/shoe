/**
 * 認證 Resolvers - LINE Login + OTP 驗證
 *
 * 認證流程：
 * 1. 用戶點擊「LINE 登入」→ 取得 LINE Profile
 * 2. 系統發送 OTP 到 LINE（sendLineOtp）
 * 3. 用戶輸入 OTP 驗證（verifyLineOtp）
 * 4. 驗證成功 → 完成註冊/登入（lineLoginOrRegister）
 */

import { GraphQLError } from 'graphql'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth'
import { validateEmail, validatePassword } from '@/lib/validation'
import {
  getLineAccessToken,
  getLineProfile,
  generateLineLoginUrl,
  isLineLoginEnabled,
} from '@/lib/line'
import { sendOtp, verifyOtp } from '@/lib/otp'

interface GraphQLContext {
  user?: {
    userId: string
    email: string
    role: string
  } | null
}

interface RegisterInput {
  email: string
  phone?: string
  password: string
  name: string
}

interface LoginInput {
  email: string
  password: string
}

export const authResolvers = {
  Query: {
    // 獲取當前用戶資訊
    me: async (_: any, __: any, { user }: GraphQLContext) => {
      if (!user) {
        throw new GraphQLError('未登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      return await prisma.user.findUnique({
        where: { id: user.userId },
        include: {
          addresses: true,
        },
      })
    },

    // 獲取所有用戶（僅管理員）
    users: async (
      _: any,
      { skip = 0, take = 50, where }: { skip?: number; take?: number; where?: any },
      { user }: GraphQLContext
    ) => {
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('權限不足', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      return await prisma.user.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          addresses: true,
        },
      })
    },
  },

  Mutation: {
    // ==========================================
    // LINE Login 流程
    // ==========================================

    /**
     * 步驟 1：取得 LINE Login URL
     * 前端獲取後跳轉到 LINE 授權頁面
     */
    getLineLoginUrl: async () => {
      if (!isLineLoginEnabled()) {
        throw new GraphQLError('LINE Login 尚未啟用', {
          extensions: { code: 'SERVICE_UNAVAILABLE' },
        })
      }

      return {
        url: generateLineLoginUrl(),
      }
    },

    /**
     * 步驟 2：使用 LINE 授權碼換取用戶資料並發送 OTP
     * 前端從 LINE 回調後調用此 API
     */
    lineLoginCallback: async (_: any, { code }: { code: string }) => {
      try {
        // 使用授權碼換取 Access Token
        const tokenData = await getLineAccessToken(code)

        // 取得 LINE 用戶資料
        const lineProfile = await getLineProfile(tokenData.access_token)

        // 檢查用戶是否已存在
        const existingUser = await prisma.user.findUnique({
          where: { lineId: lineProfile.userId },
        })

        const purpose = existingUser ? 'LOGIN' : 'REGISTER'

        // 發送 OTP 到 LINE
        const { otpId, expiresAt } = await sendOtp(lineProfile.userId, purpose)

        return {
          lineUserId: lineProfile.userId,
          displayName: lineProfile.displayName,
          pictureUrl: lineProfile.pictureUrl,
          isNewUser: !existingUser,
          otpSent: true,
          expiresAt: expiresAt.toISOString(),
        }
      } catch (error: any) {
        console.error('LINE Login Callback 錯誤:', error)
        throw new GraphQLError(error.message || '登入失敗，請稍後再試', {
          extensions: { code: 'AUTHENTICATION_ERROR' },
        })
      }
    },

    /**
     * 步驟 3：驗證 OTP 並完成註冊/登入
     */
    verifyLineOtp: async (
      _: any,
      {
        lineUserId,
        code,
        name,
        phone,
      }: {
        lineUserId: string
        code: string
        name?: string
        phone?: string
      }
    ) => {
      try {
        // 檢查用戶是否已存在
        let user = await prisma.user.findUnique({
          where: { lineId: lineUserId },
        })

        const purpose = user ? 'LOGIN' : 'REGISTER'

        // 驗證 OTP
        const verification = await verifyOtp(lineUserId, code, purpose)

        if (!verification.success) {
          throw new GraphQLError(verification.message, {
            extensions: { code: 'INVALID_OTP' },
          })
        }

        // 如果是新用戶，創建帳號
        if (!user) {
          if (!name || name.trim().length === 0) {
            throw new GraphQLError('請提供姓名', {
              extensions: { code: 'BAD_USER_INPUT' },
            })
          }

          // 生成臨時 email（如果沒有提供）
          const tempEmail = `line_${lineUserId}@temp.local`

          user = await prisma.user.create({
            data: {
              lineId: lineUserId,
              name: name.trim(),
              phone: phone?.trim() || null,
              email: tempEmail,
              isLineConnected: true,
              lineConnectedAt: new Date(),
              role: 'USER',
            },
          })
        } else {
          // 更新最後登入時間
          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastLogin: new Date(),
              // 如果提供了姓名和手機，更新
              ...(name && { name: name.trim() }),
              ...(phone && { phone: phone.trim() }),
            },
          })
        }

        // 生成 JWT Token
        const token = generateToken({
          userId: user.id,
          email: user.email || '',
          role: user.role,
        })

        return {
          token,
          user,
        }
      } catch (error: any) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('驗證 OTP 錯誤:', error)
        throw new GraphQLError('驗證失敗，請稍後再試', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    /**
     * 重新發送 OTP
     */
    resendLineOtp: async (_: any, { lineUserId }: { lineUserId: string }) => {
      try {
        const user = await prisma.user.findUnique({
          where: { lineId: lineUserId },
        })

        const purpose = user ? 'LOGIN' : 'REGISTER'

        const { otpId, expiresAt } = await sendOtp(lineUserId, purpose)

        return {
          success: true,
          message: '驗證碼已重新發送',
          expiresAt: expiresAt.toISOString(),
        }
      } catch (error: any) {
        throw new GraphQLError(error.message || '發送失敗，請稍後再試', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // ==========================================
    // 管理員快速登入（開發/測試用）
    // ==========================================

    /**
     * 管理員快速登入
     * 輸入 admin0900 即可直接登入管理員帳號
     */
    adminQuickLogin: async (_: any, { code }: { code: string }) => {
      // 檢查是否為管理員快速登入碼
      if (code !== 'admin0900') {
        throw new GraphQLError('無效的管理員登入碼', {
          extensions: { code: 'INVALID_CODE' },
        })
      }

      // 查找或創建管理員帳號
      let admin = await prisma.user.findFirst({
        where: {
          role: 'ADMIN',
          phone: '0900000000',
        },
      })

      if (!admin) {
        // 如果管理員不存在，創建一個
        admin = await prisma.user.create({
          data: {
            phone: '0900000000',
            email: 'admin@shoe.com',
            name: '系統管理員',
            role: 'ADMIN',
            membershipTierId: 'diamond_tier_default', // 鑽石等級
            totalSpent: 250000,
          },
        })
      }

      // 更新最後登入時間
      await prisma.user.update({
        where: { id: admin.id },
        data: { lastLogin: new Date() },
      })

      // 生成 JWT Token
      const token = generateToken({
        userId: admin.id,
        email: admin.email || '',
        role: admin.role,
      })

      return {
        token,
        user: admin,
      }
    },

    // ==========================================
    // 向後兼容：舊的手機號註冊/登入（不安全，建議移除）
    // ==========================================

    // 用戶註冊/登入（使用手機號碼）
    register: async (_: any, { phone, name }: { phone: string; name: string }) => {
      try {
        // 驗證手機號碼
        if (!phone || !/^09\d{8}$/.test(phone.trim())) {
          throw new GraphQLError('請輸入有效的台灣手機號碼（例如：0912345678）', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        // 驗證姓名
        if (!name || name.trim().length === 0) {
          throw new GraphQLError('請輸入姓名', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        const phoneNumber = phone.trim()
        const userName = name.trim()

        // 檢查 phone 是否已存在
        let user = await prisma.user.findUnique({
          where: { phone: phoneNumber },
        })

        // 如果用戶不存在，創建新用戶
        if (!user) {
          // 生成一個唯一的 email（使用手機號碼）
          const email = `${phoneNumber}@phone.local`

          user = await prisma.user.create({
            data: {
              phone: phoneNumber,
              email,
              name: userName,
              password: '', // 不使用密碼
              role: 'USER',
            },
          })
        } else {
          // 如果用戶已存在，更新姓名
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              name: userName,
              lastLogin: new Date(),
            },
          })
        }

        // 生成 JWT Token
        const token = generateToken({
          userId: user.id,
          email: user.email,
          role: user.role,
        })

        return {
          token,
          user,
        }
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error
        }
        console.error('註冊/登入錯誤:', error)
        throw new GraphQLError('操作失敗，請稍後再試', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      }
    },

    // 用戶登入（使用手機號碼）
    login: async (_: any, { identifier, password }: { identifier: string; password: string }) => {
      // 驗證輸入
      if (!identifier || !identifier.trim()) {
        throw new GraphQLError('請輸入帳號', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }

      if (!password) {
        throw new GraphQLError('請輸入密碼', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }

      const identifierTrimmed = identifier.trim()

      // 查找用戶（支援手機號碼或 Email）
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: identifierTrimmed },
            { email: identifierTrimmed },
          ],
        },
      })

      if (!user) {
        throw new GraphQLError('帳號或密碼錯誤', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      // 檢查是否設定密碼
      if (!user.password) {
        throw new GraphQLError('此帳號尚未設定密碼，請使用 LINE 登入', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      // 驗證密碼
      const isPasswordValid = await verifyPassword(password, user.password)
      if (!isPasswordValid) {
        throw new GraphQLError('帳號或密碼錯誤', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      // 更新最後登入時間
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      })

      // 生成 JWT Token
      const token = generateToken({
        userId: user.id,
        email: user.email || '',
        role: user.role,
      })

      return {
        token,
        user,
      }
    },
  },

  User: {
    // 解析會員等級配置
    membershipTierConfig: async (user: any) => {
      if (!user.membershipTierId) return null
      return await prisma.membershipTierConfig.findUnique({
        where: { id: user.membershipTierId },
      })
    },

    // 解析用戶地址
    addresses: async (user: any) => {
      return await prisma.address.findMany({
        where: { userId: user.id },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      })
    },

    // 解析用戶訂單
    orders: async (user: any) => {
      return await prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: true } },
          address: true,
          coupon: true,
        },
      })
    },

    // 解析用戶優惠券
    userCoupons: async (user: any) => {
      try {
        if (!user?.id) return []
        return await prisma.userCoupon.findMany({
          where: { userId: user.id },
          include: { coupon: true },
          orderBy: { createdAt: 'desc' },
        })
      } catch (error) {
        console.error('用戶優惠券解析錯誤:', error)
        return []
      }
    },
  },
}
