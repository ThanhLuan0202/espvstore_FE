import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, DatePicker, Switch, Tag, message, Card, Select, Grid, List } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getPromotions, createPromotion, togglePromotionStatus } from '../services/promotion';
import type { Promotion, CreatePromotionRequest } from '../services/promotion';

const { Option } = Select;
const { RangePicker } = DatePicker;

const PromotionPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form] = Form.useForm();

  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = screens.xs || (screens.sm && !screens.md);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);

  const handleViewDetail = (promo: Promotion) => {
    setSelectedPromotion(promo);
    setDetailModalVisible(true);
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const data = await getPromotions();
      setPromotions(data);
    } catch (error) {
      message.error('Lỗi tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await togglePromotionStatus(id);
      message.success('Cập nhật trạng thái thành công');
      fetchPromotions();
    } catch (error) {
      message.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const payload: CreatePromotionRequest = {
        code: values.code,
        discountType: values.discountType,
        discountValue: values.discountValue,
        maxDiscountAmount: values.discountType === 0 ? values.maxDiscountAmount : undefined,
        maxUses: values.maxUses || undefined,
      };

      if (values.dates && values.dates.length === 2) {
        payload.startDate = values.dates[0].toISOString();
        payload.endDate = values.dates[1].toISOString();
      }

      await createPromotion(payload);
      message.success('Tạo mã giảm giá thành công');
      setIsModalVisible(false);
      form.resetFields();
      fetchPromotions();
    } catch (error: any) {
      message.error(error?.response?.data || 'Có lỗi xảy ra khi tạo mã');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Mã giảm giá',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <Tag color="blue" className="text-sm font-bold">{text}</Tag>,
    },
    {
      title: 'Giảm giá',
      key: 'discount',
      render: (_: any, record: Promotion) => (
        <div>
          <span className="font-semibold text-green-600">
            {record.discountType === 'PERCENTAGE'
              ? `${record.discountValue}%` 
              : `${record.discountValue.toLocaleString('vi-VN')} đ`}
          </span>
          {record.discountType === 'PERCENTAGE' && record.maxDiscountAmount && (
            <div className="text-xs text-gray-500">
              Tối đa: {record.maxDiscountAmount.toLocaleString('vi-VN')} đ
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Đã dùng',
      key: 'usage',
      render: (_: any, record: Promotion) => (
        <span>
          {record.usedCount} {record.maxUses ? `/ ${record.maxUses}` : ''}
        </span>
      ),
    },
    {
      title: 'Hiệu lực',
      key: 'validity',
      render: (_: any, record: Promotion) => {
        if (!record.startDate && !record.endDate) return <span className="text-gray-500">Không giới hạn</span>;
        const start = record.startDate ? new Date(record.startDate).toLocaleDateString('vi-VN') : '...';
        const end = record.endDate ? new Date(record.endDate).toLocaleDateString('vi-VN') : '...';
        return <span className="text-xs">{start} - {end}</span>;
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: Promotion) => (
        <Switch 
          checked={record.isActive} 
          onChange={() => handleToggleActive(record.id)} 
          checkedChildren="Bật" 
          unCheckedChildren="Tắt"
        />
      ),
    },
  ];

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <Card 
        styles={{ body: { padding: '12px sm:24px' } }}
        title={
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2">
            <span className="text-base sm:text-lg">Quản lý Khuyến Mãi (Voucher)</span>
          </div>
        }
        className="shadow-sm"
        extra={null}
      >
        <div className="flex justify-end mb-4">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
            Tạo Mã Mới
          </Button>
        </div>

        {isMobile ? (
          <List
            dataSource={promotions}
            loading={loading}
            pagination={{ pageSize: 10, size: 'small', align: 'center' }}
            renderItem={(item) => {
              const start = item.startDate ? new Date(item.startDate).toLocaleDateString('vi-VN') : '';
              const end = item.endDate ? new Date(item.endDate).toLocaleDateString('vi-VN') : '';
              const validity = (!start && !end) ? 'Không giới hạn' : `${start} - ${end}`;
              
              return (
                <Card 
                  size="small" 
                  className="mb-3 shadow-sm rounded-lg border-gray-200" 
                  styles={{ body: { padding: '12px' } }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Tag color="blue" className="m-0 text-sm font-bold">{item.code}</Tag>
                    <Switch 
                      checked={item.isActive} 
                      onChange={() => handleToggleActive(item.id)} 
                      checkedChildren="Bật" 
                      unCheckedChildren="Tắt"
                      size="small"
                    />
                  </div>
                  <div className="text-sm mt-2">
                    <span className="text-gray-500">Giảm: </span>
                    <span className="font-semibold text-green-600">
                      {item.discountType === 'PERCENTAGE'
                        ? `${item.discountValue}%` 
                        : `${item.discountValue.toLocaleString('vi-VN')} đ`}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Hạn: </span>
                    <span className="text-xs">{validity}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    <div className="text-sm">
                      Đã dùng: <span className="font-bold">{item.usedCount} {item.maxUses ? `/ ${item.maxUses}` : ''}</span>
                    </div>
                    <Button type="default" size="small" onClick={() => handleViewDetail(item)}>Chi tiết</Button>
                  </div>
                </Card>
              );
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table 
              columns={columns} 
              dataSource={promotions} 
              rowKey="id" 
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </div>
        )}
      </Card>

      <Modal
        title="Tạo Mã Giảm Giá"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ discountType: 0 }}>
          <Form.Item name="code" label="Mã Voucher" rules={[{ required: true }]}>
            <Input placeholder="Vd: SALE20, TET2024" style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          
          <Space className="w-full">
            <Form.Item name="discountType" label="Loại giảm" rules={[{ required: true }]}>
              <Select className="w-32">
                <Option value={0}>Phần trăm (%)</Option>
                <Option value={1}>Trừ tiền mặt</Option>
              </Select>
            </Form.Item>

            <Form.Item name="discountValue" label="Mức giảm" rules={[{ required: true }]}>
              <InputNumber
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value: string | undefined) => Number(value?.replace(/\$\s?|(,*)/g, '')) || 0}
                min={1}
              />
            </Form.Item>
          </Space>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.discountType !== currentValues.discountType}
          >
            {({ getFieldValue }) =>
              getFieldValue('discountType') === 0 ? (
                <Form.Item name="maxDiscountAmount" label="Giảm tối đa (VNĐ) (để trống nếu không giới hạn)">
                  <InputNumber
                    className="w-full"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value: string | undefined) => Number(value?.replace(/\$\s?|(,*)/g, '')) || 0}
                    min={1}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item name="maxUses" label="Số lượt dùng tối đa (để trống nếu không giới hạn)">
            <InputNumber className="w-full" min={1} />
          </Form.Item>

          <Form.Item name="dates" label="Thời gian hiệu lực (để trống nếu không giới hạn)">
            <RangePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Huỷ</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Tạo Mã
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal for Mobile */}
      <Modal
        title="Chi tiết Mã Khuyến Mãi"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        {selectedPromotion && (
          <div className="space-y-4">
            <div className="text-center bg-blue-50 py-4 rounded-lg border border-blue-100 border-dashed">
              <div className="text-xs text-blue-500 uppercase tracking-wider mb-1">Mã Voucher</div>
              <div className="text-2xl font-black text-blue-700 tracking-widest">{selectedPromotion.code}</div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg space-y-3">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-600">Trạng thái:</span>
                <Switch 
                  checked={selectedPromotion.isActive} 
                  onChange={() => handleToggleActive(selectedPromotion.id)} 
                  checkedChildren="Đang bật" 
                  unCheckedChildren="Đã tắt"
                />
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Loại giảm giá:</span>
                <span className="font-semibold">{selectedPromotion.discountType === 'PERCENTAGE' ? 'Theo %' : 'Tiền mặt'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mức giảm:</span>
                <span className="font-bold text-green-600">
                  {selectedPromotion.discountType === 'PERCENTAGE'
                    ? `${selectedPromotion.discountValue}%` 
                    : `${selectedPromotion.discountValue.toLocaleString('vi-VN')} đ`}
                </span>
              </div>
              
              {selectedPromotion.discountType === 'PERCENTAGE' && selectedPromotion.maxDiscountAmount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Giảm tối đa:</span>
                  <span className="font-semibold text-orange-500">{selectedPromotion.maxDiscountAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">Đã sử dụng:</span>
                <span className="font-semibold">
                  <span className="text-blue-600">{selectedPromotion.usedCount}</span>
                  {selectedPromotion.maxUses ? ` / ${selectedPromotion.maxUses} lượt` : ' lượt'}
                </span>
              </div>

              <div className="flex justify-between flex-col gap-1 pt-2 border-t border-gray-200 mt-2">
                <span className="text-gray-600">Thời gian hiệu lực:</span>
                <span className="font-semibold text-sm">
                  {(!selectedPromotion.startDate && !selectedPromotion.endDate) 
                    ? 'Không giới hạn' 
                    : `${selectedPromotion.startDate ? new Date(selectedPromotion.startDate).toLocaleDateString('vi-VN') : '...'} - ${selectedPromotion.endDate ? new Date(selectedPromotion.endDate).toLocaleDateString('vi-VN') : '...'}`}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PromotionPage;
