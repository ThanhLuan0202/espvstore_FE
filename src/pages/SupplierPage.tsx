import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Switch, message, Popconfirm, Card, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import api from '../services/api';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  isActive: boolean;
}

const SupplierPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/Suppliers');
      if (res.success) {
        setSuppliers(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsModalVisible(true);
  };

  const handleEdit = (record: Supplier) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res: any = await api.delete(`/Suppliers/${id}`);
      if (res.success) {
        message.success('Xóa nhà cung cấp thành công');
        fetchSuppliers();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        const res: any = await api.put(`/Suppliers/${editingId}`, values);
        if (res.success) message.success('Cập nhật thành công');
      } else {
        const res: any = await api.post('/Suppliers', values);
        if (res.success) message.success('Thêm mới thành công');
      }
      setIsModalVisible(false);
      fetchSuppliers();
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Tên nhà cung cấp',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong className="text-blue-600">{text}</strong>,
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      render: (_: any, record: Supplier) => (
        <div className="flex flex-col gap-1 text-sm text-gray-600">
          {record.contactPerson && <div><span className="font-medium text-gray-800">{record.contactPerson}</span></div>}
          {record.phone && <div><PhoneOutlined className="mr-2" />{record.phone}</div>}
          {record.email && <div><MailOutlined className="mr-2" />{record.email}</div>}
        </div>
      )
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      width: '30%',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Đang giao dịch' : 'Ngừng giao dịch'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: Supplier) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Bạn có chắc chắn muốn xóa nhà cung cấp này?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Quản lý Nhà cung cấp" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Thêm mới</Button>}>
      <Table 
        columns={columns} 
        dataSource={suppliers} 
        rowKey="id" 
        loading={loading}
        size="middle"
      />

      <Modal
        title={editingId ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="name" label="Tên nhà cung cấp" className="col-span-2" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
              <Input placeholder="Tên công ty/Tổ chức" />
            </Form.Item>
            <Form.Item name="contactPerson" label="Người liên hệ">
              <Input placeholder="Tên người đại diện" />
            </Form.Item>
            <Form.Item name="phone" label="Số điện thoại">
              <Input placeholder="SĐT liên hệ" />
            </Form.Item>
            <Form.Item name="email" label="Email" className="col-span-2">
              <Input type="email" placeholder="Email liên hệ" />
            </Form.Item>
            <Form.Item name="address" label="Địa chỉ" className="col-span-2">
              <Input.TextArea rows={2} placeholder="Địa chỉ chi tiết" />
            </Form.Item>
            <Form.Item name="note" label="Ghi chú" className="col-span-2">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="isActive" label="Trạng thái giao dịch" valuePropName="checked" className="col-span-2">
              <Switch checkedChildren="Đang giao dịch" unCheckedChildren="Ngừng giao dịch" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </Card>
  );
};

export default SupplierPage;
