import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Switch, message, Popconfirm, Card, Tag, Grid, List } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined, MailOutlined, DownloadOutlined } from '@ant-design/icons';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/customer';
import type { Customer } from '../services/customer';
import { useDebounce } from '../hooks/useDebounce';

const CustomerPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = screens.xs || (screens.sm && !screens.md);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleViewDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailModalVisible(true);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchCustomers = async (search?: string) => {
    try {
      setLoading(true);
      const res = await getCustomers(search);
      setCustomers(res);
    } catch (error) {
      message.error('Lỗi khi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsModalVisible(true);
  };

  const handleEdit = (record: Customer) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      message.success('Xoá khách hàng thành công');
      fetchCustomers(debouncedSearchTerm);
    } catch (error) {
      message.error('Lỗi khi xoá khách hàng');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await updateCustomer(editingId, values);
        message.success('Cập nhật khách hàng thành công');
      } else {
        await createCustomer(values);
        message.success('Thêm khách hàng thành công');
      }
      setIsModalVisible(false);
      fetchCustomers(debouncedSearchTerm);
    } catch (error) {
      console.log('Validate Failed:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleExportCsv = () => {
    if (customers.length === 0) {
      message.warning('Không có dữ liệu để xuất');
      return;
    }
    const headers = ['Tên', 'Số điện thoại', 'Email', 'Điểm', 'Tổng chi tiêu', 'Trạng thái'];
    const rows = customers.map(c => [
      c.name,
      c.phone || '',
      c.email || '',
      c.point,
      c.totalSpent,
      c.isActive ? 'Hoạt động' : 'Ngưng hoạt động'
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `KhachHang_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: 'Tên khách hàng',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      render: (_: any, record: Customer) => (
        <Space direction="vertical" size="small">
          {record.phone && (
            <span>
              <PhoneOutlined /> {record.phone}
            </span>
          )}
          {record.email && (
            <span>
              <MailOutlined /> {record.email}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: 'Điểm',
      dataIndex: 'point',
      key: 'point',
      render: (point: number) => <Tag color="blue">{point}</Tag>,
    },
    {
      title: 'Tổng chi tiêu',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (val: number) => <span>{val.toLocaleString('vi-VN')} đ</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: Customer) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xoá khách hàng này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xoá"
            cancelText="Huỷ"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <Card
        styles={{ body: { padding: '12px sm:24px' } }}
        title={
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2">
            <span className="text-base sm:text-lg">Quản lý khách hàng</span>
          </div>
        }
        extra={null}
      >
        <div className="flex flex-col md:flex-row gap-3 mb-4 justify-between">
          <Input.Search 
            placeholder="Tìm tên, SĐT, Email..." 
            allowClear 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-[300px]"
          />
          <div className="flex flex-wrap gap-2">
            <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
              Xuất CSV
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Thêm khách hàng
            </Button>
          </div>
        </div>

        {isMobile ? (
          <List
            dataSource={customers}
            loading={loading}
            pagination={{ pageSize: 10, size: 'small', align: 'center' }}
            renderItem={(item) => (
              <Card 
                size="small" 
                className="mb-3 shadow-sm rounded-lg border-gray-200" 
                styles={{ body: { padding: '12px' } }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-blue-600 text-base">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.phone || 'Không có SĐT'}</div>
                  </div>
                  <Tag color={item.isActive ? 'green' : 'red'}>{item.isActive ? 'Hoạt động' : 'Ngừng'}</Tag>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <div className="text-sm">
                    Điểm: <span className="font-bold text-blue-500">{item.point}</span>
                  </div>
                  <Button type="primary" size="small" onClick={() => handleViewDetail(item)}>Xem chi tiết</Button>
                </div>
              </Card>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={customers}
              rowKey="id"
              loading={loading}
              scroll={{ x: 800 }}
            />
          </div>
        )}
      </Card>

      <Modal
        title={editingId ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên khách hàng"
            rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
          >
            <Input placeholder="Nhập tên khách hàng" />
          </Form.Item>

          <Form.Item name="phone" label="Số điện thoại">
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea placeholder="Nhập địa chỉ" rows={2} />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea placeholder="Nhập ghi chú" rows={2} />
          </Form.Item>

            {editingId && (
              <Form.Item
                name="isActive"
                label="Trạng thái"
                valuePropName="checked"
              >
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng hoạt động" />
              </Form.Item>
            )}
          </Form>
        </Modal>

        {/* Detail Modal for Mobile */}
        <Modal
          title="Chi tiết Khách hàng"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
          destroyOnClose
        >
          {selectedCustomer && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg m-0 text-blue-600">{selectedCustomer.name}</h3>
              
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Số điện thoại:</span>
                  <span className="font-semibold">{selectedCustomer.phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold">{selectedCustomer.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Điểm tích lũy:</span>
                  <span className="font-bold text-blue-500">{selectedCustomer.point}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng chi tiêu:</span>
                  <span className="font-bold text-green-600">{selectedCustomer.totalSpent.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <Tag color={selectedCustomer.isActive ? 'green' : 'red'}>{selectedCustomer.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}</Tag>
                </div>
                {selectedCustomer.address && (
                  <div>
                    <div className="text-gray-600">Địa chỉ:</div>
                    <div className="font-medium text-sm mt-1">{selectedCustomer.address}</div>
                  </div>
                )}
                {selectedCustomer.note && (
                  <div>
                    <div className="text-gray-600">Ghi chú:</div>
                    <div className="font-medium text-sm mt-1">{selectedCustomer.note}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <Button 
                  type="primary" 
                  className="flex-1" 
                  icon={<EditOutlined />} 
                  onClick={() => {
                    setDetailModalVisible(false);
                    handleEdit(selectedCustomer);
                  }}
                >
                  Sửa
                </Button>
                <Popconfirm 
                  title="Xóa khách hàng này?" 
                  onConfirm={() => {
                    handleDelete(selectedCustomer.id);
                    setDetailModalVisible(false);
                  }}
                >
                  <Button danger className="flex-1" icon={<DeleteOutlined />}>Xóa</Button>
                </Popconfirm>
              </div>
            </div>
          )}
        </Modal>
      </div>
  );
};

export default CustomerPage;
