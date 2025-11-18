/**
 * GraphQL Payment Resolvers
 *
 * 功能：
 * - 查詢支付資訊
 * - 創建支付請求
 * - 查詢支付狀態
 */

import { prisma } from '@/lib/prisma';
import { formatPaymentType } from '@/lib/newebpay-correct';

// ============================================
// Query Resolvers
// ============================================

export const paymentQueries = {
  /**
   * 根據訂單 ID 查詢支付資訊
   */
  async payment(_: any, { orderId }: { orderId: string }, context: any) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { orderId },
        include: {
          order: {
            include: {
              items: true,
              user: true,
            },
          },
        },
      });

      if (!payment) {
        throw new Error(`找不到訂單 ${orderId} 的支付資訊`);
      }

      // 檢查權限：只有訂單擁有者或管理員可以查看
      const user = context.user;
      if (!user || (user.role !== 'ADMIN' && payment.order.userId !== user.id)) {
        throw new Error('無權限查看此支付資訊');
      }

      return {
        id: payment.id,
        orderId: payment.orderId,
        merchantOrderNo: payment.merchantOrderNo,
        tradeNo: payment.tradeNo,
        amount: payment.amount,
        paymentType: payment.paymentType,
        paymentTypeName: formatPaymentType(payment.paymentType),
        status: payment.status,
        // ATM 資訊
        atmBankCode: payment.atmBankCode,
        atmVirtualAccount: payment.atmVirtualAccount,
        atmExpireDate: payment.atmExpireDate,
        // 超商資訊
        cvsBankCode: payment.cvsBankCode,
        cvsPaymentNo: payment.cvsPaymentNo,
        cvsExpireDate: payment.cvsExpireDate,
        // 信用卡資訊
        card4No: payment.card4No,
        card6No: payment.card6No,
        authBank: payment.authBank,
        respondCode: payment.respondCode,
        // 時間
        payTime: payment.payTime,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        // 錯誤資訊
        errorMessage: payment.errorMessage,
        errorCode: payment.errorCode,
      };
    } catch (error) {
      throw new Error(`查詢支付資訊失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  },

  /**
   * 根據商店訂單編號查詢支付資訊
   */
  async paymentByMerchantOrderNo(
    _: any,
    { merchantOrderNo }: { merchantOrderNo: string },
    context: any
  ) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { merchantOrderNo },
        include: {
          order: {
            include: {
              items: true,
              user: true,
            },
          },
        },
      });

      if (!payment) {
        throw new Error(`找不到訂單編號 ${merchantOrderNo} 的支付資訊`);
      }

      // 檢查權限
      const user = context.user;
      if (!user || (user.role !== 'ADMIN' && payment.order.userId !== user.id)) {
        throw new Error('無權限查看此支付資訊');
      }

      return {
        id: payment.id,
        orderId: payment.orderId,
        merchantOrderNo: payment.merchantOrderNo,
        tradeNo: payment.tradeNo,
        amount: payment.amount,
        paymentType: payment.paymentType,
        paymentTypeName: formatPaymentType(payment.paymentType),
        status: payment.status,
        atmBankCode: payment.atmBankCode,
        atmVirtualAccount: payment.atmVirtualAccount,
        atmExpireDate: payment.atmExpireDate,
        cvsBankCode: payment.cvsBankCode,
        cvsPaymentNo: payment.cvsPaymentNo,
        cvsExpireDate: payment.cvsExpireDate,
        card4No: payment.card4No,
        card6No: payment.card6No,
        authBank: payment.authBank,
        respondCode: payment.respondCode,
        payTime: payment.payTime,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        errorMessage: payment.errorMessage,
        errorCode: payment.errorCode,
      };
    } catch (error) {
      throw new Error(`查詢支付資訊失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  },

  /**
   * 查詢用戶的所有支付記錄（管理員專用）
   */
  async payments(_: any, { userId, status }: { userId?: string; status?: string }, context: any) {
    try {
      // 只有管理員可以查詢所有支付記錄
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new Error('無權限查詢支付記錄');
      }

      const where: any = {};
      if (userId) {
        where.order = { userId };
      }
      if (status) {
        where.status = status;
      }

      const payments = await prisma.payment.findMany({
        where,
        include: {
          order: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return payments.map((payment) => ({
        id: payment.id,
        orderId: payment.orderId,
        merchantOrderNo: payment.merchantOrderNo,
        tradeNo: payment.tradeNo,
        amount: payment.amount,
        paymentType: payment.paymentType,
        paymentTypeName: formatPaymentType(payment.paymentType),
        status: payment.status,
        atmBankCode: payment.atmBankCode,
        atmVirtualAccount: payment.atmVirtualAccount,
        atmExpireDate: payment.atmExpireDate,
        cvsBankCode: payment.cvsBankCode,
        cvsPaymentNo: payment.cvsPaymentNo,
        cvsExpireDate: payment.cvsExpireDate,
        card4No: payment.card4No,
        card6No: payment.card6No,
        authBank: payment.authBank,
        respondCode: payment.respondCode,
        payTime: payment.payTime,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        errorMessage: payment.errorMessage,
        errorCode: payment.errorCode,
        order: payment.order,
      }));
    } catch (error) {
      throw new Error(`查詢支付記錄失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  },
};

// ============================================
// Mutation Resolvers
// ============================================

export const paymentMutations = {
  /**
   * 創建支付請求（前端呼叫 API 即可，這裡保留作為備用）
   */
  async createPayment(
    _: any,
    {
      orderId,
      paymentTypes,
    }: {
      orderId: string;
      paymentTypes: string[];
    },
    context: any
  ) {
    try {
      // 驗證登入狀態
      if (!context.user) {
        throw new Error('請先登入');
      }

      // 查詢訂單
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error(`找不到訂單：${orderId}`);
      }

      // 檢查權限
      if (context.user.role !== 'ADMIN' && order.userId !== context.user.id) {
        throw new Error('無權限建立此訂單的支付');
      }

      // 檢查訂單是否已支付
      if (order.paymentStatus === 'PAID') {
        throw new Error('此訂單已完成支付');
      }

      return {
        success: true,
        message: '請使用前端 API /api/newebpay/create-payment 創建支付',
        orderId,
      };
    } catch (error) {
      throw new Error(`創建支付請求失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  },

  /**
   * 取消支付（將支付狀態設為取消）
   */
  async cancelPayment(_: any, { paymentId }: { paymentId: string }, context: any) {
    try {
      if (!context.user) {
        throw new Error('請先登入');
      }

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });

      if (!payment) {
        throw new Error(`找不到支付記錄：${paymentId}`);
      }

      // 檢查權限
      if (context.user.role !== 'ADMIN' && payment.order.userId !== context.user.id) {
        throw new Error('無權限取消此支付');
      }

      // 只有 PENDING 狀態可以取消
      if (payment.status !== 'PENDING') {
        throw new Error(`無法取消狀態為 ${payment.status} 的支付`);
      }

      // 更新支付狀態
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
      });

      // 更新訂單狀態
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'FAILED',
          status: 'CANCELLED',
        },
      });

      return {
        success: true,
        message: '支付已取消',
      };
    } catch (error) {
      throw new Error(`取消支付失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  },
};
