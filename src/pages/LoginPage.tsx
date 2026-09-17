import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setGlobalAuth = useAuthStore((state) => state.setGlobalAuth);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const res: any = await api.post('/Auth/login', values);
      if (res.success) {
        if (res.data.requiresTenantSelection) {
          setGlobalAuth(res.data.token, res.data.user, res.data.availableTenants);
          message.info('Vui lòng chọn cửa hàng bạn muốn truy cập.');
          navigate('/select-shop');
          return;
        } else {
          setAuth(res.data.token, res.data.refreshToken, res.data.user);
          message.success('Đăng nhập thành công');
          navigateAfterLogin(res.data.user.role);
        }
      }
    } catch (error) {
      // Error is handled by interceptor, but we can stop loading here
    } finally {
      setLoading(false);
    }
  };

  const navigateAfterLogin = (role: string) => {
    if (role === 'SYSTEM_ADMIN') {
      navigate('/platform-admin/tenants');
    } else if (role === 'STAFF') {
      navigate('/orders');
    } else if (role === 'CASHIER') {
      navigate('/pos');
    } else if (role === 'INVENTORY_MANAGER') {
      navigate('/inventory');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          ESPVSTORE
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Hệ thống quản lý điểm bán hàng
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Form
            name="login"
            layout="vertical"
            onFinish={onFinish}
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
            >
              <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="Tên đăng nhập" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Mật khẩu" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="w-full bg-blue-600" loading={loading}>
                Đăng nhập
              </Button>
            </Form.Item>

          </Form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
