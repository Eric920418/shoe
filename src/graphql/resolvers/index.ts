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

// 合并所有resolvers
export const resolvers = {
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
  },
  User: authResolvers.User,
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
}
