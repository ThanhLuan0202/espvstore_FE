import React, { useState, useEffect } from 'react';
import { Card, Input, Button, List, message, Select, Row, Col, Space, Divider, Modal, DatePicker, Statistic } from 'antd';
import { SearchOutlined, ShoppingCartOutlined, PlusOutlined, MinusOutlined, DeleteOutlined, ScanOutlined, BarChartOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';
import { createOrder, getMyRevenue } from '../services/order';
import type { CreateOrderRequest, MyRevenue } from '../services/order';
import { getCustomers } from '../services/customer';
import { getSalesStaff } from '../services/user';
import type { Customer } from '../services/customer';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import ProductDetailModal from '../components/ProductDetailModal';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface ProductVariant {
  id: string;
  sku: string;
  barcode?: string;
  price: number;
  stockQuantity: number;
  productId: string;
  product?: { name: string, imageUrl?: string };
}

interface CartItem {
  variantId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  imeis: string[];
  trackImei: boolean;
}

const POSPage: React.FC = () => {
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductVariant[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<number>(0);
  const [promoCode, setPromoCode] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  
  const [, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const [salesStaff, setSalesStaff] = useState<any[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState<string | undefined>();
  
  const [isRevenueModalVisible, setIsRevenueModalVisible] = useState(false);
  const [revenueData, setRevenueData] = useState<MyRevenue | null>(null);
  const [revenueDates, setRevenueDates] = useState<any>(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const fetchMyRevenue = async (dates?: any) => {
    try {
      const start = dates?.[0]?.startOf('day').toISOString();
      const end = dates?.[1]?.endOf('day').toISOString();
      const res = await getMyRevenue(start, end);
      setRevenueData(res);
    } catch (error) {
      message.error('Lỗi tải doanh thu');
    }
  };

  const openRevenueModal = () => {
    setRevenueDates(null);
    setIsRevenueModalVisible(true);
    fetchMyRevenue(null); // Load today/all time by default
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resProducts: any = await api.get('/Products');
      let allVariants: any[] = [];
      const resCategories: any = await api.get('/Categories');
      const categories = resCategories.success ? resCategories.data : [];
      
      if (resProducts.data) {
        resProducts.data.forEach((p: any) => {
          const cat = categories.find((c:any) => c.id === p.categoryId);
          const isIphone = cat?.name?.toLowerCase().includes('iphone');
          if (p.variants) {
            p.variants.forEach((v: any) => {
              allVariants.push({
                id: v.id,
                sku: v.sku,
                barcode: v.barcode,
                price: v.retailPrice || 0,
                stockQuantity: v.stockQuantity,
                productId: p.id,
                product: { name: p.name, imageUrl: p.imageUrl },
                trackImei: isIphone
              } as any);
            });
          }
        });
      }
      allVariants.sort((a, b) => {
        const aInStock = a.stockQuantity > 0 ? 1 : 0;
        const bInStock = b.stockQuantity > 0 ? 1 : 0;
        return bInStock - aInStock;
      });
      
      setProducts(allVariants);
      setFilteredProducts(allVariants);

      const [resCustomers, resSales] = await Promise.all([
        getCustomers(),
        getSalesStaff()
      ]);
      setCustomers(resCustomers);
      setSalesStaff(resSales);
    } catch (error) {
      message.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    const lower = value.toLowerCase();
    const filtered = products.filter(p => 
      p.product?.name.toLowerCase().includes(lower) || 
      p.sku.toLowerCase().includes(lower) ||
      (p.barcode && p.barcode.toLowerCase().includes(lower))
    );
    setFilteredProducts(filtered);
  };

  const handleScan = (scannedBarcode: string) => {
    const variant = products.find(p => p.barcode === scannedBarcode || p.sku === scannedBarcode);
    if (variant) {
      addToCart(variant);
      message.success(`Đã thêm ${variant.product?.name || variant.sku} vào giỏ!`);
    } else {
      message.error('Không tìm thấy sản phẩm có mã vạch này!');
    }
  };

  // --- IMEI Selection Logic ---
  const [imeiModalVisible, setImeiModalVisible] = useState(false);
  const [currentVariantForImei, setCurrentVariantForImei] = useState<any>(null);
  const [availableImeis, setAvailableImeis] = useState<any[]>([]);
  const [selectedImeis, setSelectedImeis] = useState<string[]>([]);
  const [imeiLoading, setImeiLoading] = useState(false);

  const openImeiSelection = async (variant: any) => {
    setCurrentVariantForImei(variant);
    setSelectedImeis([]);
    setImeiModalVisible(true);
    setImeiLoading(true);
    try {
      // Get InStock items for this variant
      const res: any = await api.get(`/Inventory/grid?keyword=${variant.sku}&status=InStock&pageSize=100`);
      if (res.success) {
        setAvailableImeis(res.data.filter((d:any) => d.productVariantId === variant.id));
      }
    } catch (error) {
      message.error('Lỗi lấy danh sách IMEI');
    } finally {
      setImeiLoading(false);
    }
  };

  const handleConfirmImei = () => {
    if (selectedImeis.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 IMEI');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.variantId === currentVariantForImei.id);
      if (existing) {
        // Find how many new IMEIs were not already in the cart
        const currentImeis = existing.imeis || [];
        const newImeis = selectedImeis.filter(i => !currentImeis.includes(i));
        const finalImeis = [...currentImeis, ...newImeis];
        
        if (finalImeis.length > currentVariantForImei.stockQuantity) {
          message.warning('Vượt quá số lượng tồn kho!');
          return prev;
        }
        
        return prev.map(item => 
          item.variantId === currentVariantForImei.id ? { 
            ...item, 
            quantity: finalImeis.length,
            imeis: finalImeis
          } : item
        );
      }
      return [...prev, {
        variantId: currentVariantForImei.id,
        name: currentVariantForImei.product?.name || 'Unknown',
        sku: currentVariantForImei.sku,
        price: currentVariantForImei.price,
        quantity: selectedImeis.length,
        imeis: selectedImeis,
        trackImei: true
      }];
    });
    
    setImeiModalVisible(false);
    message.success(`Đã thêm ${selectedImeis.length} sản phẩm vào giỏ!`);
  };

  const addToCart = (variant: any) => {
    if (variant.stockQuantity <= 0) {
      message.warning('Sản phẩm đã hết hàng!');
      return;
    }

    if (variant.trackImei) {
      openImeiSelection(variant);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.variantId === variant.id);
      if (existing) {
        if (existing.quantity >= variant.stockQuantity) {
          message.warning('Vượt quá số lượng tồn kho!');
          return prev;
        }
        return prev.map(item => 
          item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        variantId: variant.id,
        name: variant.product?.name || 'Unknown',
        sku: variant.sku,
        price: variant.price,
        quantity: 1,
        imeis: [],
        trackImei: false
      }];
    });
  };

  const updateQuantity = (variantId: string, delta: number) => {
    const item = cart.find(i => i.variantId === variantId);
    if (item?.trackImei && delta > 0) {
      // Must open modal to select more IMEIs
      const variant = products.find(p => p.id === variantId);
      if (variant) openImeiSelection(variant);
      return;
    }

    setCart(prev => {
      return prev.map(item => {
        if (item.variantId === variantId) {
          const newQ = item.quantity + delta;
          if (newQ <= 0) return item; 
          const variant = products.find(p => p.id === variantId);
          if (variant && newQ > variant.stockQuantity) {
            message.warning('Vượt quá số lượng tồn kho!');
            return item;
          }
          // If reducing quantity of tracked IMEI, remove the last IMEI
          let newImeis = item.imeis;
          if (item.trackImei && delta < 0) {
             newImeis = newImeis.slice(0, newImeis.length - 1);
          }
          return { ...item, quantity: newQ, imeis: newImeis };
        }
        return item;
      });
    });
  };

  const removeFromCart = (variantId: string) => {
    setCart(prev => prev.filter(item => item.variantId !== variantId));
  };

  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 0 || appliedPromo.discountType === 'PERCENTAGE') {
      discountAmount = subTotal * (appliedPromo.discountValue / 100);
      if (appliedPromo.maxDiscountAmount && discountAmount > appliedPromo.maxDiscountAmount) {
        discountAmount = appliedPromo.maxDiscountAmount;
      }
    } else {
      discountAmount = appliedPromo.discountValue;
    }
  }
  const total = Math.max(0, subTotal - discountAmount);

  const applyPromo = async () => {
    if (!promoCode.trim()) {
      setAppliedPromo(null);
      return;
    }
    try {
      const res: any = await api.get(`/Promotions/check?code=${promoCode.trim()}`);
      setAppliedPromo(res.data || res);
      message.success('Đã áp dụng mã giảm giá!');
    } catch (error: any) {
      setAppliedPromo(null);
      message.error(error.response?.data || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
    }
  };

  const processCheckout = async () => {
    setSubmitting(true);
    try {
      const payload: CreateOrderRequest = {
        customerId: selectedCustomerId,
        saleId: selectedSaleId,
        paymentMethod: paymentMethod,
        discountAmount: discountAmount,
        promotionCode: appliedPromo?.code,
        note: 'Bán tại POS',
        orderDetails: (cart || []).map(c => ({
          productVariantId: c.variantId,
          quantity: c.quantity,
          unitPrice: c.price,
          imeis: c.imeis
        }))
      };

      await createOrder(payload);
      message.success('Thanh toán thành công!');
      
      // Reset
      setCart([]);
      setSelectedCustomerId(undefined);
      setSelectedSaleId(undefined);
      setPaymentMethod(0);
      setPromoCode('');
      setAppliedPromo(null);
      fetchData(); // reload stock
    } catch (error: any) {
      message.error(error?.response?.data || 'Lỗi thanh toán');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      message.warning('Giỏ hàng trống!');
      return;
    }

    if (paymentMethod === 0) {
      Modal.confirm({
        title: 'Xác nhận thanh toán',
        content: `Khách hàng thanh toán bằng tiền mặt với số tiền ${total.toLocaleString('vi-VN')} đ. Đã nhận đủ tiền chưa?`,
        okText: 'Đã nhận (Xác nhận)',
        cancelText: 'Chưa (Từ chối)',
        onOk: processCheckout,
      });
    } else {
      processCheckout();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-gray-100 -m-2 p-2 sm:-m-4 sm:p-4 md:-m-6 md:p-6 lg:h-[calc(100vh-64px)] overflow-y-auto lg:overflow-hidden">
      {/* Left Column: Products */}
      <div className="flex-1 bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 lg:mb-0 lg:mr-6 flex flex-col min-h-[500px] lg:min-h-0">
        <div className="mb-4 flex flex-wrap gap-2">
          <Input 
            size="large" 
            placeholder="Tìm kiếm SP..." 
            prefix={<SearchOutlined />} 
            onChange={e => handleSearch(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <Button 
            size="large" 
            type="primary" 
            icon={<ScanOutlined />} 
            onClick={() => setScannerOpen(true)}
          >
            Quét Mã
          </Button>
          <Button 
            size="large" 
            icon={<BarChartOutlined />} 
            onClick={openRevenueModal}
          >
            Doanh thu
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <Row gutter={[12, 12]}>
            {(filteredProducts || []).map(item => (
              <Col xs={12} sm={8} md={8} lg={6} xl={6} key={item.id}>
                <Card 
                  hoverable 
                  className={`h-full border ${item.stockQuantity <= 0 ? 'opacity-50' : 'border-gray-200'}`}
                  styles={{ body: { padding: 12 } }}
                  onClick={() => addToCart(item)}
                >
                  <div className="flex flex-col items-center text-center relative group">
                    <Button 
                      type="text" 
                      icon={<EyeOutlined />} 
                      className="absolute top-0 right-0 z-10 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-full"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProductId(item.productId);
                        setDetailModalVisible(true);
                      }}
                    />
                    <div className="h-20 w-20 sm:h-24 sm:w-24 bg-gray-100 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                      {item.product?.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product.name} className="object-cover h-full w-full" />
                      ) : (
                        <ShoppingCartOutlined className="text-gray-400 text-2xl sm:text-3xl" />
                      )}
                    </div>
                    <div className="font-semibold text-xs sm:text-sm line-clamp-2 min-h-[32px] sm:min-h-[40px]">{item.product?.name}</div>
                    <div className="text-[10px] sm:text-xs text-gray-500 my-1">{item.sku}</div>
                    <div className="text-blue-600 font-bold text-sm">{(item.price || 0).toLocaleString('vi-VN')} đ</div>
                    <div className="text-[10px] sm:text-xs text-gray-400 mt-1">Tồn: {item.stockQuantity}</div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Right Column: Cart & Checkout */}
      <div className="w-full lg:w-[350px] xl:w-[400px] bg-white rounded-lg shadow-sm flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100 bg-blue-50 rounded-t-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-blue-800 m-0">Giỏ hàng</h2>
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">{cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm</span>
          </div>
          <Select
            showSearch
            allowClear
            placeholder="Chọn khách hàng"
            className="w-full mb-2"
            value={selectedCustomerId}
            onChange={setSelectedCustomerId}
            optionFilterProp="children"
          >
            {(customers || []).map(c => (
              <Option key={c.id} value={c.id}>{c.name} - {c.phone}</Option>
            ))}
          </Select>
          <Select
            showSearch
            allowClear
            placeholder="Nhân viên Sale (tùy chọn)"
            className="w-full"
            value={selectedSaleId}
            onChange={setSelectedSaleId}
            optionFilterProp="children"
          >
            {(salesStaff || []).map(s => (
              <Option key={s.id} value={s.id}>{s.fullName || s.username}</Option>
            ))}
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCartOutlined style={{ fontSize: 48 }} className="mb-4" />
              <p>Chưa có sản phẩm nào</p>
            </div>
          ) : (
            <List
              dataSource={cart}
              renderItem={item => (
                <div className="bg-white p-3 rounded-lg shadow-sm mb-3 border border-gray-100 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold">{item.name}</div>
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeFromCart(item.variantId)} size="small" />
                  </div>
                  <div className="flex justify-between items-center text-gray-500 text-sm mb-2">
                    <span>{item.sku}</span>
                    <span className="text-blue-600 font-semibold">{(item.price || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between items-center mt-auto">
                    <Space>
                      <Button icon={<MinusOutlined />} size="small" onClick={() => updateQuantity(item.variantId, -1)} disabled={item.quantity <= 1} />
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button icon={<PlusOutlined />} size="small" onClick={() => updateQuantity(item.variantId, 1)} />
                    </Space>
                    <span className="font-bold text-gray-800">
                      {((item.price || 0) * item.quantity).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              )}
            />
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between mb-2 text-gray-600">
            <span>Tạm tính:</span>
            <span>{subTotal.toLocaleString('vi-VN')} đ</span>
          </div>
          
          <div className="flex justify-between mb-3 items-center text-gray-600 gap-2">
            <Input 
              placeholder="Nhập mã KM" 
              value={promoCode} 
              onChange={e => setPromoCode(e.target.value)} 
              onPressEnter={applyPromo}
              disabled={!!appliedPromo}
            />
            {appliedPromo ? (
              <Button danger onClick={() => { setAppliedPromo(null); setPromoCode(''); }}>Hủy mã</Button>
            ) : (
              <Button onClick={applyPromo}>Áp dụng</Button>
            )}
          </div>
          
          <div className="flex justify-between mb-3 items-center text-gray-600">
            <span>Giảm giá:</span>
            <span className="font-semibold text-red-500">
              {discountAmount > 0 ? `-${discountAmount.toLocaleString('vi-VN')} đ` : '0 đ'}
            </span>
          </div>

          <div className="mb-4">
            <span className="text-gray-600 block mb-1">Phương thức thanh toán:</span>
            <Select value={paymentMethod} onChange={setPaymentMethod} className="w-full">
              <Option value={0}>Tiền mặt (Cash)</Option>
              <Option value={1}>Chuyển khoản (Transfer)</Option>
              <Option value={2}>Thẻ (Card)</Option>
            </Select>
          </div>

          <Divider className="my-3" />

          <div className="flex justify-between font-bold text-xl mb-4 text-gray-800">
            <span>Khách phải trả:</span>
            <span className="text-blue-600">{total.toLocaleString('vi-VN')} đ</span>
          </div>
          
          <Button 
            type="primary" 
            size="large" 
            className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700"
            onClick={handleCheckout}
            loading={submitting}
            disabled={cart.length === 0}
          >
            THANH TOÁN
          </Button>
        </div>
      </div>

      <BarcodeScannerModal 
        open={scannerOpen}
        onCancel={() => setScannerOpen(false)}
        onScan={handleScan}
      />

      <Modal
        title={`Chọn mã IMEI cho ${currentVariantForImei?.product?.name}`}
        open={imeiModalVisible}
        onCancel={() => setImeiModalVisible(false)}
        onOk={handleConfirmImei}
        okText="Xác nhận thêm vào giỏ"
      >
        <div className="mb-4 text-gray-500">
          Sản phẩm này bắt buộc phải chọn chính xác cá thể (IMEI/Serial) để xuất bán.
        </div>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Quét hoặc chọn mã IMEI..."
          value={selectedImeis}
          onChange={setSelectedImeis}
          options={availableImeis.map(a => ({ label: a.imei, value: a.imei }))}
          loading={imeiLoading}
          showSearch
          optionFilterProp="label"
        />
        {selectedImeis.length > 0 && (
          <div className="mt-4 font-semibold text-blue-600">
            Đã chọn: {selectedImeis.length} cá thể
          </div>
        )}
      </Modal>

      <Modal
        title="Doanh Thu Của Tôi"
        open={isRevenueModalVisible}
        onCancel={() => setIsRevenueModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsRevenueModalVisible(false)}>Đóng</Button>
        ]}
      >
        <div className="mb-6">
          <label className="block text-gray-700 mb-2 font-medium">Lọc theo thời gian:</label>
          <RangePicker 
            className="w-full" 
            value={revenueDates}
            presets={[
              { label: 'Hôm nay', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
              { label: 'Tuần này', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
              { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
              { label: 'Năm nay', value: [dayjs().startOf('year'), dayjs().endOf('year')] },
            ]}
            onChange={(dates) => {
              setRevenueDates(dates);
              fetchMyRevenue(dates);
            }}
          />
        </div>
        
        {revenueData && (
          <Row gutter={16}>
            <Col span={12}>
              <Card>
                <Statistic
                  title="Tổng doanh thu"
                  value={revenueData.totalRevenue}
                  precision={0}
                  suffix="đ"
                  valueStyle={{ color: '#3f8600', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic
                  title="Tổng số đơn"
                  value={revenueData.totalOrders}
                  suffix="đơn"
                  valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
          </Row>
        )}
      </Modal>

      <ProductDetailModal 
        productId={selectedProductId}
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
      />
    </div>
  );
};

export default POSPage;
