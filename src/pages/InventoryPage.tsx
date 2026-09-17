import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Card, Tag, Input, Modal, Form, InputNumber, Drawer, List, Typography, Popconfirm, DatePicker, Grid, Checkbox } from 'antd';
import { PlusOutlined, HistoryOutlined, WarningOutlined, DeleteOutlined, FireOutlined, PrinterOutlined, ExportOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import ProductDetailModal from '../components/ProductDetailModal';
import { useAuthStore } from '../store/useAuthStore';

const { Text } = Typography;

// ... (Rest of the previous interfaces and logic for Overview)

interface InventoryStatus {
  productId: string;
  productName: string;
  categoryName: string;
  imageUrl: string | null;
  variantId: string;
  sku: string;
  barcode: string | null;
  attributes: string | null;
  currentStock: number;
  defectiveQuantity: number;
}

interface InventoryItemDto {
  id: string;
  productVariantId: string;
  productId: string;
  productName: string;
  sku: string;
  capacity: string | null;
  color: string | null;
  imei: string;
  status: string;
  importDate: string;
  soldDate: string | null;
  categoryName: string;
  condition?: string;
  imageUrl?: string;
  stockQuantity: number;
  defectiveQuantity: number;
  barcode?: string;
  retailPrice?: number;
  costPrice?: number;
}

const InventoryPage: React.FC = () => {
  const { user } = useAuthStore();
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = screens.xs || (screens.sm && !screens.md);

  const [overviewDetailVisible, setOverviewDetailVisible] = useState(false);
  const [selectedOverview] = useState<InventoryStatus | null>(null);

  const [gridDetailVisible, setGridDetailVisible] = useState(false);
  const [selectedGrid, setSelectedGrid] = useState<InventoryItemDto | null>(null);

  const [productDetailModalVisible, setProductDetailModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);


  // OVERVIEW STATE
  const [data, setData] = useState<InventoryStatus[]>([]);
  const [, setLoading] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustingVariant, setAdjustingVariant] = useState<InventoryStatus | null>(null);
  const [adjustForm] = Form.useForm();
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [historyVariant, setHistoryVariant] = useState<InventoryStatus | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [lowStockModalVisible, setLowStockModalVisible] = useState(false);
  const lowStockItems = data.filter(item => item.currentStock <= 5);
  const [defectiveModalVisible, setDefectiveModalVisible] = useState(false);
  const defectiveItems = data.filter(item => item.defectiveQuantity > 0);

  // GRID STATE
  const [gridData, setGridData] = useState<InventoryItemDto[]>([]);
  const [gridTotal, setGridTotal] = useState(0);
  const [gridLoading, setGridLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  const [gridFilter, setGridFilter] = useState({
    keyword: '',
    status: 'InStock',
    page: 1,
    pageSize: 20,
    fromDate: '',
    toDate: '',
    productName: '',
    imei: '',
    sku: '',
    capacity: '',
    color: '',
    categoryName: '',
    condition: ''
  });

  const debouncedGridFilter = useDebounce(gridFilter, 500);

  const fetchOverview = async (search?: string) => {
    try {
      setLoading(true);
      let url = '/Inventory';
      if (search) {
        url += `?search=${encodeURIComponent(search)}`;
      }
      const res: any = await api.get(url);
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrid = async (filterObj: any) => {
    try {
      setGridLoading(true);
      let url = `/Inventory/grid?page=${filterObj.page}&pageSize=${filterObj.pageSize}`;
      if (filterObj.keyword) url += `&keyword=${encodeURIComponent(filterObj.keyword)}`;
      if (filterObj.status) url += `&status=${filterObj.status}`;
      if (filterObj.fromDate) url += `&fromDate=${filterObj.fromDate}`;
      if (filterObj.toDate) url += `&toDate=${filterObj.toDate}`;
      if (filterObj.productName) url += `&productName=${encodeURIComponent(filterObj.productName)}`;
      if (filterObj.imei) url += `&imei=${encodeURIComponent(filterObj.imei)}`;
      if (filterObj.sku) url += `&sku=${encodeURIComponent(filterObj.sku)}`;
      if (filterObj.capacity) url += `&capacity=${encodeURIComponent(filterObj.capacity)}`;
      if (filterObj.color) url += `&color=${encodeURIComponent(filterObj.color)}`;
      if (filterObj.categoryName) url += `&categoryName=${encodeURIComponent(filterObj.categoryName)}`;
      if (filterObj.condition) url += `&condition=${encodeURIComponent(filterObj.condition)}`;
      
      const res: any = await api.get(url);
      if (res.success) {
        setGridData(res.data);
        setGridTotal(res.totalCount);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGridLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchGrid(debouncedGridFilter);
  }, [debouncedGridFilter]);

  // --- Adjust Logic ---
  const handleOpenAdjust = (record: InventoryStatus) => {
    setAdjustingVariant(record);
    adjustForm.resetFields();
    setAdjustModalVisible(true);
  };

  const handleAdjustSubmit = async () => {
    try {
      const values = await adjustForm.validateFields();
      setAdjustLoading(true);
      const res: any = await api.post(`/Inventory/${adjustingVariant?.variantId}/adjust`, {
        quantityChange: values.quantityChange,
        note: values.note
      });
      if (res.success) {
        message.success('Điều chỉnh tồn kho thành công!');
        setAdjustModalVisible(false);
        fetchOverview(debouncedSearchTerm);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleDisposeDefective = async (variantId: string, quantity: number) => {
    try {
      const res: any = await api.post(`/Products/variants/${variantId}/dispose`, quantity);
      if (res.success) {
        message.success('Đã tiêu hủy hàng lỗi thành công!');
        fetchOverview(debouncedSearchTerm);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi tiêu hủy hàng lỗi');
    }
  };

  // --- History Logic ---
  const handleOpenHistory = async (record: InventoryStatus) => {
    setHistoryVariant(record);
    setHistoryDrawerVisible(true);
    setHistoryLoading(true);
    try {
      const res: any = await api.get(`/Inventory/${record.variantId}/history`);
      if (res.success) {
        setHistoryData(res.data);
      }
    } catch (error) {
      message.error('Không thể lấy lịch sử!');
    } finally {
      setHistoryLoading(false);
    }
  };



  const columnsGrid = [
    {
      title: (
        <div>
          <div>NGÀY NHẬP</div>
          <div className="mt-2 font-normal">
            <Space direction="vertical" size="small">
              <DatePicker size="small" placeholder="Từ ngày" onChange={(_, ds) => setGridFilter(prev => ({...prev, fromDate: ds as string}))} />
              <DatePicker size="small" placeholder="Đến ngày" onChange={(_, ds) => setGridFilter(prev => ({...prev, toDate: ds as string}))} />
            </Space>
          </div>
        </div>
      ),
      dataIndex: 'importDate',
      key: 'importDate',
      render: (date: string) => <span className="font-semibold">{new Date(date).toLocaleDateString('vi-VN')}</span>
    },
    {
      title: (
        <div>
          <div>TÊN SẢN PHẨM</div>
          <div className="mt-2 font-normal">
            <Input size="small" placeholder="Lọc..." onChange={e => setGridFilter(prev => ({...prev, productName: e.target.value}))} />
          </div>
        </div>
      ),
      dataIndex: 'productName',
      key: 'productName',
      render: (text: string, record: InventoryItemDto) => (
        <div className="flex items-center gap-3">
          {record.imageUrl ? (
            <img src={record.imageUrl} alt="prod" className="w-10 h-10 object-cover rounded" />
          ) : (
            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded text-xs text-gray-400">No Img</div>
          )}
          <span className="font-semibold text-gray-800">{text}</span>
        </div>
      )
    },
    {
      title: (
        <div>
          <div>MÃ SKU</div>
          <div className="mt-2 font-normal">
            <Input size="small" placeholder="Lọc SKU..." onChange={e => setGridFilter(prev => ({...prev, sku: e.target.value}))} />
          </div>
        </div>
      ),
      dataIndex: 'sku',
      key: 'sku',
      render: (text: string) => <span className="text-gray-600 font-semibold">{text || '-'}</span>
    },
    {
      title: (
        <div>
          <div>IMEI</div>
          <div className="mt-2 font-normal">
            <Input size="small" placeholder="Lọc IMEI..." onChange={e => setGridFilter(prev => ({...prev, imei: e.target.value}))} />
          </div>
        </div>
      ),
      dataIndex: 'imei',
      key: 'imei',
      render: (text: string) => <span className="text-gray-600 font-semibold">{text === 'N/A' || !text ? '-' : text}</span>
    },
    {
      title: (
        <div>
          <div>D.LƯỢNG</div>
          <div className="mt-2 font-normal">
            <Input size="small" placeholder="Lọc..." onChange={e => setGridFilter(prev => ({...prev, capacity: e.target.value}))} />
          </div>
        </div>
      ),
      dataIndex: 'capacity',
      key: 'capacity',
      render: (text: string) => <span className="text-gray-600">{text || '-'}</span>
    },
    {
      title: (
        <div>
          <div>MÀU SẮC</div>
          <div className="mt-2 font-normal">
            <Input size="small" placeholder="Lọc..." onChange={e => setGridFilter(prev => ({...prev, color: e.target.value}))} />
          </div>
        </div>
      ),
      dataIndex: 'color',
      key: 'color',
      render: (text: string) => <span className="text-gray-600">{text || '-'}</span>
    },
    {
      title: (
        <div>
          <div>DANH MỤC</div>
          <div className="mt-2 font-normal">
            <Input size="small" placeholder="Lọc..." onChange={e => setGridFilter(prev => ({...prev, categoryName: e.target.value}))} />
          </div>
        </div>
      ),
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: (
        <div>
          <div>TÌNH TRẠNG</div>
          <div className="mt-2 font-normal">
            <Input size="small" placeholder="Lọc..." onChange={e => setGridFilter(prev => ({...prev, condition: e.target.value}))} />
          </div>
        </div>
      ),
      dataIndex: 'condition',
      key: 'condition',
      render: (text: string) => text ? <Tag color="cyan">{text}</Tag> : <span className="text-gray-400">-</span>
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status: string) => {
        if (status === 'Sold') return <Tag color="gray">Đã bán</Tag>;
        if (status === 'Defective') return <Tag color="red">Lỗi</Tag>;
        if (status === 'Lost') return <Tag color="orange">Mất</Tag>;
        return <Tag color="green">Có sẵn</Tag>;
      }
    },
    {
      title: 'NGÀY BÁN',
      dataIndex: 'soldDate',
      key: 'soldDate',
      align: 'center',
      render: (date: string) => date ? <span className="text-gray-500">{new Date(date).toLocaleDateString('vi-VN')}</span> : '-'
    },
    {
      title: 'MÃ VẠCH',
      dataIndex: 'barcode',
      key: 'barcode',
      render: (text: string) => text || '-'
    },
    {
      title: 'GIÁ BÁN',
      dataIndex: 'retailPrice',
      key: 'retailPrice',
      render: (val: number) => val ? val.toLocaleString('vi-VN') + ' đ' : '-'
    },
    // Chặn Role staff/cashier xem Giá Nhập
    ...(user?.role === 'ADMIN' || user?.role === 'MANAGER' ? [{
      title: 'GIÁ NHẬP',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (val: number) => val ? val.toLocaleString('vi-VN') + ' đ' : '-'
    }] : []),
    {
      title: 'THAO TÁC',
      key: 'action',
      render: (_: any, record: InventoryItemDto) => {
        const recordStatus = {
          productId: record.productId,
          productName: record.productName,
          categoryName: record.categoryName,
          imageUrl: record.imageUrl || null,
          variantId: record.productVariantId,
          sku: record.sku,
          barcode: null,
          attributes: null,
          currentStock: record.stockQuantity,
          defectiveQuantity: record.defectiveQuantity
        };
        return (
          <Space size="small">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => {
                setSelectedProductId(record.productId);
                setProductDetailModalVisible(true);
              }}
              className="text-gray-500 hover:text-blue-600"
            />
            <Button 
              type="primary" 
              ghost 
              icon={<PlusOutlined />} 
              onClick={() => handleOpenAdjust(recordStatus)}
              size="small"
            >
              Điều chỉnh
            </Button>
            <Button 
              icon={<HistoryOutlined />} 
              onClick={() => handleOpenHistory(recordStatus)}
              size="small"
            >
              Lịch sử
            </Button>
          </Space>
        );
      }
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    }
  };

  return (
    <Card className="h-full" styles={{ body: { padding: '12px sm:24px' } }}>
      <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4">
        <Space className="flex-wrap">
          {lowStockItems.length > 0 && (
            <Button 
              type="primary" 
              danger 
              icon={<WarningOutlined />}
              onClick={() => setLowStockModalVisible(true)}
              className="animate-pulse"
            >
              {lowStockItems.length} sản phẩm sắp hết
            </Button>
          )}
          {defectiveItems.length > 0 && (
            <Button 
              type="primary" 
              danger 
              icon={<DeleteOutlined />}
              onClick={() => setDefectiveModalVisible(true)}
            >
              Hàng lỗi ({defectiveItems.length})
            </Button>
          )}
        </Space>
      </div>
                {/* Search Bar matching mockup */}
                <div className="flex gap-4 mb-4">
                  <Input.Search
                    placeholder="Tìm theo bất kỳ thông tin nào..."
                    allowClear
                    enterButton="Tìm"
                    onSearch={(val) => setGridFilter({ ...gridFilter, keyword: val, page: 1 })}
                    className="w-full sm:w-[400px]"
                  />
                </div>
                
                {/* Status Pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {['InStock', 'Sold', ''].map(status => {
                    const label = status === 'InStock' ? 'Còn hàng' : (status === 'Sold' ? 'Đã bán' : 'Tất cả');
                    const isActive = gridFilter.status === status;
                    return (
                      <Button 
                        key={status}
                        shape="round" 
                        type={isActive ? 'primary' : 'default'}
                        style={isActive ? { backgroundColor: '#202020', borderColor: '#202020', color: 'white' } : {}}
                        onClick={() => setGridFilter({ ...gridFilter, status, page: 1 })}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>

                {/* Action Bar */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-gray-600 font-medium ml-2">
                    Đã chọn {selectedRowKeys.length} máy
                  </div>
                  <Space className="w-full sm:w-auto flex-wrap">
                    <Button 
                      type="primary" 
                      icon={<ExportOutlined />}
                      style={{ backgroundColor: '#A0633C', borderColor: '#A0633C' }} // Brown color from mockup
                      disabled={selectedRowKeys.length === 0}
                    >
                      Xuất kho
                    </Button>
                    <Button 
                      icon={<PrinterOutlined />} 
                      disabled={selectedRowKeys.length === 0}
                    >
                      In tem đã chọn
                    </Button>
                  </Space>
                </div>

                {isMobile ? (
                  <List
                    dataSource={gridData}
                    loading={gridLoading}
                    pagination={{
                      current: gridFilter.page,
                      pageSize: gridFilter.pageSize,
                      total: gridTotal,
                      onChange: (page, pageSize) => setGridFilter({ ...gridFilter, page, pageSize }),
                      size: 'small',
                      align: 'center'
                    }}
                    renderItem={(item) => {
                      const isSelected = selectedRowKeys.includes(item.id);
                      return (
                        <Card size="small" className={`mb-3 shadow-sm rounded-lg border-l-4 ${isSelected ? 'border-l-blue-500 bg-blue-50' : 'border-l-gray-200'}`} styles={{ body: { padding: '12px' } }}>
                          <div className="flex items-start gap-2 mb-2">
                            <Checkbox 
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedRowKeys([...selectedRowKeys, item.id]);
                                else setSelectedRowKeys(selectedRowKeys.filter(k => k !== item.id));
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 line-clamp-2">{item.productName}</div>
                              <div className="text-xs text-gray-500 mt-1">IMEI: {item.imei}</div>
                              <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                            </div>
                            <Tag color={item.status === 'InStock' ? 'green' : 'red'}>{item.status === 'InStock' ? 'Còn hàng' : 'Đã bán'}</Tag>
                          </div>
                          <div className="flex justify-end mt-2 pt-2 border-t border-gray-100">
                            <Button type="default" size="small" onClick={() => { setSelectedGrid(item); setGridDetailVisible(true); }}>Xem chi tiết</Button>
                          </div>
                        </Card>
                      );
                    }}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table 
                      rowSelection={rowSelection}
                      columns={columnsGrid as any} 
                      dataSource={gridData} 
                      rowKey="id" 
                      loading={gridLoading}
                      size="small"
                      pagination={{
                        current: gridFilter.page,
                        pageSize: gridFilter.pageSize,
                        total: gridTotal,
                        onChange: (page, pageSize) => setGridFilter({ ...gridFilter, page, pageSize }),
                        showSizeChanger: true
                      }}
                      scroll={{ x: 1000 }}
                      className="bg-white"
                    />
                  </div>
                )}

      <ProductDetailModal
        productId={selectedProductId}
        visible={productDetailModalVisible}
        onClose={() => setProductDetailModalVisible(false)}
      />

      {/* Modal Điều Chỉnh */}
      <Modal
        title={`Điều chỉnh tồn kho: ${adjustingVariant?.productName} (${adjustingVariant?.sku})`}
        open={adjustModalVisible}
        onOk={handleAdjustSubmit}
        onCancel={() => setAdjustModalVisible(false)}
        confirmLoading={adjustLoading}
        destroyOnClose
      >
        <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded">
          Tồn kho hiện tại: <strong>{adjustingVariant?.currentStock}</strong>
        </div>
        <Form form={adjustForm} layout="vertical">
          <Form.Item 
            name="quantityChange" 
            label="Số lượng thay đổi (+ để thêm, - để trừ)"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng thay đổi' }]}
          >
            <InputNumber className="w-full" />
          </Form.Item>
          <Form.Item 
            name="note" 
            label="Lý do điều chỉnh"
            rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
          >
            <Input.TextArea placeholder="Ví dụ: Kiểm kê, Hàng hỏng..." rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Drawer Lịch sử */}
      <Drawer
        title={`Lịch sử tồn kho: ${historyVariant?.sku}`}
        placement="right"
        onClose={() => setHistoryDrawerVisible(false)}
        open={historyDrawerVisible}
        width={400}
      >
        <List
          loading={historyLoading}
          itemLayout="horizontal"
          dataSource={historyData}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <div className="flex justify-between">
                    <Tag color={item.quantityChange > 0 ? 'green' : 'red'}>
                      {item.type} ({item.quantityChange > 0 ? '+' : ''}{item.quantityChange})
                    </Tag>
                    <Text type="secondary" className="text-xs">
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </Text>
                  </div>
                }
                description={item.note || 'Không có ghi chú'}
              />
            </List.Item>
          )}
        />
      </Drawer>

      {/* Modal Sản phẩm sắp hết hàng */}
      <Modal
        title={
          <span className="text-red-500 flex items-center">
            <WarningOutlined className="mr-2" /> Sản phẩm sắp hết hàng (Tồn kho ≤ 5)
          </span>
        }
        open={lowStockModalVisible}
        onCancel={() => setLowStockModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setLowStockModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        <Table 
          columns={[
            {
              title: 'Sản phẩm',
              dataIndex: 'productName',
              key: 'productName',
              render: (text, record) => (
                <div>
                  <div className="font-semibold">{text}</div>
                  <div className="text-xs text-gray-500">{record.sku}</div>
                </div>
              ),
            },
            {
              title: 'Thuộc tính',
              dataIndex: 'attributes',
              key: 'attributes',
            },
            {
              title: 'Tồn kho',
              dataIndex: 'currentStock',
              key: 'currentStock',
              render: (stock) => <Tag color="red">{stock}</Tag>,
            }
          ]}
          dataSource={lowStockItems}
          rowKey="variantId"
          pagination={false}
          size="small"
        />
      </Modal>

      {/* Modal Hàng lỗi */}
      <Modal
        title={
          <span className="text-orange-500 flex items-center">
            <WarningOutlined className="mr-2" /> Danh sách hàng lỗi
          </span>
        }
        open={defectiveModalVisible}
        onCancel={() => setDefectiveModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDefectiveModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        <Table 
          columns={[
            {
              title: 'Sản phẩm',
              dataIndex: 'productName',
              key: 'productName',
              render: (text, record) => (
                <div>
                  <div className="font-semibold">{text}</div>
                  <div className="text-xs text-gray-500">{record.sku}</div>
                </div>
              ),
            },
            {
              title: 'Hàng lỗi',
              dataIndex: 'defectiveQuantity',
              key: 'defectiveQuantity',
              render: (stock) => <Tag color="orange">{stock}</Tag>,
            },
            {
              title: 'Thao tác',
              key: 'action',
              render: (_, record) => (
                <Popconfirm
                  title="Bạn có chắc muốn tiêu hủy hàng lỗi này?"
                  description={`Xóa hoàn toàn ${record.defectiveQuantity} sản phẩm bị lỗi? Hành động này không thể hoàn tác.`}
                  onConfirm={() => handleDisposeDefective(record.variantId, record.defectiveQuantity)}
                  okText="Tiêu hủy"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<FireOutlined />} size="small">Tiêu hủy</Button>
                </Popconfirm>
              )
            }
          ]}
          dataSource={defectiveItems}
          rowKey="variantId"
          pagination={false}
          size="small"
        />
      </Modal>

      {/* Modal Chi tiết Tổng quan (Mobile) */}
      <Modal
        title="Chi tiết Tồn kho"
        open={overviewDetailVisible}
        onCancel={() => setOverviewDetailVisible(false)}
        footer={null}
        destroyOnClose
      >
        {selectedOverview && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              {selectedOverview.imageUrl ? (
                <img src={selectedOverview.imageUrl} alt="prod" className="w-20 h-20 object-cover rounded shadow-sm" />
              ) : (
                <div className="w-20 h-20 bg-gray-200 flex items-center justify-center rounded text-xs text-gray-500">No Img</div>
              )}
              <div>
                <h3 className="font-bold text-lg m-0 text-gray-800">{selectedOverview.productName}</h3>
                <div className="text-gray-500">{selectedOverview.categoryName}</div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã SKU:</span>
                <span className="font-semibold">{selectedOverview.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thuộc tính:</span>
                <span className="font-semibold">{selectedOverview.attributes || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tồn kho hiện tại:</span>
                <span className={`font-bold ${selectedOverview.currentStock > 0 ? 'text-green-600' : 'text-red-600'}`}>{selectedOverview.currentStock}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hàng lỗi:</span>
                <span className={`font-bold ${selectedOverview.defectiveQuantity > 0 ? 'text-orange-500' : 'text-gray-400'}`}>{selectedOverview.defectiveQuantity}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <Button 
                type="primary" 
                ghost
                className="flex-1" 
                icon={<PlusOutlined />} 
                onClick={() => {
                  setOverviewDetailVisible(false);
                  handleOpenAdjust(selectedOverview);
                }}
              >
                Điều chỉnh
              </Button>
              <Button 
                className="flex-1" 
                icon={<HistoryOutlined />} 
                onClick={() => {
                  setOverviewDetailVisible(false);
                  handleOpenHistory(selectedOverview);
                }}
              >
                Lịch sử
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Chi tiết Cá thể (Mobile) */}
      <Modal
        title="Chi tiết Cá thể"
        open={gridDetailVisible}
        onCancel={() => setGridDetailVisible(false)}
        footer={null}
      >
        {selectedGrid && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg m-0 text-blue-600">{selectedGrid.productName}</h3>
            
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                <Tag color={selectedGrid.status === 'InStock' ? 'green' : 'red'}>{selectedGrid.status === 'InStock' ? 'Còn hàng' : 'Đã bán'}</Tag>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mã SKU:</span>
                <span className="font-semibold">{selectedGrid.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IMEI/Serial:</span>
                <span className="font-semibold">{selectedGrid.imei}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dung lượng:</span>
                <span className="font-semibold">{selectedGrid.capacity || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Màu sắc:</span>
                <span className="font-semibold">{selectedGrid.color || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày nhập:</span>
                <span className="font-semibold">{new Date(selectedGrid.importDate).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default InventoryPage;
