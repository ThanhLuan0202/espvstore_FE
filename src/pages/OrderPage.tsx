import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, Space, Modal, Typography, message, Popconfirm, Input, Checkbox, Grid, List } from 'antd';
import { EyeOutlined, PrinterOutlined, CloseCircleOutlined, RollbackOutlined, DownloadOutlined } from '@ant-design/icons';
import { getOrders, updateOrderStatus } from '../services/order';
import type { Order } from '../services/order';
import { getSettings } from '../services/setting';
import type { Setting } from '../services/setting';

const { Title, Text } = Typography;

const OrderPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [refundReasonVisible, setRefundReasonVisible] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [isDefective, setIsDefective] = useState(false);

  const filteredOrders = orders.filter(o => 
    !searchTerm || o.orderCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchOrders();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Lỗi lấy settings', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      message.error('Lỗi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const handleUpdateStatus = async (status: number, actionName: string, note?: string, defectiveFlag: boolean = false) => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      await updateOrderStatus(selectedOrder.id, status, note || `Thực hiện ${actionName}`, defectiveFlag);
      message.success(`${actionName} thành công!`);
      setIsModalVisible(false);
      setRefundReasonVisible(false);
      setRefundReason('');
      setIsDefective(false);
      fetchOrders();
    } catch (error: any) {
      message.error(error.response?.data || `Lỗi khi ${actionName}`);
    } finally {
      setUpdating(false);
    }
  };

  const submitRefund = () => {
    if (!refundReason.trim()) {
      message.warning('Vui lòng nhập lý do hoàn tiền');
      return;
    }
    handleUpdateStatus(3, 'Hoàn tiền', refundReason, isDefective);
  };

  const isPast24h = selectedOrder ? (new Date().getTime() - new Date(selectedOrder.createdAt).getTime()) > 24 * 60 * 60 * 1000 : false;

  const handlePrint = () => {
    const printContent = document.getElementById('printable-invoice');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // To restore React event listeners
    }
  };

  const handleExportCsv = () => {
    if (orders.length === 0) {
      message.warning('Không có dữ liệu để xuất');
      return;
    }
    const headers = ['Mã Đơn', 'Khách Hàng', 'Ngày Tạo', 'Sản Phẩm', 'Tổng Tiền', 'Trạng Thái'];
    const rows = orders.map(o => {
      const productDetails = o.orderDetails?.map(item => `${item.productName} (SL: ${item.quantity})`).join(' | ') || '';
      return [
        o.orderCode,
        `"${o.customerName || 'Khách vãng lai'}"`,
        `"${new Date(o.createdAt).toLocaleString('vi-VN')}"`,
        `"${productDetails}"`,
        o.totalAmount,
        o.status
      ];
    });
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DonHang_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Tag color="green">Hoàn thành</Tag>;
      case 'PENDING': return <Tag color="orange">Chờ xử lý</Tag>;
      case 'CANCELLED': return <Tag color="red">Đã huỷ</Tag>;
      case 'REFUNDED': return <Tag color="magenta">Hoàn tiền</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Mã Đơn',
      dataIndex: 'orderCode',
      key: 'orderCode',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Khách Hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text: string) => text || 'Khách vãng lai',
    },
    {
      title: 'Ngày Tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString('vi-VN'),
    },
    {
      title: 'Tổng Tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => <Text type="success" strong>{amount.toLocaleString('vi-VN')} đ</Text>,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: Order) => (
        <Button 
          type="primary" 
          icon={<EyeOutlined />} 
          size="small" 
          onClick={() => handleView(record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = screens.xs || screens.sm && !screens.md;

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <Card 
        title={<span className="text-base sm:text-lg">Quản lý Đơn Hàng</span>} 
        className="shadow-sm"
        styles={{ header: { padding: isMobile ? '12px 16px' : '16px 24px' }, body: { padding: isMobile ? '8px' : '24px' } }}
        extra={
          <Button icon={<DownloadOutlined />} onClick={handleExportCsv} size={isMobile ? "small" : "middle"}>
            Xuất CSV
          </Button>
        }
      >
        <div className="mb-4">
          <Input.Search 
            placeholder="Tìm theo mã đơn hàng..." 
            allowClear 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-[300px]"
          />
        </div>
        
        {isMobile ? (
          <List
            dataSource={filteredOrders}
            loading={loading}
            pagination={{ pageSize: 10, size: 'small', align: 'center' }}
            renderItem={(order) => (
              <Card 
                size="small" 
                className="mb-3 border border-gray-200 shadow-sm rounded-lg"
                bodyStyle={{ padding: '12px' }}
                onClick={() => handleView(order)}
              >
                <div className="flex justify-between items-start mb-2">
                  <Text strong className="text-blue-600 text-base">{order.orderCode}</Text>
                  {getStatusTag(order.status)}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">Khách:</span> {order.customerName || 'Khách vãng lai'}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  <span className="font-semibold">Ngày:</span> {new Date(order.createdAt).toLocaleString('vi-VN')}
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                  <Text type="success" strong className="text-base">{order.totalAmount.toLocaleString('vi-VN')} đ</Text>
                  <Button type="primary" size="small" icon={<EyeOutlined />}>Chi tiết</Button>
                </div>
              </Card>
            )}
          />
        ) : (
          <Table 
            columns={columns} 
            dataSource={filteredOrders} 
            rowKey="id" 
            loading={loading}
            size="middle"
            pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          />
        )}
      </Card>

      {/* Order Detail & Invoice Modal */}
      <Modal
        title="Chi Tiết Đơn Hàng"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={700}
        footer={null}
      >
        {selectedOrder && (
          <div>
            <div className="flex justify-between mb-4">
              <Space>
                {selectedOrder.status === 'COMPLETED' && (
                  <>
                    {!isPast24h && (
                      <Popconfirm
                        title="Bạn có chắc muốn HUỶ đơn này?"
                        description="Hàng hoá sẽ được hoàn lại kho."
                        onConfirm={() => handleUpdateStatus(2, 'Huỷ đơn')} // 2 = CANCELLED
                      >
                        <Button danger icon={<CloseCircleOutlined />} loading={updating}>
                          Huỷ Đơn
                        </Button>
                      </Popconfirm>
                    )}
                    <Button 
                      danger 
                      type="dashed" 
                      icon={<RollbackOutlined />} 
                      onClick={() => {
                        setRefundReason('');
                        setRefundReasonVisible(true);
                      }}
                    >
                      Hoàn Tiền
                    </Button>
                  </>
                )}
              </Space>
              <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
                In Hoá Đơn
              </Button>
            </div>

            {/* Printable Invoice Area */}
            <div id="printable-invoice" className="p-6 bg-white border border-gray-200 rounded text-black">
              <div className="text-center mb-6">
                <Title level={3} className="m-0">{settings.find(s => s.key === 'StoreName')?.value || 'ESPV STORE'}</Title>
                <Text>{settings.find(s => s.key === 'StoreAddress')?.value || '123 Đường Bán Hàng'}</Text><br/>
                <Text>ĐT: {settings.find(s => s.key === 'StorePhone')?.value || '0123.456.789'}</Text>
              </div>

              <div className="text-center mb-6 border-b border-gray-300 pb-4">
                <Title level={4}>HÓA ĐƠN BÁN LẺ</Title>
                <Text strong>Mã: {selectedOrder.orderCode}</Text><br/>
                <Text type="secondary">{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</Text>
              </div>

              <div className="mb-4">
                <Text strong>Khách hàng: </Text> {selectedOrder.customerName || 'Khách vãng lai'}<br/>
                <Text strong>Thu ngân: </Text> {selectedOrder.userName}<br/>
                <Text strong>Phương thức thanh toán: </Text> {selectedOrder.paymentMethod}<br/>
              </div>

              <table className="w-full text-left border-collapse mb-4">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="py-2">Sản phẩm</th>
                    <th className="py-2 text-center">SL</th>
                    <th className="py-2 text-right">Đơn giá</th>
                    <th className="py-2 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.orderDetails.map(item => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-2">
                        <div className="font-semibold">{item.productName}</div>
                        <div className="text-xs text-gray-500">{item.sku}</div>
                      </td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">{(item.unitPrice || 0).toLocaleString('vi-VN')}</td>
                      <td className="py-2 text-right font-semibold">{(item.totalPrice || 0).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end mt-4">
                <div className="w-64 text-right">
                  <div className="flex justify-between mb-1">
                    <Text>Tổng cộng:</Text>
                    <Text>{selectedOrder.subTotal.toLocaleString('vi-VN')} đ</Text>
                  </div>
                  <div className="flex justify-between mb-1">
                    <Text>Giảm giá:</Text>
                    <Text>{selectedOrder.discountAmount.toLocaleString('vi-VN')} đ</Text>
                  </div>
                  <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-300">
                    <Text strong>Khách phải trả:</Text>
                    <Text strong>{selectedOrder.totalAmount.toLocaleString('vi-VN')} đ</Text>
                  </div>
                </div>
              </div>

              <div className="text-center mt-10">
                <Text italic>Cảm ơn quý khách và hẹn gặp lại!</Text>
              </div>
            </div>
            
          </div>
        )}
      </Modal>

      <Modal
        title="Lý do hoàn tiền"
        open={refundReasonVisible}
        onOk={submitRefund}
        onCancel={() => setRefundReasonVisible(false)}
        confirmLoading={updating}
        okText="Xác nhận hoàn tiền"
        cancelText="Đóng"
      >
        <div className="mb-2 text-gray-600">
          Vui lòng nhập lý do hoàn tiền cho đơn hàng này. Việc hoàn tiền sẽ trả lại số lượng vào kho và lưu lại tên người thao tác.
        </div>
        <Input.TextArea
          rows={4}
          placeholder="Nhập lý do hoàn tiền..."
          value={refundReason}
          onChange={(e) => setRefundReason(e.target.value)}
        />
        <div className="mt-4">
          <Checkbox 
            checked={isDefective} 
            onChange={(e) => setIsDefective(e.target.checked)}
          >
            <Text type="danger" strong>Hàng bị lỗi (Không hoàn lại kho bán)</Text>
          </Checkbox>
        </div>
      </Modal>
    </div>
  );
};

export default OrderPage;
