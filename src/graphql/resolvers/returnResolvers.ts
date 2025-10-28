/**
 * 退貨系統 GraphQL Resolvers
 *
 * 完整退貨流程：
 * 1. 客戶提交退貨申請 (REQUESTED)
 * 2. 賣家審核 (APPROVED/REJECTED)
 * 3. 客戶寄件到 711
 * 4. 賣家收到貨物 (RECEIVED)
 * 5. 賣家處理退款 (COMPLETED)
 */

import { GraphQLError } from 'graphql';
import { prisma } from '@/lib/prisma';
import { Context } from '../context';

interface CreateReturnInput {
  orderId: string;
  type: 'RETURN' | 'EXCHANGE' | 'REPAIR';
  reason: 'DEFECTIVE' | 'WRONG_ITEM' | 'SIZE_ISSUE' | 'NOT_AS_DESCRIBED' | 'DAMAGED_SHIPPING' | 'CHANGED_MIND' | 'OTHER';
  description?: string;
  images?: string[];
  items: Array<{
    orderItemId: string;
    quantity: number;
    reason?: string;
  }>;
  isSizeIssue?: boolean;
  requestedSize?: string;
}

interface UpdateReturnStatusInput {
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  trackingNumber?: string;
  adminNotes?: string;
  refundAmount?: number;
}

