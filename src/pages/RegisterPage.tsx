import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { Lock, Store } from 'lucide-react';
import { UserOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const res: any = await api.post('/Auth/register-shop', values);
      if (res.success) {
        message.success('Đăng ký cửa hàng thành công! Bạn có thể đăng nhập ngay.');
        navigate('/login');
      }
    } catch (error) {
      // Error is handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          ESPVSTORE
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Đăng ký cửa hàng mới
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Form
            name="register"
            layout="vertical"
            onFinish={onFinish}
            size="large"
          >
            <Form.Item
              name="shopName"
              label="Tên cửa hàng"
              rules={[{ required: true, message: 'Vui lòng nhập tên cửa hàng!' }]}
            >
              <Input prefix={<Store className="text-gray-400" size={18} />} placeholder="Tên cửa hàng (ví dụ: Shop ABC)" />
            </Form.Item>

            <Form.Item
              name="fullName"
              label="Họ tên người quản lý"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
            >
              <Input prefix={<UserOutlined className="text-gray-400" size={18} />} placeholder="Họ và tên" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input prefix={<MailOutlined className="text-gray-400" size={18} />} placeholder="Email" />
            </Form.Item>

            <Form.Item
              name="username"
              label="Tên đăng nhập"
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
            >
              <Input prefix={<UserOutlined className="text-gray-400" size={18} />} placeholder="Tên đăng nhập" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
              ]}
            >
              <Input.Password prefix={<Lock className="text-gray-400" size={18} />} placeholder="Mật khẩu" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="w-full bg-blue-600" loading={loading}>
                Đăng ký ngay
              </Button>
            </Form.Item>

            <div className="text-center text-sm">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Đăng nhập
              </Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
