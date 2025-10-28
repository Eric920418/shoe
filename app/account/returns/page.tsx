'use client';

/**
 * 客戶退貨申請頁面
 *
 * 功能：
 * 1. 查看自己的所有退貨申請
 * 2. 為已完成的訂單提交退貨申請
 * 3. 上傳 711 寄件單號
 * 4. 追蹤退貨狀態
 */

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

const MY_RETURNS_QUERY = gql`
  query MyReturns {
    myReturns {
      id
      returnNumber
      status
      refundStatus
      refundAmount
      type
      reason
      description
      trackingNumber
      createdAt
      adminNotes
      order {
        id
        orderNumber
        status
      }
      items {
        id
        quantity
        orderItem {
          productName
          price
          sizeEu
          color
        }
      }
    }
  }
`;

const MY_ORDERS_QUERY = gql`
  query MyOrders {
    myOrders(skip: 0, take: 50) {
      id
      orderNumber
      status
      total
      createdAt
      items {
        id
        productName
        price
        quantity
        sizeEu
        color
      }
    }
  }
`;

const CREATE_RETURN_MUTATION = gql`
  mutation CreateReturn($input: CreateReturnInput!) {
    createReturn(input: $input) {
      id
      returnNumber
      status
    }
  }
`;

const UPLOAD_TRACKING_NUMBER_MUTATION = gql`
  mutation UploadReturnTrackingNumber($returnId: ID!, $trackingNumber: String!) {
    uploadReturnTrackingNumber(returnId: $returnId, trackingNumber: $trackingNumber) {
      id
      trackingNumber
    }
  }
`;

const statusMap = {
  REQUESTED: { label: '待審核', color: 'bg-yellow-100 text-yellow-800', desc: '賣家審核中' },
  APPROVED: { label: '已批准', color: 'bg-blue-100 text-blue-800', desc: '請至 711 寄件' },
  REJECTED: { label: '已拒絕', color: 'bg-red-100 text-red-800', desc: '退貨申請被拒絕' },
  RECEIVED: { label: '已收貨', color: 'bg-purple-100 text-purple-800', desc: '賣家已收到退貨' },
  PROCESSING: { label: '處理中', color: 'bg-indigo-100 text-indigo-800', desc: '退款處理中' },
  COMPLETED: { label: '已完成', color: 'bg-green-100 text-green-800', desc: '退款已完成' },
  CANCELLED: { label: '已取消', color: 'bg-gray-100 text-gray-800', desc: '退貨已取消' },
};

const reasonMap = {
  DEFECTIVE: '商品瑕疵',
  WRONG_ITEM: '錯誤商品',
  SIZE_ISSUE: '尺寸問題',
  NOT_AS_DESCRIBED: '與描述不符',
  DAMAGED_SHIPPING: '運送損壞',
  CHANGED_MIND: '改變心意',
  OTHER: '其他原因',
};

