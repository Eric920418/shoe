/**
 * Resolvers索引 - 汇总所有resolvers
 */

import { authResolvers } from './authResolvers'
import { productResolvers } from './productResolvers'
import { sizeResolvers } from './sizeResolvers'
import { cartResolvers } from './cartResolvers'
import { orderResolvers } from './orderResolvers'
import { userResolvers } from './userResolvers'
import { reviewResolvers } from './reviewResolvers'
import { couponResolvers } from './couponResolvers'
import { creditResolvers } from './creditResolvers'
import { announcementResolvers } from './announcementResolvers'
import { referralResolvers } from './referralResolvers'
import { chatResolvers } from './chatResolvers'
import { returnResolvers } from './returnResolvers'
import { membershipTierResolvers } from './membershipTierResolvers'
import { faqResolvers } from './faqResolvers'
import { heroSlideResolvers } from './heroSlideResolvers'
import { emailCampaignResolvers } from './emailCampaignResolvers'
import { homepageResolvers } from './homepageResolvers'
import { wishlistResolvers } from './wishlistResolvers'
import { bundleResolvers } from './bundleResolvers'
import { dashboardResolvers } from './dashboardResolvers'
import { paymentQueries, paymentMutations } from './paymentResolvers'
import { GraphQLScalarType, Kind } from 'graphql'

// Decimal scalar 定義 - 用於處理精確的十進制數字
const DecimalScalar = new GraphQLScalarType({
  name: 'Decimal',
  description: 'A high precision decimal value represented as a string',

  // 序列化：從資料庫讀取時，將 Prisma Decimal 轉換為字符串
  serialize(value: any) {
    if (value === null || value === undefined) return null
    // Prisma Decimal 對象有 toString() 方法
    return value.toString()
  },

  // 解析值：從變量傳入時（JSON），將數字或字符串轉換為字符串
  parseValue(value: any) {
    if (value === null || value === undefined) return null
    if (typeof value === 'number' || typeof value === 'string') {
      return String(value)
    }
    throw new Error('Decimal must be a number or string')
  },

  // 解析字面量：從查詢字符串傳入時，轉換為字符串
  parseLiteral(ast: any) {
    if (ast.kind === Kind.INT || ast.kind === Kind.FLOAT || ast.kind === Kind.STRING) {
      return ast.value
    }
    return null
  },
})

// 合并所有resolvers
export const resolvers = {
  // 添加 Decimal scalar 處理器
  Decimal: DecimalScalar,

  Query: {
    ...authResolvers.Query,
    ...productResolvers.Query,
    ...cartResolvers.Query,
    ...orderResolvers.Query,
    ...userResolvers.Query,
    ...reviewResolvers.Query,
    ...couponResolvers.Query,
    ...creditResolvers.Query,
    ...announcementResolvers.Query,
    ...referralResolvers.Query,
    ...chatResolvers.Query,
    ...returnResolvers.Query,
    ...membershipTierResolvers.Query,
    ...faqResolvers.Query,
    ...heroSlideResolvers.Query,
    ...emailCampaignResolvers.Query,
    ...homepageResolvers.Query,
    ...wishlistResolvers.Query,
    ...bundleResolvers.Query,
    ...dashboardResolvers.Query,
    ...paymentQueries,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...productResolvers.Mutation,
    ...sizeResolvers.Mutation,
    ...cartResolvers.Mutation,
    ...orderResolvers.Mutation,
    ...userResolvers.Mutation,
    ...reviewResolvers.Mutation,
    ...couponResolvers.Mutation,
    ...creditResolvers.Mutation,
    ...announcementResolvers.Mutation,
    ...referralResolvers.Mutation,
    ...chatResolvers.Mutation,
    ...returnResolvers.Mutation,
    ...membershipTierResolvers.Mutation,
    ...faqResolvers.Mutation,
    ...heroSlideResolvers.Mutation,
    ...emailCampaignResolvers.Mutation,
    ...homepageResolvers.Mutation,
    ...wishlistResolvers.Mutation,
    ...bundleResolvers.Mutation,
    ...paymentMutations,
  },
  User: authResolvers.User,
  Product: productResolvers.Product,
  Category: productResolvers.Category,
  Brand: productResolvers.Brand,
  SizeChart: sizeResolvers.SizeChart,
  Cart: cartResolvers.Cart,
  CartItem: cartResolvers.CartItem,
  Review: reviewResolvers.Review,
  UserCoupon: couponResolvers.UserCoupon,
  UserCredit: creditResolvers.UserCredit,
  ReferralCode: referralResolvers.ReferralCode,
  Conversation: chatResolvers.Conversation,
  Return: returnResolvers.Return,
  ReturnItem: returnResolvers.ReturnItem,
  EmailCampaign: emailCampaignResolvers.EmailCampaign,
  EmailLog: emailCampaignResolvers.EmailLog,
  WishlistItem: wishlistResolvers.WishlistItem,
}