export const returnResolvers = {
  Query: {
    // 客戶查看自己的退貨申請
    myReturns: async (_: any, __: any, context: Context) => {
      if (!context.userId) {
        throw new GraphQLError('請先登入', { extensions: { code: 'UNAUTHENTICATED' } });
      }

      return await prisma.return.findMany({
        where: {
          order: {
            userId: context.userId,
          },
        },
        include: {
          order: {
            include: {
              items: true,
            },
          },
          items: {
            include: {
              orderItem: {
                include: {
                  product: true,
                  variant: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    },

    // 管理員查看所有退貨申請
    allReturns: async (
      _: any,
      { status, skip = 0, take = 20 }: { status?: string; skip?: number; take?: number },
      context: Context
    ) => {
      if (!context.userId || context.userRole !== 'ADMIN') {
        throw new GraphQLError('需要管理員權限', { extensions: { code: 'FORBIDDEN' } });
      }

      const where = status ? { status } : {};

      const [returns, total] = await Promise.all([
        prisma.return.findMany({
          where,
          skip,
          take,
          include: {
            order: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
                items: true,
              },
            },
            items: {
              include: {
                orderItem: {
                  include: {
                    product: true,
                    variant: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.return.count({ where }),
      ]);

      return {
        items: returns,
        total,
        hasMore: skip + take < total,
      };
    },

    // 查詢單一退貨詳情
    returnDetail: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.userId) {
        throw new GraphQLError('請先登入', { extensions: { code: 'UNAUTHENTICATED' } });
      }

      const returnData = await prisma.return.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              user: true,
              items: true,
            },
          },
          items: {
            include: {
              orderItem: {
                include: {
                  product: true,
                  variant: true,
                },
              },
            },
          },
        },
      });

      if (!returnData) {
        throw new GraphQLError('找不到退貨申請', { extensions: { code: 'NOT_FOUND' } });
      }

      // 檢查權限：管理員或訂單所有者
      if (context.userRole !== 'ADMIN' && returnData.order.userId !== context.userId) {
        throw new GraphQLError('無權查看此退貨申請', { extensions: { code: 'FORBIDDEN' } });
      }

      return returnData;
    },
  },

  Mutation: {
    // 客戶提交退貨申請
    createReturn: async (_: any, { input }: { input: CreateReturnInput }, context: Context) => {
      if (!context.userId) {
        throw new GraphQLError('請先登入', { extensions: { code: 'UNAUTHENTICATED' } });
      }

      // 1. 驗證訂單是否存在且屬於當前用戶
      const order = await prisma.order.findUnique({
        where: { id: input.orderId },
        include: { items: true },
      });

      if (!order) {
        throw new GraphQLError('找不到訂單', { extensions: { code: 'NOT_FOUND' } });
      }

      if (order.userId !== context.userId && context.userRole !== 'ADMIN') {
        throw new GraphQLError('無權對此訂單申請退貨', { extensions: { code: 'FORBIDDEN' } });
      }

      // 2. 驗證訂單狀態（只有已完成或已送達的訂單才能退貨）
      if (!['DELIVERED', 'COMPLETED'].includes(order.status)) {
        throw new GraphQLError(
          `訂單狀態為 ${order.status}，無法申請退貨。只有已送達或已完成的訂單才能退貨。`,
          { extensions: { code: 'INVALID_STATUS' } }
        );
      }

      // 3. 驗證退貨商品是否屬於該訂單
      const orderItemIds = order.items.map((item) => item.id);
      const invalidItems = input.items.filter((item) => !orderItemIds.includes(item.orderItemId));

      if (invalidItems.length > 0) {
        throw new GraphQLError('退貨商品不屬於此訂單', { extensions: { code: 'INVALID_ITEMS' } });
      }

      // 4. 計算退款金額
      let refundAmount = 0;
      for (const returnItem of input.items) {
        const orderItem = order.items.find((item) => item.id === returnItem.orderItemId);
        if (orderItem) {
          refundAmount += Number(orderItem.price) * returnItem.quantity;
        }
      }

      // 5. 生成退貨單號
      const returnNumber = `RTN${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // 6. 創建退貨記錄
      const returnRecord = await prisma.return.create({
        data: {
          returnNumber,
          orderId: input.orderId,
          type: input.type,
          reason: input.reason,
          description: input.description,
          images: input.images || [],
          refundAmount,
          refundStatus: 'PENDING',
          status: 'REQUESTED',
          isSizeIssue: input.isSizeIssue || false,
          requestedSize: input.requestedSize,
          items: {
            create: input.items.map((item) => ({
              orderItemId: item.orderItemId,
              quantity: item.quantity,
              reason: item.reason,
            })),
          },
        },
        include: {
          order: {
            include: {
              user: true,
              items: true,
            },
          },
          items: {
            include: {
              orderItem: {
                include: {
                  product: true,
                  variant: true,
                },
              },
            },
          },
        },
      });

      return returnRecord;
    },

    // 管理員更新退貨狀態
    updateReturnStatus: async (
      _: any,
      { id, input }: { id: string; input: UpdateReturnStatusInput },
      context: Context
    ) => {
      if (!context.userId || context.userRole !== 'ADMIN') {
        throw new GraphQLError('需要管理員權限', { extensions: { code: 'FORBIDDEN' } });
      }

      const returnData = await prisma.return.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              user: true,
            },
          },
          items: {
            include: {
              orderItem: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!returnData) {
        throw new GraphQLError('找不到退貨申請', { extensions: { code: 'NOT_FOUND' } });
      }

      // 狀態流程驗證
      const validTransitions: Record<string, string[]> = {
        REQUESTED: ['APPROVED', 'REJECTED', 'CANCELLED'],
        APPROVED: ['RECEIVED', 'CANCELLED'],
        REJECTED: [],
        RECEIVED: ['PROCESSING'],
        PROCESSING: ['COMPLETED', 'CANCELLED'],
        COMPLETED: [],
        CANCELLED: [],
      };

      if (!validTransitions[returnData.status]?.includes(input.status)) {
        throw new GraphQLError(
          `無法從 ${returnData.status} 狀態變更為 ${input.status} 狀態`,
          { extensions: { code: 'INVALID_TRANSITION' } }
        );
      }

      // 更新資料
      const updateData: any = {
        status: input.status,
        processedBy: context.userId,
        processedAt: new Date(),
      };

      if (input.trackingNumber) {
        updateData.trackingNumber = input.trackingNumber;
      }

      if (input.adminNotes) {
        updateData.adminNotes = input.adminNotes;
      }

      // 當狀態為 COMPLETED 時處理退款
      if (input.status === 'COMPLETED') {
        updateData.refundStatus = 'COMPLETED';
        updateData.refundedAt = new Date();

        // 如果指定了退款金額則使用，否則使用原始金額
        if (input.refundAmount !== undefined) {
          updateData.refundAmount = input.refundAmount;
        }

        // 更新訂單狀態為已退款
        await prisma.order.update({
          where: { id: returnData.orderId },
          data: {
            status: 'REFUNDED',
            paymentStatus: 'REFUNDED',
          },
        });

        // 恢復商品庫存
        for (const returnItem of returnData.items) {
          const orderItem = returnItem.orderItem;

          // 更新產品主庫存
          await prisma.product.update({
            where: { id: orderItem.productId },
            data: {
              stock: {
                increment: returnItem.quantity,
              },
            },
          });

          // 如果有變體，更新變體庫存
          if (orderItem.variantId) {
            await prisma.productVariant.update({
              where: { id: orderItem.variantId },
              data: {
                stock: {
                  increment: returnItem.quantity,
                },
              },
            });
          }

          // 如果購買時有指定尺碼，更新尺碼庫存
          if (orderItem.sizeEu) {
            const sizeChart = await prisma.sizeChart.findFirst({
              where: {
                productId: orderItem.productId,
                eu: orderItem.sizeEu,
              },
            });

            if (sizeChart) {
              await prisma.sizeChart.update({
                where: { id: sizeChart.id },
                data: {
                  stock: {
                    increment: returnItem.quantity,
                  },
                },
              });
            }
          }
        }

        // 發放退款購物金給客戶
        if (returnData.order.userId) {
          const validUntil = new Date();
          validUntil.setMonth(validUntil.getMonth() + 6); // 6個月有效期

          await prisma.userCredit.create({
            data: {
              userId: returnData.order.userId,
              amount: updateData.refundAmount || returnData.refundAmount,
              balance: updateData.refundAmount || returnData.refundAmount,
              source: 'REFUND',
              sourceId: returnData.id,
              validFrom: new Date(),
              validUntil,
              isActive: true,
            },
          });
        }
      }

      // 當狀態為 REJECTED 時
      if (input.status === 'REJECTED') {
        updateData.refundStatus = 'CANCELLED';
      }

      const updatedReturn = await prisma.return.update({
        where: { id },
        data: updateData,
        include: {
          order: {
            include: {
              user: true,
              items: true,
            },
          },
          items: {
            include: {
              orderItem: {
                include: {
                  product: true,
                  variant: true,
                },
              },
            },
          },
        },
      });

      return updatedReturn;
    },

    // 客戶上傳 711 寄件單號
    uploadReturnTrackingNumber: async (
      _: any,
      { returnId, trackingNumber }: { returnId: string; trackingNumber: string },
      context: Context
    ) => {
      if (!context.userId) {
        throw new GraphQLError('請先登入', { extensions: { code: 'UNAUTHENTICATED' } });
      }

      const returnData = await prisma.return.findUnique({
        where: { id: returnId },
        include: { order: true },
      });

      if (!returnData) {
        throw new GraphQLError('找不到退貨申請', { extensions: { code: 'NOT_FOUND' } });
      }

      // 檢查權限
      if (returnData.order.userId !== context.userId && context.userRole !== 'ADMIN') {
        throw new GraphQLError('無權操作此退貨申請', { extensions: { code: 'FORBIDDEN' } });
      }

      // 只有已批准的退貨才能上傳單號
      if (returnData.status !== 'APPROVED') {
        throw new GraphQLError('退貨申請尚未批准，無法上傳單號', { extensions: { code: 'INVALID_STATUS' } });
      }

      return await prisma.return.update({
        where: { id: returnId },
        data: {
          trackingNumber,
        },
        include: {
          order: {
            include: {
              user: true,
              items: true,
            },
          },
          items: {
            include: {
              orderItem: {
                include: {
                  product: true,
                  variant: true,
                },
              },
            },
          },
        },
      });
    },
  },

  Return: {
    order: async (parent: any) => {
      return await prisma.order.findUnique({
        where: { id: parent.orderId },
        include: {
          user: true,
          items: true,
        },
      });
    },
    items: async (parent: any) => {
      return await prisma.returnItem.findMany({
        where: { returnId: parent.id },
        include: {
          orderItem: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });
    },
  },

  ReturnItem: {
    orderItem: async (parent: any) => {
      return await prisma.orderItem.findUnique({
        where: { id: parent.orderItemId },
        include: {
          product: true,
          variant: true,
        },
      });
    },
  },
};