export default function MyReturnsPage() {
  const router = useRouter();
  const [showNewReturnModal, setShowNewReturnModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [returnType, setReturnType] = useState('RETURN');
  const [returnReason, setReturnReason] = useState('SIZE_ISSUE');
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const { data: returnsData, loading: returnsLoading, refetch: refetchReturns } = useQuery(MY_RETURNS_QUERY);
  const { data: ordersData, loading: ordersLoading } = useQuery(MY_ORDERS_QUERY);
  const [createReturn, { loading: creating }] = useMutation(CREATE_RETURN_MUTATION);
  const [uploadTrackingNumber, { loading: uploading }] = useMutation(UPLOAD_TRACKING_NUMBER_MUTATION);

  const handleCreateReturn = async () => {
    if (!selectedOrder || selectedItems.length === 0) {
      toast.error('請選擇要退貨的商品');
      return;
    }

    try {
      const result = await createReturn({
        variables: {
          input: {
            orderId: selectedOrder.id,
            type: returnType,
            reason: returnReason,
            description,
            items: selectedItems.map((itemId) => ({
              orderItemId: itemId,
              quantity: 1,
            })),
            isSizeIssue: returnReason === 'SIZE_ISSUE',
          },
        },
      });

      toast.success('退貨申請已提交，請等待審核');
      setShowNewReturnModal(false);
      setSelectedOrder(null);
      setSelectedItems([]);
      setDescription('');
      refetchReturns();
    } catch (err: any) {
      toast.error(err.message || '申請失敗');
    }
  };

  const handleUploadTracking = async () => {
    if (!trackingNumber.trim()) {
      toast.error('請輸入寄件單號');
      return;
    }

    try {
      await uploadTrackingNumber({
        variables: {
          returnId: selectedReturnId,
          trackingNumber: trackingNumber.trim(),
        },
      });

      toast.success('寄件單號已上傳');
      setShowTrackingModal(false);
      setTrackingNumber('');
      refetchReturns();
    } catch (err: any) {
      toast.error(err.message || '上傳失敗');
    }
  };

  const openTrackingModal = (returnId: string) => {
    setSelectedReturnId(returnId);
    setShowTrackingModal(true);
  };

  const eligibleOrders = ordersData?.myOrders?.filter(
    (order: any) => order.status === 'DELIVERED' || order.status === 'COMPLETED'
  ) || [];

  if (returnsLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">載入中...</div>
      </div>
    );
  }

  const returns = returnsData?.myReturns || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">我的退貨申請</h1>
          <p className="text-gray-600">查看和管理您的退貨申請</p>
        </div>
        <button
          onClick={() => setShowNewReturnModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          申請退貨
        </button>
      </div>

      {/* 退貨列表 */}
      {returns.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">您還沒有任何退貨申請</p>
          <button
            onClick={() => setShowNewReturnModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            立即申請退貨
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((returnData: any) => (
            <div key={returnData.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-lg font-semibold mb-1">
                    退貨單號：{returnData.returnNumber}
                  </div>
                  <div className="text-sm text-gray-600">
                    訂單號：{returnData.order.orderNumber}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                      statusMap[returnData.status as keyof typeof statusMap].color
                    }`}
                  >
                    {statusMap[returnData.status as keyof typeof statusMap].label}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {statusMap[returnData.status as keyof typeof statusMap].desc}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">退款金額：</span>
                  <span className="font-semibold text-red-600">
                    ${Number(returnData.refundAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">退貨原因：</span>
                  <span>{reasonMap[returnData.reason as keyof typeof reasonMap]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">申請時間：</span>
                  <span>{new Date(returnData.createdAt).toLocaleString('zh-TW')}</span>
                </div>
                {returnData.trackingNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">寄件單號：</span>
                    <span className="font-mono">{returnData.trackingNumber}</span>
                  </div>
                )}
                {returnData.adminNotes && (
                  <div className="text-sm">
                    <span className="text-gray-600">賣家備註：</span>
                    <p className="mt-1 text-gray-700">{returnData.adminNotes}</p>
                  </div>
                )}
              </div>

              {/* 退貨商品 */}
              <div className="border-t mt-4 pt-4">
                <div className="text-sm font-medium mb-2">退貨商品：</div>
                <div className="space-y-2">
                  {returnData.items.map((item: any) => (
                    <div key={item.id} className="text-sm bg-gray-50 p-3 rounded">
                      <div className="font-medium">{item.orderItem.productName}</div>
                      <div className="text-gray-600">
                        數量：{item.quantity} | 尺碼：{item.orderItem.sizeEu} | 顏色：{item.orderItem.color}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 操作按鈕 */}
              {returnData.status === 'APPROVED' && !returnData.trackingNumber && (
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => openTrackingModal(returnData.id)}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    上傳 711 寄件單號
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    請至 711 寄件後上傳寄件單號
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 新增退貨申請彈窗 */}
      {showNewReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">申請退貨</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* 選擇訂單 */}
              <div>
                <label className="block text-sm font-medium mb-2">選擇訂單</label>
                <select
                  value={selectedOrder?.id || ''}
                  onChange={(e) => {
                    const order = eligibleOrders.find((o: any) => o.id === e.target.value);
                    setSelectedOrder(order);
                    setSelectedItems([]);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">請選擇訂單</option>
                  {eligibleOrders.map((order: any) => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber} - ${Number(order.total).toLocaleString()} ({order.status})
                    </option>
                  ))}
                </select>
                {eligibleOrders.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    目前沒有可退貨的訂單（只有已完成或已送達的訂單才能退貨）
                  </p>
                )}
              </div>

              {/* 選擇退貨商品 */}
              {selectedOrder && (
                <div>
                  <label className="block text-sm font-medium mb-2">選擇退貨商品</label>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item: any) => (
                      <label key={item.id} className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, item.id]);
                            } else {
                              setSelectedItems(selectedItems.filter((id) => id !== item.id));
                            }
                          }}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-gray-600">
                            數量：{item.quantity} | 尺碼：{item.sizeEu} | 顏色：{item.color}
                          </div>
                        </div>
                        <div className="font-semibold">${Number(item.price).toLocaleString()}</div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 退貨原因 */}
              <div>
                <label className="block text-sm font-medium mb-2">退貨原因</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="SIZE_ISSUE">尺寸問題</option>
                  <option value="DEFECTIVE">商品瑕疵</option>
                  <option value="WRONG_ITEM">錯誤商品</option>
                  <option value="NOT_AS_DESCRIBED">與描述不符</option>
                  <option value="DAMAGED_SHIPPING">運送損壞</option>
                  <option value="CHANGED_MIND">改變心意</option>
                  <option value="OTHER">其他原因</option>
                </select>
              </div>

              {/* 詳細說明 */}
              <div>
                <label className="block text-sm font-medium mb-2">詳細說明（選填）</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  placeholder="請描述退貨原因的詳細情況"
                />
              </div>

              {/* 退貨流程說明 */}
              <div className="bg-blue-50 p-4 rounded-lg text-sm">
                <h4 className="font-semibold mb-2">退貨流程說明：</h4>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  <li>提交退貨申請，等待賣家審核</li>
                  <li>審核通過後，請至 711 寄件</li>
                  <li>寄件後上傳寄件單號</li>
                  <li>賣家收到貨物後處理退款</li>
                  <li>退款以購物金形式發放（有效期 6 個月）</li>
                </ol>
              </div>

              {/* 按鈕 */}
              <div className="flex gap-3">
                <button
                  onClick={handleCreateReturn}
                  disabled={creating || !selectedOrder || selectedItems.length === 0}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? '提交中...' : '提交申請'}
                </button>
                <button
                  onClick={() => {
                    setShowNewReturnModal(false);
                    setSelectedOrder(null);
                    setSelectedItems([]);
                    setDescription('');
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 上傳寄件單號彈窗 */}
      {showTrackingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">上傳 711 寄件單號</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">寄件單號</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="請輸入 711 寄件單號"
                />
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg text-sm text-gray-700">
                <p>請確保寄件單號正確，賣家將根據此單號追蹤貨物。</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUploadTracking}
                  disabled={uploading || !trackingNumber.trim()}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? '上傳中...' : '確認上傳'}
                </button>
                <button
                  onClick={() => {
                    setShowTrackingModal(false);
                    setTrackingNumber('');
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
