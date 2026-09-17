import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { getSettings, updateSettings } from '../services/setting';

const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      const formValues: any = {};
      data.forEach(setting => {
        formValues[setting.key] = setting.value;
      });
      form.setFieldsValue(formValues);
    } catch (error) {
      message.error('Lỗi khi tải cấu hình hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const payload = Object.keys(values).map(key => ({
        key,
        value: values[key]
      }));
      await updateSettings(payload);
      message.success('Cập nhật cấu hình thành công!');
    } catch (error) {
      message.error('Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card title="Cài Đặt Hệ Thống" className="shadow-sm">
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish}
          disabled={loading}
        >
          <Form.Item 
            name="StoreName" 
            label="Tên Cửa Hàng" 
            rules={[{ required: true, message: 'Vui lòng nhập tên cửa hàng' }]}
            tooltip="Tên này sẽ hiển thị trên phần mềm và biên lai thanh toán."
          >
            <Input placeholder="Nhập tên cửa hàng..." />
          </Form.Item>

          <Form.Item 
            name="StoreAddress" 
            label="Địa Chỉ Cửa Hàng" 
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <Input.TextArea placeholder="Nhập địa chỉ cụ thể..." rows={3} />
          </Form.Item>

          <Form.Item 
            name="StorePhone" 
            label="Số Điện Thoại Liên Hệ" 
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input placeholder="Ví dụ: 0912.345.678" />
          </Form.Item>

          <Form.Item className="mt-8 mb-0">
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} block>
              Lưu Thay Đổi
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SettingsPage;
