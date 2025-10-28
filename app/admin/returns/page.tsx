'use client';

/**
 * 管理員退貨管理頁面
 *
 * 功能：
 * 1. 查看所有退貨申請
 * 2. 根據狀態篩選 (REQUESTED, APPROVED, REJECTED, RECEIVED, PROCESSING, COMPLETED)
 * 3. 審核退貨申請（批准/拒絕）
 * 4. 確認收到貨物
 * 5. 處理退款
 *
 * 退貨流程：
 * REQUESTED（客戶申請）→ APPROVED（賣家批准）→ RECEIVED（收到貨物）→ PROCESSING（處理中）→ COMPLETED（完成退款）
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import toast from 'react-hot-toast';

const ALL_RETURNS_QUERY = gql`
  query AllReturns($status: ReturnStatus, $skip: Int, $take: Int) {
    allReturns(status: $status, skip: $skip, take: $take) {
      items {
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
        isSizeIssue
        requestedSize
        order {
          orderNumber
          user {
            id
            name
            email
            phone
          }
        }
        items {
          id
          quantity
          reason
          orderItem {
            productName
            price
            sizeEu
            color
          }
        }
      }
      total
      hasMore
    }
  }
`;

const UPDATE_RETURN_STATUS_MUTATION = gql`
  mutation UpdateReturnStatus($id: ID!, $input: UpdateReturnStatusInput!) {
    updateReturnStatus(id: $id, input: $input) {
      id
      status
      refundStatus
    }
  }
`;

const statusMap = {
  REQUESTED: { label: '待審核', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: '已批准', color: 'bg-blue-100 text-blue-800' },
  REJECTED: { label: '已拒絕', color: 'bg-red-100 text-red-800' },
  RECEIVED: { label: '已收貨', color: 'bg-purple-100 text-purple-800' },
  PROCESSING: { label: '處理中', color: 'bg-indigo-100 text-indigo-800' },
  COMPLETED: { label: '已完成', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: '已取消', color: 'bg-gray-100 text-gray-800' },
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

export default function AdminReturnsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const { data, loading, error, refetch } = useQuery(ALL_RETURNS_QUERY, {
    variables: {
      status: selectedStatus || undefined,
      skip: 0,
      take: 50,
    },
  });

  const [updateReturnStatus, { loading: updating }] = useMutation(UPDATE_RETURN_STATUS_MUTATION);

  const handleStatusUpdate = async (returnId: string, newStatus: string, refundAmount?: number) => {
    try {
      await updateReturnStatus({
        variables: {
          id: returnId,
          input: {
            status: newStatus,
            adminNotes,
            refundAmount,
          },
        },
      });

      toast.success(`退貨狀態已更新為：${statusMap[newStatus as keyof typeof statusMap].label}`);
      refetch();
      setShowDetailModal(false);
      setAdminNotes('');
    } catch (err: any) {
      toast.error(err.message || '更新失敗');
    }
  };

  const openDetailModal = (returnData: any) => {
    setSelectedReturn(returnData);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">錯誤：{error.message}</div>
      </div>
    );
  }

  const returns = data?.allReturns?.items || [];
  const total = data?.allReturns?.total || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">退貨管理</h1>
        <p className="text-gray-600">管理客戶的退貨申請，審核並處理退款</p>
      </div>

      {/* 狀態篩選 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <label className="block text-sm font-medium mb-2">篩選狀態</label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">全部</option>
          <option value="REQUESTED">待審核</option>
          <option value="APPROVED">已批准</option>
          <option value="REJECTED">已拒絕</option>
          <option value="RECEIVED">已收貨</option>
          <option value="PROCESSING">處理中</option>
          <option value="COMPLETED">已完成</option>
          <option value="CANCELLED">已取消</option>
        </select>
        <p className="text-sm text-gray-500 mt-2">共 {total} 筆退貨申請</p>
      </div>

      {/* 退貨列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">退貨單號</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">訂單號</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客戶資訊</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">退款金額</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">原因</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申請時間</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {returns.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  暫無退貨申請
                </td>
              </tr>
            ) : (
              returns.map((returnData: any) => (
                <tr key={returnData.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {returnData.returnNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {returnData.order.orderNumber}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>{returnData.order.user?.name || '訪客'}</div>
                    <div className="text-gray-500 text-xs">{returnData.order.user?.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                    ${Number(returnData.refundAmount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {reasonMap[returnData.reason as keyof typeof reasonMap]}
                    {returnData.isSizeIssue && (
                      <div className="text-xs text-gray-500">尺寸：{returnData.requestedSize}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusMap[returnData.status as keyof typeof statusMap].color
                      }`}
                    >
                      {statusMap[returnData.status as keyof typeof statusMap].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(returnData.createdAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openDetailModal(returnData)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      查看詳情
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 詳情彈窗 */}
      {showDetailModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">退貨申請詳情</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* 基本資訊 */}
              <div>
                <h3 className="font-semibold text-lg mb-3">基本資訊</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">退貨單號：</span>
                    <span className="font-medium">{selectedReturn.returnNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">訂單號：</span>
                    <span className="font-medium">{selectedReturn.order.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">客戶姓名：</span>
                    <span className="font-medium">{selectedReturn.order.user?.name || '訪客'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">聯絡電話：</span>
                    <span className="font-medium">{selectedReturn.order.user?.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">退貨原因：</span>
                    <span className="font-medium">
                      {reasonMap[selectedReturn.reason as keyof typeof reasonMap]}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">退款金額：</span>
                    <span className="font-medium text-red-600">
                      ${Number(selectedReturn.refundAmount).toLocaleString()}
                    </span>
                  </div>
                  {selectedReturn.trackingNumber && (
                    <div className="col-span-2">
                      <span className="text-gray-600">711 寄件單號：</span>
                      <span className="font-medium">{selectedReturn.trackingNumber}</span>
                    </div>
                  )}
                </div>

                {selectedReturn.description && (
                  <div className="mt-4">
                    <span className="text-gray-600">詳細說明：</span>
                    <p className="mt-1 text-sm">{selectedReturn.description}</p>
                  </div>
                )}
              </div>

              {/* 退貨商品 */}
              <div>
                <h3 className="font-semibold text-lg mb-3">退貨商品</h3>
                <div className="space-y-2">
                  {selectedReturn.items.map((item: any) => (
                    <div key={item.id} className="border rounded p-3 text-sm">
                      <div className="font-medium">{item.orderItem.productName}</div>
                      <div className="text-gray-600 mt-1">
                        數量：{item.quantity} | 尺碼：{item.orderItem.sizeEu} | 顏色：{item.orderItem.color}
                      </div>
                      <div className="text-gray-600">
                        單價：${Number(item.orderItem.price).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 管理員備註 */}
              <div>
                <label className="block text-sm font-medium mb-2">管理員備註</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="輸入備註（選填）"
                />
              </div>

              {/* 操作按鈕 */}
              <div className="flex flex-wrap gap-3">
                {selectedReturn.status === 'REQUESTED' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(selectedReturn.id, 'APPROVED')}
                      disabled={updating}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      批准退貨
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedReturn.id, 'REJECTED')}
                      disabled={updating}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      拒絕退貨
                    </button>
                  </>
                )}

                {selectedReturn.status === 'APPROVED' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedReturn.id, 'RECEIVED')}
                    disabled={updating}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    確認已收到貨物
                  </button>
                )}

                {selectedReturn.status === 'RECEIVED' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedReturn.id, 'PROCESSING')}
                    disabled={updating}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    開始處理退款
                  </button>
                )}

                {selectedReturn.status === 'PROCESSING' && (
                  <button
                    onClick={() =>
                      handleStatusUpdate(
                        selectedReturn.id,
                        'COMPLETED',
                        Number(selectedReturn.refundAmount)
                      )
                    }
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    完成退款
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setAdminNotes('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
