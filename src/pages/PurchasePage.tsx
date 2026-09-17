import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Card, Tag, Popconfirm } from 'antd';
import { PlusOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface PurchaseOrder {
  id: string;
  code: string;
  supplierName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const PurchasePage: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/PurchaseOrders');
      if (res.success) {
        setOrders(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleComplete = async (id: string) => {
    try {
      setLoading(true);
      const res: any = await api.post(`/PurchaseOrders/${id}/complete`, {});
      if (res.success) {
        message.success('Hoàn thành phiếu nhập và cộng tồn kho thành công!');
        fetchOrders();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setLoading(true);
      const res: any = await api.post(`/PurchaseOrders/${id}/cancel`, {});
      if (res.success) {
        message.success('Đã hủy phiếu nhập');
        fetchOrders();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <strong className="text-blue-600">{text}</strong>,
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplierName',
      key: 'supplierName',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => <span className="font-semibold">{amount.toLocaleString('vi-VN')} đ</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (status === 'DRAFT') return <Tag color="blue">Lưu nháp</Tag>;
        if (status === 'COMPLETED') return <Tag color="green">Đã hoàn thành (Đã nhập kho)</Tag>;
        if (status === 'CANCELLED') return <Tag color="red">Đã hủy</Tag>;
        return <Tag>{status}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: PurchaseOrder) => (
        <Space size="middle">
          {record.status === 'DRAFT' && (
            <>
              <Popconfirm title="Xác nhận nhập hàng vào kho? Thao tác này không thể hoàn tác." onConfirm={() => handleComplete(record.id)}>
                <Button type="primary" size="small" icon={<CheckCircleOutlined />} className="bg-green-600">
                  Duyệt & Nhập Kho
                </Button>
              </Popconfirm>
              <Popconfirm title="Bạn có chắc muốn hủy phiếu này?" onConfirm={() => handleCancel(record.id)}>
                <Button type="text" danger size="small" icon={<StopOutlined />}>Hủy</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card title="Quản lý Nhập hàng" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/purchase/new')}>Tạo phiếu nhập</Button>}>
      <Table 
        columns={columns} 
        dataSource={orders} 
        rowKey="id" 
        loading={loading}
        size="middle"
      />
    </Card>
  );
};

export default PurchasePage;
