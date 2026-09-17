import React, { useState } from 'react';
import { Table, Button, Input, Space, Tag, message, Typography, Popconfirm, Card, Statistic, Row, Col, Modal, Form } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformAdminService } from '../services/platformAdmin';
import type { AdminUser, PlatformShop } from '../services/platformAdmin';
import { SearchOutlined, LockOutlined, UnlockOutlined, CheckCircleOutlined, StopOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';

const { Title } = Typography;

const TenantManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [expandedRowKeys, setExpandedRowKeys] = useState<readonly React.Key[]>([]);

  // Admin Edit Modal
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [adminForm] = Form.useForm();

  // Shop Edit Modal
  const [shopModalVisible, setShopModalVisible] = useState(false);
  const [editingShop, setEditingShop] = useState<PlatformShop | null>(null);
  const [shopForm] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['platform-admins', page, pageSize, search],
    queryFn: () => platformAdminService.getAdmins(page, pageSize, search),
  });

  const toggleAdminMutation = useMutation({
    mutationFn: platformAdminService.toggleAdminStatus,
    onSuccess: () => {
      message.success('Cập nhật trạng thái Admin thành công');
      queryClient.invalidateQueries({ queryKey: ['platform-admins'] });
    },
    onError: () => message.error('Lỗi cập nhật trạng thái Admin')
  });

  const updateAdminMutation = useMutation({
    mutationFn: (data: { id: string, payload: any }) => platformAdminService.updateAdmin(data.id, data.payload),
    onSuccess: () => {
      message.success('Cập nhật thông tin Admin thành công');
      setAdminModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['platform-admins'] });
    }
  });

  const createAdminMutation = useMutation({
    mutationFn: platformAdminService.createAdmin,
    onSuccess: () => {
      message.success('Tạo Chủ Shop thành công');
      setAdminModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['platform-admins'] });
    }
  });

  const adminColumns = [
    {
      title: 'Họ tên Chủ cửa hàng',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text: string, record: AdminUser) => (
        <Space>
          <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-sm">
            <UserOutlined />
          </div>
          <div>
            <div className="font-semibold text-slate-700">{text}</div>
            <div className="text-xs text-slate-500">{record.username}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Số Cửa Hàng',
      dataIndex: 'shopCount',
      key: 'shopCount',
      render: (count: number) => <Tag color="blue" className="rounded-full px-2">{count} Shop(s)</Tag>
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag 
          color={isActive ? 'success' : 'error'}
          className={`px-3 py-1 rounded-full font-medium border-0 ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}
        >
          {isActive ? 'Hoạt động' : 'Đã khóa'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: AdminUser) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => {
              setIsCreatingAdmin(false);
              setEditingAdmin(record);
              adminForm.setFieldsValue({ fullName: record.fullName, email: record.email, password: '' });
              setAdminModalVisible(true);
            }}
          />
          <Popconfirm
            title={`Bạn có chắc muốn ${record.isActive ? 'khóa' : 'mở khóa'} Admin này?`}
            onConfirm={() => toggleAdminMutation.mutate(record.id)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button 
              type={record.isActive ? 'default' : 'primary'} 
              danger={record.isActive}
              icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
              size="small"
            >
              {record.isActive ? 'Khóa' : 'Mở Khóa'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const ExpandedShopTable = ({ adminId }: { adminId: string }) => {
    const { data: shops, isLoading: shopsLoading } = useQuery({
      queryKey: ['platform-shops', adminId],
      queryFn: () => platformAdminService.getShopsByAdminId(adminId),
    });

    const toggleShopMutation = useMutation({
      mutationFn: platformAdminService.toggleShopStatus,
      onSuccess: () => {
        message.success('Cập nhật trạng thái Shop thành công');
        queryClient.invalidateQueries({ queryKey: ['platform-shops', adminId] });
      }
    });

    const shopColumns = [
      {
        title: 'Tên Cửa Hàng',
        dataIndex: 'name',
        key: 'name',
        render: (text: string) => <span className="font-semibold">{text}</span>
      },
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
      },
      {
        title: 'SĐT',
        dataIndex: 'phone',
        key: 'phone',
        render: (text: string) => text || '-'
      },
      {
        title: 'Domain',
        dataIndex: 'domain',
        key: 'domain',
        render: (text: string) => text || '-'
      },
      {
        title: 'Trạng Thái',
        dataIndex: 'isActive',
        key: 'isActive',
        render: (isActive: boolean) => (
          <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Hoạt động' : 'Đã khóa'}</Tag>
        )
      },
      {
        title: 'Thao tác',
        key: 'action',
        render: (_: any, record: PlatformShop) => (
          <Space>
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => {
                setEditingShop(record);
                shopForm.setFieldsValue({ name: record.name, email: record.email, phone: record.phone, domain: record.domain });
                setShopModalVisible(true);
              }}
            />
            {record.id !== '00000000-0000-0000-0000-000000000001' && (
              <Popconfirm
                title={`Bạn có chắc muốn ${record.isActive ? 'khóa' : 'mở khóa'} Shop này?`}
                onConfirm={() => toggleShopMutation.mutate(record.id)}
                okText="Đồng ý"
                cancelText="Hủy"
              >
                <Button 
                  type="text" 
                  danger={record.isActive}
                  icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
                />
              </Popconfirm>
            )}
          </Space>
        )
      }
    ];

    return (
      <Table 
        columns={shopColumns} 
        dataSource={shops} 
        rowKey="id" 
        pagination={false} 
        loading={shopsLoading}
        size="small"
        className="bg-slate-50 p-4 rounded-lg shadow-inner my-2 border border-slate-200"
      />
    );
  };

  const updateShopMutation = useMutation({
    mutationFn: (data: { id: string, payload: any }) => platformAdminService.updateShop(data.id, data.payload),
    onSuccess: () => {
      message.success('Cập nhật thông tin Shop thành công');
      setShopModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['platform-shops'] });
    }
  });

  const activeCount = data?.items?.filter(t => t.isActive).length || 0;
  const lockedCount = data?.items?.filter(t => !t.isActive).length || 0;

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <Title level={2} className="!mb-1 !text-slate-800 tracking-tight">Quản lý Cửa Hàng & Admin</Title>
          <p className="text-slate-500 m-0">Quản lý danh sách các tài khoản chủ shop và các cửa hàng của họ</p>
        </div>
        <Input
          placeholder="Tìm kiếm tên, email, tài khoản..."
          prefix={<SearchOutlined className="text-slate-400" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-80 rounded-full hover:shadow-md focus-within:shadow-md transition-shadow py-2 border-slate-300"
          allowClear
          size="large"
        />
        <Button 
          type="primary" 
          size="large" 
          className="rounded-full shadow-md"
          onClick={() => {
            setIsCreatingAdmin(true);
            setEditingAdmin(null);
            adminForm.resetFields();
            setAdminModalVisible(true);
          }}
        >
          + Thêm Chủ Shop
        </Button>
      </div>

      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={8}>
          <Card bordered={false} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-white border border-blue-100">
            <Statistic 
              title={<span className="text-slate-500 font-medium">Tổng số Chủ Shop (Admin)</span>} 
              value={data?.totalCount || 0} 
              valueStyle={{ color: '#2563eb', fontWeight: 'bold', fontSize: '2rem' }}
              prefix={<div className="bg-blue-50 text-blue-600 p-2 rounded-xl mr-3 flex items-center justify-center"><UserOutlined /></div>} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-white border border-emerald-100">
            <Statistic 
              title={<span className="text-slate-500 font-medium">Đang Hoạt Động</span>} 
              value={activeCount} 
              valueStyle={{ color: '#059669', fontWeight: 'bold', fontSize: '2rem' }}
              prefix={<div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl mr-3 flex items-center justify-center"><CheckCircleOutlined /></div>} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-white border border-rose-100">
            <Statistic 
              title={<span className="text-slate-500 font-medium">Đã Khóa</span>} 
              value={lockedCount} 
              valueStyle={{ color: '#e11d48', fontWeight: 'bold', fontSize: '2rem' }}
              prefix={<div className="bg-rose-50 text-rose-600 p-2 rounded-xl mr-3 flex items-center justify-center"><StopOutlined /></div>} 
            />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="rounded-2xl shadow-sm overflow-hidden" bodyStyle={{ padding: 0 }}>
        <Table
          columns={adminColumns}
          dataSource={data?.items || []}
          rowKey="id"
          loading={isLoading}
          className="border-none"
          expandable={{
            expandedRowRender: (record) => <ExpandedShopTable adminId={record.id} />,
            expandedRowKeys: expandedRowKeys,
            onExpandedRowsChange: (keys) => setExpandedRowKeys(keys)
          }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: data?.totalCount || 0,
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} Admin`,
            className: "px-6 pb-4 pt-2 mb-0",
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      {/* Admin Edit Modal */}
      <Modal
        title={isCreatingAdmin ? "Thêm Chủ Shop Mới" : "Chỉnh sửa thông tin Chủ Shop (Admin)"}
        open={adminModalVisible}
        onOk={() => {
          adminForm.validateFields().then(values => {
            if (isCreatingAdmin) {
              createAdminMutation.mutate(values);
            } else if (editingAdmin) {
              updateAdminMutation.mutate({ id: editingAdmin.id, payload: values });
            }
          });
        }}
        onCancel={() => setAdminModalVisible(false)}
        confirmLoading={isCreatingAdmin ? createAdminMutation.isPending : updateAdminMutation.isPending}
        destroyOnClose
      >
        <Form form={adminForm} layout="vertical" className="mt-4">
          {isCreatingAdmin && (
            <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}>
              <Input />
            </Form.Item>
          )}
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="password" label={isCreatingAdmin ? "Mật khẩu" : "Mật khẩu mới (Bỏ trống nếu không đổi)"} rules={[{ required: isCreatingAdmin, message: 'Vui lòng nhập mật khẩu' }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      {/* Shop Edit Modal */}
      <Modal
        title="Chỉnh sửa thông tin Cửa Hàng (Shop)"
        open={shopModalVisible}
        onOk={() => {
          shopForm.validateFields().then(values => {
            if (editingShop) {
              updateShopMutation.mutate({ id: editingShop.id, payload: values });
            }
          });
        }}
        onCancel={() => setShopModalVisible(false)}
        confirmLoading={updateShopMutation.isPending}
        destroyOnClose
      >
        <Form form={shopForm} layout="vertical" className="mt-4">
          <Form.Item name="name" label="Tên Cửa Hàng" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email Liên Hệ">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Số Điện Thoại">
            <Input />
          </Form.Item>
          <Form.Item name="domain" label="Domain">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TenantManagementPage;
