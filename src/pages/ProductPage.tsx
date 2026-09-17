import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Popconfirm, Card, Tag, Input, Modal, Upload, Grid, List } from 'antd';
import type { UploadProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, WarningOutlined, UploadOutlined, DownloadOutlined, FileExcelOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { exportProducts, getImportTemplate, importProducts } from '../services/product';
import { useDebounce } from '../hooks/useDebounce';
import ProductDetailModal from '../components/ProductDetailModal';
import { useAuthStore } from '../store/useAuthStore';

interface ProductVariant {
  id: string;
  sku?: string;
  capacity?: string;
  color?: string;
  condition?: string;
  costPrice: number;
  retailPrice: number;
}

interface Product {
  id: string;
  name: string;
  categoryName: string;
  imageUrl: string | null;
  isActive: boolean;
  totalStock: number;
  variantCount: number;
  variants: ProductVariant[];
}

const ProductPage: React.FC = () => {
  const { user } = useAuthStore();
  const isStaff = user?.role === 'STAFF';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [searchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [productFilter, setProductFilter] = useState({
    name: '',
    categoryName: '',
    sku: '',
    capacity: '',
    color: '',
    condition: ''
  });

  const filteredProducts = products.filter(p => {
    if (productFilter.name && !p.name.toLowerCase().includes(productFilter.name.toLowerCase())) return false;
    if (productFilter.categoryName && !p.categoryName.toLowerCase().includes(productFilter.categoryName.toLowerCase())) return false;
    
    if (productFilter.sku && !p.variants?.some(v => v.sku?.toLowerCase().includes(productFilter.sku.toLowerCase()))) return false;
    if (productFilter.capacity && !p.variants?.some(v => v.capacity?.toLowerCase().includes(productFilter.capacity.toLowerCase()))) return false;
    if (productFilter.color && !p.variants?.some(v => v.color?.toLowerCase().includes(productFilter.color.toLowerCase()))) return false;
    if (productFilter.condition && !p.variants?.some(v => v.condition?.toLowerCase().includes(productFilter.condition.toLowerCase()))) return false;
    
    return true;
  });

  const [lowStockModalVisible, setLowStockModalVisible] = useState(false);
  const lowStockItems = products.filter(p => p.totalStock <= 5);

  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportProducts();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Products_${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('Lỗi khi xuất file Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await getImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Import_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('Lỗi khi tải file mẫu');
    }
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx');
      if (!isExcel) {
        message.error('Chỉ hỗ trợ file Excel (.xlsx)');
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options;
      try {
        setImporting(true);
        const res = await importProducts(file as File);
        if (res.success) {
          const { importedCount, errors } = res.data || { importedCount: 0, errors: [] };
          
          if (errors && errors.length > 0) {
            Modal.warning({
              title: 'Nhập file hoàn tất (Có lỗi)',
              content: (
                <div>
                  <p className="text-green-600 font-semibold mb-2">Đã nhập thành công: {importedCount} sản phẩm.</p>
                  <p className="text-red-600 mb-1">Các dòng bị lỗi ({errors.length}):</p>
                  <div className="max-h-60 overflow-y-auto bg-gray-50 p-2 border border-gray-200 rounded">
                    <ul className="list-disc pl-4 m-0 text-red-500 text-sm">
                      {errors.map((err: string, idx: number) => <li key={idx}>{err}</li>)}
                    </ul>
                  </div>
                </div>
              ),
              width: 500
            });
          } else {
            message.success(res.message || 'Nhập file thành công');
          }
          
          setImportModalVisible(false);
          fetchProducts(debouncedSearchTerm);
          onSuccess && onSuccess(res);
        } else {
          message.error(res.message || 'Lỗi khi nhập file');
          onError && onError(new Error(res.message));
        }
      } catch (error: any) {
        message.error(error.message || 'Lỗi hệ thống');
        onError && onError(error);
      } finally {
        setImporting(false);
      }
    },
    showUploadList: false,
  };

  const fetchProducts = async (search?: string) => {
    try {
      setLoading(true);
      let url = '/Products';
      if (search) {
        url += `?search=${encodeURIComponent(search)}`;
      }
      const res: any = await api.get(url);
      if (res.success) {
        setProducts(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const handleDelete = async (id: string) => {
    try {
      const res: any = await api.delete(`/Products/${id}`);
      if (res.success) {
        message.success('Xóa thành công');
        fetchProducts(debouncedSearchTerm);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'TÊN SẢN PHẨM',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Product) => (
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
      title: 'DANH MỤC',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },


    {
      title: 'GIÁ BÁN LẺ',
      key: 'retailPrice',
      render: (_: any, record: Product) => {
        if (!record.variants || record.variants.length === 0) return '-';
        const minRetail = Math.min(...record.variants.map(v => v.retailPrice));
        const maxRetail = Math.max(...record.variants.map(v => v.retailPrice));
        if (minRetail === maxRetail) return <span className="font-semibold text-blue-600 text-base">{minRetail.toLocaleString('vi-VN')} đ</span>;
        return <span className="font-semibold text-blue-600 text-base">{minRetail.toLocaleString('vi-VN')} - {maxRetail.toLocaleString('vi-VN')} đ</span>;
      }
    },
    {
      title: 'TỔNG TỒN KHO',
      dataIndex: 'totalStock',
      key: 'totalStock',
      align: 'center',
      render: (stock: number) => {
        let color = 'text-green-600 font-bold';
        if (stock <= 5) color = 'text-red-600 font-bold';
        if (stock === 0) color = 'text-gray-400 font-bold';
        return <span className={`text-base ${color}`}>{stock}</span>;
      }
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      render: (_: any, record: Product) => (
        <Space size="small">
          <Button type="default" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          {!isStaff && (
            <>
              <Button type="primary" ghost size="small" icon={<EditOutlined />} onClick={() => navigate(`/products/edit/${record.id}`)}>Sửa</Button>
              <Popconfirm title="Xóa sản phẩm này?" onConfirm={() => handleDelete(record.id)}>
                <Button type="default" danger size="small" icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = screens.xs || (screens.sm && !screens.md);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleViewDetail = (product: Product) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  return (
    <Card
      styles={{ body: { padding: '12px sm:24px' } }}
      title={
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2 whitespace-normal leading-tight">
          <span className="text-base sm:text-lg">Quản lý Sản phẩm</span>
          {lowStockItems.length > 0 && (
            <Button
              type="primary"
              danger
              icon={<WarningOutlined />}
              onClick={() => setLowStockModalVisible(true)}
              size="small"
              className="animate-pulse w-fit"
            >
              Cảnh báo: {lowStockItems.length} sản phẩm sắp hết hàng!
            </Button>
          )}
        </div>
      }
      extra={null}
    >
      <div className="flex flex-col xl:flex-row gap-3 mb-4 justify-between items-start xl:items-center">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 w-full xl:flex-1 xl:mr-4">
          <Input placeholder="Lọc Tên SP..." onChange={e => setProductFilter(prev => ({ ...prev, name: e.target.value }))} allowClear />
          <Input placeholder="Lọc Danh mục..." onChange={e => setProductFilter(prev => ({ ...prev, categoryName: e.target.value }))} allowClear />
          <Input placeholder="Lọc SKU..." onChange={e => setProductFilter(prev => ({ ...prev, sku: e.target.value }))} allowClear />
          <Input placeholder="Lọc Dung lượng..." onChange={e => setProductFilter(prev => ({ ...prev, capacity: e.target.value }))} allowClear />
          <Input placeholder="Lọc Màu sắc..." onChange={e => setProductFilter(prev => ({ ...prev, color: e.target.value }))} allowClear />
          <Input placeholder="Lọc Tình trạng..." onChange={e => setProductFilter(prev => ({ ...prev, condition: e.target.value }))} allowClear />
        </div>
        <div className="flex flex-wrap gap-2 whitespace-nowrap">
          {!isStaff && (
            <>
              <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>Nhập</Button>
              <Button icon={<DownloadOutlined />} onClick={handleExport} loading={exporting}>Xuất</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/products/new')}>Thêm mới</Button>
            </>
          )}
        </div>
      </div>

      {isMobile ? (
        <List
          dataSource={filteredProducts}
          loading={loading}
          pagination={{ pageSize: 10, size: 'small', align: 'center' }}
          renderItem={(product) => (
            <Card
              size="small"
              className="mb-3 border border-gray-200 shadow-sm rounded-lg"
              styles={{ body: { padding: '12px' } }}
            >
              <div className="flex justify-between items-start mb-2 gap-2">
                <div className="flex items-center gap-3">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="prod" className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded text-xs text-gray-500">No Img</div>
                  )}
                  <div>
                    <div className="font-semibold text-blue-600 line-clamp-2">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.categoryName}</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <div className="text-sm">
                  Tồn kho: <span className={product.totalStock > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-bold'}>{product.totalStock}</span>
                </div>
                <Button type="primary" size="small" onClick={() => handleViewDetail(product)}>Xem chi tiết</Button>
              </div>
            </Card>
          )}
        />
      ) : (
        <div className="overflow-x-auto">
          <Table 
            columns={columns as any} 
            dataSource={filteredProducts}
            rowKey="id"
            loading={loading}
            size="middle"
          />
        </div>
      )}

      {/* Detail Modal */}
      <ProductDetailModal
        productId={selectedProduct?.id || null}
        product={selectedProduct}
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        showActions={true}
        onEdit={(id) => {
          setDetailModalVisible(false);
          navigate(`/products/edit/${id}`);
        }}
        onDelete={(id) => {
          setDetailModalVisible(false);
          handleDelete(id);
        }}
      />

      <Modal
        title="Nhập Sản Phẩm từ Excel"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
      >
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          <Button icon={<FileExcelOutlined />} onClick={handleDownloadTemplate}>
            Tải File Mẫu (Template)
          </Button>
          <div className="text-gray-500 text-sm text-center">
            Vui lòng tải file mẫu, điền đầy đủ thông tin sản phẩm và upload lên hệ thống.
          </div>
          <Upload {...uploadProps}>
            <Button type="primary" icon={<UploadOutlined />} loading={importing} size="large">
              Chọn File Tải Lên
            </Button>
          </Upload>
        </div>
      </Modal>

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
        width={600}
      >
        <Table
          columns={[
            {
              title: 'Tên Sản phẩm',
              dataIndex: 'name',
              key: 'name',
              render: (text) => <span className="font-semibold">{text}</span>,
            },
            {
              title: 'Danh mục',
              dataIndex: 'categoryName',
              key: 'categoryName',
            },
            {
              title: 'Tồn kho',
              dataIndex: 'totalStock',
              key: 'totalStock',
              render: (stock) => <Tag color="red">{stock}</Tag>,
            }
          ]}
          dataSource={lowStockItems}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Modal>
    </Card>
  );
};

export default ProductPage;
