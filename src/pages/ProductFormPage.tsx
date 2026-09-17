import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Switch, Select, Space, message, InputNumber, Row, Col, Typography, Divider } from 'antd';
import { MinusCircleOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import DuplicateBarcodeModal from '../components/DuplicateBarcodeModal';
import { ScanOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

interface Category {
  id: string;
  name: string;
}

const ProductFormPage: React.FC = () => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [activeScanIndex, setActiveScanIndex] = useState<number | null>(null);
  
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [existingProductData, setExistingProductData] = useState<any>(null);
  const [scannedBarcode, setScannedBarcode] = useState('');

  const categoryId = Form.useWatch('categoryId', form);
  const selectedCategory = categories.find(c => c.id === categoryId);
  const isIphone = selectedCategory?.name.toLowerCase().includes('iphone') || false;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res: any = await api.get('/Categories');
        if (res.success) {
          setCategories(res.data.filter((c: any) => c.isActive));
        }
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    };

    const fetchProduct = async () => {
      if (!isEdit) return;
      try {
        setLoading(true);
        const res: any = await api.get(`/Products/${id}`);
        if (res.success) {
          form.setFieldsValue(res.data);
        }
      } catch (error) {
        message.error('Không thể tải thông tin sản phẩm');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchProduct();
  }, [id, isEdit, form, navigate]);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      if (isEdit) {
        const res: any = await api.put(`/Products/${id}`, values);
        if (res.success) {
          message.success('Cập nhật sản phẩm thành công');
          navigate('/products');
        }
      } else {
        const res: any = await api.post('/Products', values);
        if (res.success) {
          message.success('Thêm sản phẩm thành công');
          navigate('/products');
        }
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (barcode: string) => {
    if (activeScanIndex !== null) {
      try {
        const res: any = await api.get(`/Products/check-barcode?barcode=${barcode}`);
        if (res.data) {
          // Barcode already exists
          setScannedBarcode(barcode);
          setExistingProductData(res.data);
          setDuplicateModalOpen(true);
        } else {
          // Barcode is new
          applyBarcodeToForm(barcode);
          message.success('Đã quét mã vạch thành công!');
        }
      } catch (error) {
        // Fallback in case of error
        applyBarcodeToForm(barcode);
      }
    }
  };

  const applyBarcodeToForm = (barcode: string) => {
    if (activeScanIndex !== null) {
      const variants = form.getFieldValue('variants') || [];
      variants[activeScanIndex] = { ...variants[activeScanIndex], barcode };
      form.setFieldsValue({ variants });
      setActiveScanIndex(null);
    }
  };

  return (
    <div>
      <Card 
        title={
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')} />
          {isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ isActive: true, variants: [{}] }}
      >
        <Title level={5}>Thông tin chung</Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
              <Input placeholder="VD: Áo thun ESPV" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}>
              <Select placeholder="Chọn danh mục">
                {categories.map(c => (
                  <Option key={c.id} value={c.id}>{c.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="imageUrl" label="URL Hình ảnh (tùy chọn)">
              <Input placeholder="https://example.com/image.jpg" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Đã ẩn" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="description" label="Mô tả">
              <Input.TextArea rows={4} placeholder="Mô tả chi tiết sản phẩm..." />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Title level={5} className="mb-4">Các phiên bản (SKU)</Title>
        
        <Form.List name="variants">
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
                  
                  {/* Keep ID if updating */}
                  <Form.Item {...restField} name={[name, 'id']} hidden><Input /></Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} sm={12} md={5}>
                      <Form.Item
                        {...restField}
                        name={[name, 'sku']}
                        label="Mã SKU"
                        rules={[{ required: true, message: 'Vui lòng nhập SKU' }]}
                      >
                        <Input placeholder="VD: ESPV-RED-L" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={5}>
                      <Form.Item label="Mã vạch (Barcode)">
                        <Space.Compact style={{ width: '100%' }}>
                          <Form.Item
                            {...restField}
                            name={[name, 'barcode']}
                            noStyle
                          >
                            <Input placeholder="Tùy chọn" />
                          </Form.Item>
                          <Button 
                            icon={<ScanOutlined />} 
                            onClick={() => setActiveScanIndex(name)}
                          />
                        </Space.Compact>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={5}>
                      <Form.Item
                        {...restField}
                        name={[name, 'capacity']}
                        label="Dung lượng"
                      >
                        <Input placeholder="VD: 128GB" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={5}>
                      <Form.Item
                        {...restField}
                        name={[name, 'color']}
                        label="Màu sắc"
                      >
                        <Input placeholder="VD: Xanh Titan" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'condition']}
                        label="Tình trạng"
                      >
                        <Input placeholder="VD: 99%" />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} sm={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'costPrice']}
                        label="Giá nhập"
                        rules={[{ required: true, message: 'Nhập giá' }]}
                      >
                        <InputNumber className="w-full" min={0} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'retailPrice']}
                        label="Giá bán lẻ"
                        rules={[{ required: true, message: 'Nhập giá' }]}
                      >
                        <InputNumber className="w-full" min={0} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                      </Form.Item>
                    </Col>
                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.variants?.[name]?.id !== currentValues.variants?.[name]?.id
                      }
                    >
                      {() => {
                        const hasId = !!form.getFieldValue(['variants', name, 'id']);
                        return (
                          <Col xs={24} sm={8}>
                            <Form.Item
                              {...restField}
                              name={[name, 'stockQuantity']}
                              label="Tồn kho ban đầu"
                              rules={[{ required: true, message: 'Nhập số lượng' }]}
                            >
                              <InputNumber className="w-full" min={0} disabled={hasId} />
                            </Form.Item>
                          </Col>
                        );
                      }}
                    </Form.Item>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.variants?.[name]?.id !== currentValues.variants?.[name]?.id
                      }
                    >
                      {() => {
                        const hasId = !!form.getFieldValue(['variants', name, 'id']);
                        return (isIphone && !hasId) ? (
                          <Col xs={24}>
                            <Form.Item
                              {...restField}
                              name={[name, 'imeis']}
                              label="Nhập danh sách mã IMEI (Quét hoặc Gõ Enter)"
                              rules={[
                                { required: true, message: 'Vui lòng nhập IMEI' },
                                ({ getFieldValue }) => ({
                                  validator(_, value) {
                                    const stock = Number(getFieldValue(['variants', name, 'stockQuantity'])) || 0;
                                    if (!value || value.length !== stock) {
                                      return Promise.reject(new Error(`Vui lòng quét đủ ${stock} mã IMEI tương ứng với số lượng tồn kho.`));
                                    }
                                    return Promise.resolve();
                                  },
                                }),
                              ]}
                            >
                              <Select
                                mode="tags"
                                style={{ width: '100%' }}
                                placeholder="Quét mã IMEI vào đây..."
                                open={false}
                              />
                            </Form.Item>
                          </Col>
                        ) : null;
                      }}
                    </Form.Item>
                  </Row>
                </Card>
              ))}
              
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Thêm phiên bản mới
                </Button>
                <Form.ErrorList errors={errors} />
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item className="mt-6">
          <Space>
            <Button type="primary" htmlType="submit" loading={loading} className="bg-blue-600">
              {isEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
            </Button>
            <Button onClick={() => navigate('/products')}>
              Hủy
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>

      <BarcodeScannerModal 
        open={activeScanIndex !== null && !duplicateModalOpen}
        onCancel={() => setActiveScanIndex(null)}
        onScan={handleScan}
      />

      <DuplicateBarcodeModal
        open={duplicateModalOpen}
        barcode={scannedBarcode}
        existingProduct={existingProductData}
        onCancel={() => {
          setDuplicateModalOpen(false);
          setActiveScanIndex(null);
        }}
        onSuccess={() => {
          setDuplicateModalOpen(false);
          setActiveScanIndex(null);
        }}
        onIgnore={() => {
          setDuplicateModalOpen(false);
          applyBarcodeToForm(scannedBarcode);
        }}
      />
    </div>
  );
};

export default ProductFormPage;
