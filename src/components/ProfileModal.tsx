import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { user, token, refreshToken, setAuth } = useAuthStore();

  useEffect(() => {
    if (visible && user) {
      form.setFieldsValue({
        fullName: user.fullName || user.username
      });
    } else {
      form.resetFields();
    }
  }, [visible, user, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (values.newPassword && values.newPassword !== values.confirmPassword) {
        message.error('Mật khẩu nhập lại không khớp!');
        return;
      }

      if (values.newPassword && !values.currentPassword) {
        message.error('Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu!');
        return;
      }

      setLoading(true);
      const res: any = await api.put('/Profile', {
        fullName: values.fullName,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });

      if (res.success) {
        // If password was changed, force logout
        if (values.newPassword) {
          message.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
          useAuthStore.getState().logout();
          window.location.href = '/login';
        } else {
          message.success('Cập nhật hồ sơ thành công!');
          // Update user context
          if (res.data && token && refreshToken) {
            setAuth(token, refreshToken, res.data);
          }
        }

        onClose();
      } else {
        message.error(res.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (error.errorFields) {
         // form validation error, do nothing
      } else {
        console.error(error);
        message.error('Đã xảy ra lỗi khi cập nhật hồ sơ');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Cập nhật Hồ sơ"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Lưu thay đổi"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="fullName"
          label="Họ và tên"
          rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên của bạn" />
        </Form.Item>

        <div className="border-t border-gray-200 mt-6 pt-4">
          <p className="text-gray-500 mb-4 text-sm">Điền các trường dưới đây nếu bạn muốn đổi mật khẩu:</p>
          
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu hiện tại" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Nhập lại mật khẩu mới"
            dependencies={['newPassword']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu nhập lại không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu mới" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default ProfileModal;
