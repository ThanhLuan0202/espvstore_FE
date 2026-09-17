import React, { useState } from 'react';
import { Modal, InputNumber, Button, Typography, Space, message } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Text, Title } = Typography;

interface DuplicateBarcodeModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  onIgnore: () => void;
  barcode: string;
  existingProduct: {
    productId: string;
    productName: string;
    variantId: string;
    sku: string;
    currentStock: number;
    imageUrl?: string;
  } | null;
}

const DuplicateBarcodeModal: React.FC<DuplicateBarcodeModalProps> = ({ 
  open, 
  onCancel, 
  onSuccess,
  onIgnore,
  barcode,
  existingProduct 
}) => {
  const [quantityToAdd, setQuantityToAdd] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddStock = async () => {
    if (!quantityToAdd || quantityToAdd <= 0) {
      message.error("Vui lòng nhập số lượng hợp lệ!");
      return;
    }

    if (!existingProduct) return;

    setLoading(true);
    try {
      await api.post(`/Inventory/${existingProduct.variantId}/adjust`, {
        quantityChange: quantityToAdd,
        note: `Cộng thêm từ màn hình Thêm Sản Phẩm (Mã vạch: ${barcode})`
      });
      message.success(`Đã cộng thêm ${quantityToAdd} vào tồn kho sản phẩm ${existingProduct.productName}`);
      setQuantityToAdd(null);
      onSuccess();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật tồn kho.");
    } finally {
      setLoading(false);
    }
  };

  const handleIgnore = () => {
    onIgnore();
    setQuantityToAdd(null);
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        onCancel();
        setQuantityToAdd(null);
      }}
      title={
        <Space className="text-orange-500">
          <WarningOutlined />
          <span>Mã vạch đã tồn tại!</span>
        </Space>
      }
      footer={null}
      destroyOnClose
    >
      {existingProduct && (
        <div className="py-4">
          <p className="mb-4">
            Mã vạch <strong>{barcode}</strong> mà bạn vừa quét đã được gán cho sản phẩm dưới đây:
          </p>
          
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            {existingProduct.imageUrl ? (
              <img src={existingProduct.imageUrl} alt={existingProduct.productName} className="w-16 h-16 object-cover rounded-md border" />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                Ảnh
              </div>
            )}
            <div>
              <Title level={5} className="!m-0">{existingProduct.productName}</Title>
              <Text type="secondary" className="block text-sm">SKU: {existingProduct.sku}</Text>
              <Text type="success" className="block text-sm mt-1">Tồn kho hiện tại: {existingProduct.currentStock}</Text>
            </div>
          </div>

          <p className="font-semibold text-gray-700 mb-2">Bạn có muốn cộng thêm số lượng tồn kho vào sản phẩm này không?</p>
          <div className="flex gap-2 items-center mb-6">
            <InputNumber 
              min={1} 
              placeholder="Nhập SL..." 
              value={quantityToAdd}
              onChange={(val) => setQuantityToAdd(val)}
              className="flex-1"
              size="large"
            />
            <Button 
              type="primary" 
              className="bg-orange-500 hover:bg-orange-600 border-none"
              onClick={handleAddStock}
              loading={loading}
              size="large"
            >
              Cộng tồn kho
            </Button>
          </div>

          <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-4">
            <Button onClick={onCancel} disabled={loading}>
              Hủy bỏ (Quét lại)
            </Button>
            <Button type="link" onClick={handleIgnore} disabled={loading}>
              Vẫn dùng cho sản phẩm mới
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DuplicateBarcodeModal;
