import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Select, Space, message, InputNumber, Row, Col, Typography, Divider } from 'antd';
import { MinusCircleOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const { Title } = Typography;
const { Option } = Select;

interface Supplier {
  id: string;
  name: string;
}

interface ProductVariant {
  variantId: string;
  productName: string;
  sku: string;
}

const PurchaseFormPage: React.FC = () => {
  const [form] = Form.useForm();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, invRes]: any = await Promise.all([
          api.get('/Suppliers'),
          api.get('/Inventory')
        ]);
        
        if (supRes.success) setSuppliers(supRes.data.filter((s: any) => s.isActive));
        if (invRes.success) setVariants(invRes.data);
      } catch (error) {
        console.error('Failed to load data', error);
      }
    };
    fetchData();
  }, []);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const res: any = await api.post('/PurchaseOrders', values);
      if (res.success) {
        message.success('Tạo phiếu nhập nháp thành công');
        navigate('/purchase');
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase')} />
          Tạo phiếu nhập hàng mới
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ details: [{}] }}
      >
        <Title level={5}>Thông tin chung</Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true, message: 'Vui lòng chọn NCC' }]}>
              <Select placeholder="Chọn nhà cung cấp">
                {suppliers.map(s => (
                  <Option key={s.id} value={s.id}>{s.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="note" label="Ghi chú">
              <Input placeholder="Ghi chú phiếu nhập..." />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Title level={5} className="mb-4">Chi tiết hàng hóa</Title>
        
        <Form.List name="details">
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card size="small" className="mb-4 bg-gray-50 relative" key={key}>
                  {fields.length > 1 && (
                    <Button 
                      type="text" 
                      danger 
                      icon={<MinusCircleOutlined />} 
                      className="absolute top-2 right-2 z-10"
                      onClick={() => remove(name)}
                    />
                  )}
                  
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'productVariantId']}
                        label="Sản phẩm (SKU)"
                        rules={[{ required: true, message: 'Vui lòng chọn SP' }]}
                      >
                        <Select placeholder="Tìm kiếm SKU..." showSearch optionFilterProp="children">
                          {variants.map(v => (
                            <Option key={v.variantId} value={v.variantId}>
                              {v.productName} - {v.sku}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        label="Số lượng nhập"
                        rules={[{ required: true, message: 'Nhập số lượng' }]}
                      >
                        <InputNumber className="w-full" min={1} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'unitCost']}
                        label="Đơn giá nhập"
                        rules={[{ required: true, message: 'Nhập đơn giá' }]}
                      >
                        <InputNumber className="w-full" min={0} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}
              
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Thêm dòng sản phẩm
                </Button>
                <Form.ErrorList errors={errors} />
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item className="mt-6">
          <Space>
            <Button type="primary" htmlType="submit" loading={loading} className="bg-blue-600">
              Tạo phiếu nhập nháp
            </Button>
            <Button onClick={() => navigate('/purchase')}>
              Hủy
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default PurchaseFormPage;
