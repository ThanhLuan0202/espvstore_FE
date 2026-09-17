import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Switch, message, Popconfirm, Card, Tag, Select, Grid, List } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';
import { getUsers, createUser, updateUser, deleteUser } from '../services/user';
import type { User } from '../services/user';
import { getRoles } from '../services/role';
import type { Role } from '../services/role';
import { useAuthStore } from '../store/useAuthStore';

const UserPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = screens.xs || (screens.sm && !screens.md);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const currentUser = useAuthStore(state => state.user);
  const isManager = currentUser?.role === 'MANAGER';

  const roleDisplayMap: Record<string, string> = {
    'ADMIN': 'Director',
    'MANAGER': 'Manager',
    'STAFF': 'Sale',
    'CASHIER': 'Cashier',
    'INVENTORY_MANAGER': 'Inventory Manager',
    'SYSTEM_ADMIN': 'System Admin'
  };

  const handleViewDetail = (user: User) => {
    setSelectedUser(user);
    setDetailModalVisible(true);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([getUsers(), getRoles()]);
      setUsers(usersRes);
      setRoles(rolesRes);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Lỗi khi tải dữ liệu nhân viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      message.success('Xoá nhân viên thành công');
      fetchData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Lỗi khi xoá nhân viên');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await updateUser(editingId, values);
        message.success('Cập nhật thông tin thành công');
      } else {
        await createUser(values);
        message.success('Thêm nhân viên thành công');
      }
      setIsModalVisible(false);
      fetchData();
    } catch (error: any) {
      if (error?.response?.data?.message) {
        message.error(error.response.data.message);
      }
    }
  };

  const columns = [
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text: string) => (
        <Space>
          <UserOutlined /> {text}
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <Space>
          <MailOutlined /> {email}
        </Space>
      ),
    },
    {
      title: 'Vai trò (Role)',
      dataIndex: 'roleName',
      key: 'roleName',
      render: (roleName: string) => {
        let color = 'blue';
        if (roleName === 'ADMIN') color = 'red';
        else if (roleName === 'MANAGER') color = 'orange';
        else if (roleName === 'STAFF') color = 'cyan';
        else if (roleName === 'INVENTORY_MANAGER') color = 'purple';
        return <Tag color={color}>{roleDisplayMap[roleName] || roleName}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Đang hoạt động' : 'Đã khóa'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: User) => (
        !isManager && (
          <Space size="middle">
            <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
            {record.username !== 'admin' && ( // Prevent deleting main admin
              <Popconfirm
                title="Bạn có chắc chắn muốn xoá nhân viên này?"
                onConfirm={() => handleDelete(record.id)}
                okText="Xoá"
                cancelText="Huỷ"
              >
                <Button type="primary" danger icon={<DeleteOutlined />} size="small" />
              </Popconfirm>
            )}
          </Space>
        )
      ),
    },
  ];

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <Card
        styles={{ body: { padding: '12px sm:24px' } }}
        title={
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2">
            <span className="text-base sm:text-lg">Quản lý nhân viên</span>
          </div>
        }
        extra={null}
      >
        <div className="flex justify-end mb-4">
          {!isManager && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Thêm nhân viên
            </Button>
          )}
        </div>

        {isMobile ? (
          <List
            dataSource={users}
            loading={loading}
            pagination={{ pageSize: 10, size: 'small', align: 'center' }}
            renderItem={(item) => (
              <Card 
                size="small" 
                className="mb-3 shadow-sm rounded-lg border-gray-200" 
                styles={{ body: { padding: '12px' } }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <UserOutlined className="text-gray-400 text-lg" />
                    <div>
                      <div className="font-semibold text-blue-600 text-base">{item.fullName}</div>
                      <div className="text-xs text-gray-500">{item.username}</div>
                    </div>
                  </div>
                  <Tag color={item.roleName === 'ADMIN' ? 'red' : 'blue'}>{roleDisplayMap[item.roleName] || item.roleName}</Tag>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <Tag color={item.isActive ? 'green' : 'default'} className="m-0">
                    {item.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                  </Tag>
                  <Button type="primary" size="small" onClick={() => handleViewDetail(item)}>Xem chi tiết</Button>
                </div>
              </Card>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={users}
              rowKey="id"
              loading={loading}
            />
          </div>
        )}
      </Card>

      <Modal
        title={editingId ? 'Chỉnh sửa thông tin nhân viên' : 'Thêm nhân viên mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
          >
            <Input disabled={!!editingId} placeholder="Ví dụ: nhanvien1" />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingId ? 'Mật khẩu mới (Bỏ trống nếu không đổi)' : 'Mật khẩu'}
            rules={[{ required: !editingId, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nhập họ và tên" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
          >
            <Input placeholder="Nhập địa chỉ email" />
          </Form.Item>

          <Form.Item
            name="roleId"
            label="Vai trò (Role)"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select placeholder="Chọn vai trò">
              {roles.map(r => (
                <Select.Option key={r.id} value={r.id}>
                  {roleDisplayMap[r.name] || r.name} - {r.description}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="isActive" label="Trạng thái hoạt động" valuePropName="checked">
            <Switch checkedChildren="Đang hoạt động" unCheckedChildren="Bị khóa" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal for Mobile */}
      <Modal
        title="Chi tiết Nhân viên"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <UserOutlined className="text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-lg m-0 text-blue-600">{selectedUser.fullName}</h3>
                <div className="text-gray-500">{selectedUser.username}</div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Vai trò:</span>
                <Tag color={selectedUser.roleName === 'ADMIN' ? 'red' : 'blue'}>{roleDisplayMap[selectedUser.roleName] || selectedUser.roleName}</Tag>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-semibold">{selectedUser.email || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                <Tag color={selectedUser.isActive ? 'green' : 'default'}>{selectedUser.isActive ? 'Đang hoạt động' : 'Bị khóa'}</Tag>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <Button 
                type="primary" 
                className="flex-1" 
                icon={<EditOutlined />} 
                onClick={() => {
                  setDetailModalVisible(false);
                  handleEdit(selectedUser);
                }}
              >
                Sửa
              </Button>
              {selectedUser.username !== 'admin' && (
                <Popconfirm 
                  title="Xóa nhân viên này?" 
                  onConfirm={() => {
                    handleDelete(selectedUser.id);
                    setDetailModalVisible(false);
                  }}
                >
                  <Button danger className="flex-1" icon={<DeleteOutlined />}>Xóa</Button>
                </Popconfirm>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserPage;
