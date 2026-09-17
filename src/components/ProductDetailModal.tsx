import React, { useEffect, useState } from 'react';
import { Modal, Tag, Button, Spin, message } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export interface ProductVariant {
  id: string;
  costPrice: number;
  retailPrice: number;
  barcode?: string;
  sku?: string;
  capacity?: string;
  color?: string;
  condition?: string;
  stockQuantity?: number;
  imeis?: string[];
}

export interface Product {
  id: string;
  name: string;
  categoryName: string;
  imageUrl: string | null;
  isActive: boolean;
  totalStock: number;
  variantCount: number;
  variants: ProductVariant[];
  description?: string;
}

interface ProductDetailModalProps {
  productId: string | null;
  product?: Product | null; // Optional: If we already have the full product object
  visible: boolean;
  onClose: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  productId,
  product: initialProduct,
  visible,
  onClose,
  onEdit,
  onDelete,
  showActions = false
}) => {
  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ variant: ProductVariant, imei: string } | null>(null);
  
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
    } else if (productId && visible) {
      fetchProductDetail(productId);
    }
  }, [productId, initialProduct, visible]);

  const fetchProductDetail = async (id: string) => {
    try {
      setLoading(true);
      const res: any = await api.get(`/Products/${id}`);
      if (res.success) {
        setProduct(res.data);
      }
    } catch (error) {
      message.error('Lỗi khi tải chi tiết sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      title="Chi tiết sản phẩm"
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={600}
    >
      {loading ? (
        <div className="flex justify-center p-8"><Spin size="large" /></div>
      ) : product ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt="prod" className="w-24 h-24 object-cover rounded shadow-sm border border-gray-200" />
            ) : (
              <div className="w-24 h-24 bg-gray-100 flex items-center justify-center rounded text-xs text-gray-400 border border-gray-200">No Image</div>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-xl m-0 text-gray-800 line-clamp-2">{product.name}</h3>
              <div className="text-gray-500 font-medium">{product.categoryName}</div>
              <Tag color={product.isActive ? 'success' : 'default'} className="mt-2">
                {product.isActive ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
              </Tag>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-3 border border-gray-100">

            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-gray-600">Phiên bản (SKU):</span>
              <span className="font-semibold">{product.variantCount || (product.variants?.length || 0)} SKU</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-gray-600">Tổng tồn kho:</span>
              <span className={`font-bold ${product.totalStock > 0 ? 'text-green-600' : 'text-red-600'}`}>{product.totalStock}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Giá bán lẻ (Dự kiến):</span>
              <span className="font-semibold text-blue-600 text-lg">
                {product.variants && product.variants.length > 0
                  ? Math.min(...product.variants.map(v => v.retailPrice)) === Math.max(...product.variants.map(v => v.retailPrice))
                    ? `${Math.min(...product.variants.map(v => v.retailPrice)).toLocaleString('vi-VN')} đ`
                    : `${Math.min(...product.variants.map(v => v.retailPrice)).toLocaleString('vi-VN')} - ${Math.max(...product.variants.map(v => v.retailPrice)).toLocaleString('vi-VN')} đ`
                  : '-'}
              </span>
            </div>
          </div>

          {product.variants && product.variants.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-700 mb-2">Danh sách Phiên bản (Màu / Dung lượng)</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {product.variants.flatMap((v, i) => {
                  if (v.imeis && v.imeis.length > 0) {
                    return v.imeis.map((imei, idx) => (
                      <div key={`${v.id || i}-${idx}`} className="bg-white p-3 rounded border border-gray-200 flex justify-between items-center text-sm shadow-sm">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 flex items-center gap-2">
                            <span>{v.color || ''} {v.capacity ? `- ${v.capacity}` : ''} {!v.color && !v.capacity ? 'Mặc định' : ''}</span>
                            {v.condition && <Tag color="cyan" className="m-0 text-xs leading-none">{v.condition}</Tag>}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">IMEI: <span className="font-mono bg-gray-100 px-1 rounded">{imei}</span></span>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <div className="text-blue-600 font-bold">{v.retailPrice.toLocaleString('vi-VN')} đ</div>
                            <Button 
                              type="text" 
                              icon={<EyeOutlined />} 
                              size="small"
                              className="text-gray-400 hover:text-blue-500"
                              onClick={() => setSelectedItem({ variant: v, imei })}
                            />
                          </div>
                          <div className="text-xs font-bold px-2 py-0.5 mt-1 rounded-full bg-green-100 text-green-700">
                            Có sẵn
                          </div>
                        </div>
                      </div>
                    ));
                  } else {
                    return (
                      <div key={v.id || i} className="bg-white p-3 rounded border border-gray-200 flex justify-between items-center text-sm shadow-sm opacity-60">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 flex items-center gap-2">
                            <span>{v.color || ''} {v.capacity ? `- ${v.capacity}` : ''} {!v.color && !v.capacity ? 'Mặc định' : ''}</span>
                            {v.condition && <Tag color="cyan" className="m-0 text-xs leading-none">{v.condition}</Tag>}
                          </span>
                          <span className="text-xs text-red-500 mt-1">Hết hàng</span>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <div className="text-gray-500 font-bold">{v.retailPrice.toLocaleString('vi-VN')} đ</div>
                            <Button 
                              type="text" 
                              icon={<EyeOutlined />} 
                              size="small"
                              className="text-gray-400 hover:text-blue-500"
                              onClick={() => setSelectedItem({ variant: v, imei: '' })}
                            />
                          </div>
                          <div className="text-xs font-bold px-2 py-0.5 mt-1 rounded-full bg-red-100 text-red-700">
                            Tồn: 0
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          )}

          {showActions && (onEdit || onDelete) && (
            <div className="flex gap-2 pt-4 border-t border-gray-100">
              {onEdit && (
                <Button
                  type="primary"
                  className="flex-1"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(product.id)}
                >
                  Chỉnh sửa
                </Button>
              )}
              {onDelete && (
                <Button
                  danger
                  className="flex-1"
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(product.id)}
                >
                  Xóa
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 p-8">Không tìm thấy thông tin sản phẩm.</div>
      )}

      {/* Variant Detail Modal */}
      <Modal
        title="Chi tiết sản phẩm"
        open={!!selectedItem}
        onCancel={() => setSelectedItem(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedItem(null)}>
            Đóng
          </Button>
        ]}
        width={400}
        destroyOnClose
      >
        {selectedItem && (
          <div className="space-y-3 pt-2">
            {selectedItem.imei && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Mã IMEI:</span>
                <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200">{selectedItem.imei}</span>
              </div>
            )}
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Màu sắc:</span>
              <span className="font-medium">{selectedItem.variant.color || 'Mặc định'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Dung lượng:</span>
              <span className="font-medium">{selectedItem.variant.capacity || 'Không'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Tình trạng:</span>
              <span className="font-medium">{selectedItem.variant.condition || 'Mới'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Mã SKU:</span>
              <span className="font-medium">{selectedItem.variant.sku || 'Không có'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Mã vạch (Barcode):</span>
              <span className="font-medium">{selectedItem.variant.barcode || 'Không có'}</span>
            </div>
            {isAdmin && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Giá nhập:</span>
                <span className="font-medium text-red-500">{selectedItem.variant.costPrice.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div className="flex justify-between pb-2">
              <span className="text-gray-500">Giá bán lẻ:</span>
              <span className="font-medium text-blue-600">{selectedItem.variant.retailPrice.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        )}
      </Modal>
    </Modal>
  );
};

export default ProductDetailModal;
