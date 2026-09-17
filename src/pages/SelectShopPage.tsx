import React, { useState } from 'react';
import { Card, Row, Col, Button, Modal, Form, Input, message, Typography } from 'antd';
import { ShopOutlined, PlusOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

const { Title, Text } = Typography;

const SelectShopPage: React.FC = () => {
  const { availableTenants, globalToken, setAuth, logout, user } = useAuthStore();
  const navigate = useNavigate();
  
  const [loadingShopId, setLoadingShopId] = useState<string | null>(null);
  const [addShopVisible, setAddShopVisible] = useState(false);
  const [addShopLoading, setAddShopLoading] = useState(false);
  const [form] = Form.useForm();

  if (!globalToken) {
    navigate('/login');
    return null;
  }

  const handleSelectShop = async (tenantId: string) => {
    try {
      setLoadingShopId(tenantId);
      const res: any = await api.post('/Auth/select-tenant', {
        globalToken,
        tenantId,
      });
      
      if (res.success) {
        setAuth(res.data.token, res.data.refreshToken, res.data.user);
        
        if (res.data.user?.role === 'CASHIER') {
          navigate('/pos');
        } else if (res.data.user?.role === 'INVENTORY_MANAGER') {
          navigate('/inventory');
        } else if (res.data.user?.role === 'STAFF') {
          navigate('/orders');
        } else {
          navigate('/dashboard');
        }
      } else {
        message.error('Không thể đăng nhập vào cửa hàng này');
      }
    } catch (error: any) {
      // API interceptor handles error message display, but we can fallback here
      message.error(error.response?.data?.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoadingShopId(null);
    }
  };

  const handleAddShop = async (values: any) => {
    try {
      setAddShopLoading(true);
      const res: any = await api.post('/Tenants/my-shops', values, {
        headers: {
          Authorization: `Bearer ${globalToken}`
        }
      });
      if (res.success) {
        message.success('Đã thêm cửa hàng mới thành công!');
        setAddShopVisible(false);
        form.resetFields();
        Modal.info({
          title: 'Cửa hàng đã được tạo',
          content: 'Vui lòng đăng nhập lại để cập nhật danh sách cửa hàng của bạn.',
          onOk: () => {
            logout();
            navigate('/login');
          }
        });
      }
    } catch (error: any) {
      message.error('Có lỗi xảy ra khi tạo cửa hàng');
    } finally {
      setAddShopLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm p-4 flex justify-between items-center border-b">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
             <ShopOutlined className="text-white text-lg" />
          </div>
          <Title level={4} style={{ margin: 0 }} className="text-blue-800">ESPV STORE</Title>
        </div>
        <div className="flex items-center gap-4">
          <Text className="text-gray-600">Xin chào, <b>{user?.fullName || user?.username}</b></Text>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>Đăng xuất</Button>
        </div>
      </div>

      <div className="flex-1 p-8 max-w-6xl mx-auto w-full mt-8">
        <div className="text-center mb-10">
          <Title level={2} className="mb-2">
            {availableTenants.length === 0 ? "Chào mừng đến với ESPVSTORE" : "Chọn cửa hàng"}
          </Title>
          {availableTenants.length > 0 && (
            <Text className="text-gray-500 text-lg">Bạn muốn truy cập vào cửa hàng nào hôm nay?</Text>
          )}
        </div>

        {availableTenants.length === 0 ? (
          <div className="text-center mt-12 bg-white p-10 rounded-2xl shadow-sm border border-gray-200">
            <ShopOutlined className="text-6xl text-gray-300 mb-6" />
            <Title level={3} className="text-gray-700 mb-2">Bạn chưa có cửa hàng nào</Title>
            <Text className="text-gray-500 text-lg block mb-8">
              Hãy tạo một cửa hàng mới để bắt đầu kinh doanh trên hệ thống ESPVSTORE.
            </Text>
            <Button 
              type="primary" 
              size="large" 
              icon={<PlusOutlined />} 
              onClick={() => setAddShopVisible(true)}
              className="h-12 px-8 rounded-full text-lg shadow-md hover:shadow-lg transition-all"
            >
              Tạo Cửa Hàng Đầu Tiên
            </Button>
          </div>
        ) : (
          <Row gutter={[24, 24]} justify="center">
            {availableTenants.map(tenant => (
              <Col xs={24} sm={12} md={8} key={tenant.id}>
                <Card
                  hoverable={tenant.isActive !== false}
                  className={`h-full border border-gray-200 shadow-sm transition-shadow rounded-xl overflow-hidden ${
                    tenant.isActive === false 
                      ? 'bg-gray-100 cursor-not-allowed opacity-75' 
                      : 'hover:shadow-md cursor-pointer'
                  }`}
                  bodyStyle={{ padding: '24px', position: 'relative' }}
                  onClick={() => {
                    if (tenant.isActive !== false) {
                      handleSelectShop(tenant.id);
                    }
                  }}
                >
                  {tenant.isActive === false && (
                    <div className="absolute top-3 right-3 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-semibold">
                      Đang chờ duyệt
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
                      tenant.isActive === false ? 'bg-gray-200' : 'bg-blue-50'
                    }`}>
                      <ShopOutlined className={`text-3xl ${
                        tenant.isActive === false ? 'text-gray-400' : 'text-blue-500'
                      }`} />
                    </div>
                    <Title level={4} className={`mb-1 ${tenant.isActive === false ? 'text-gray-500' : ''}`}>
                      {tenant.name}
                    </Title>
                    <Button 
                      type="primary" 
                      className="mt-4 w-full rounded-lg"
                      loading={loadingShopId === tenant.id}
                      disabled={tenant.isActive === false}
                    >
                      Truy cập
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}

            <Col xs={24} sm={12} md={8}>
              <Card
                hoverable
                className="h-full border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 transition-colors rounded-xl overflow-hidden cursor-pointer flex flex-col items-center justify-center min-h-[220px]"
                bodyStyle={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
                onClick={() => setAddShopVisible(true)}
              >
                <div className="h-14 w-14 rounded-full border-2 border-gray-400 text-gray-500 flex items-center justify-center mb-3">
                  <PlusOutlined className="text-2xl" />
                </div>
                <Text className="text-gray-600 font-medium text-lg">Thêm cửa hàng mới</Text>
              </Card>
            </Col>
          </Row>
        )}
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg">
            <ShopOutlined className="text-blue-600" />
            <span>Tạo cửa hàng mới</span>
          </div>
        }
        open={addShopVisible}
        onCancel={() => setAddShopVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={handleAddShop} className="mt-4">
          <Form.Item 
            name="shopName" 
            label="Tên cửa hàng" 
            rules={[{ required: true, message: 'Vui lòng nhập tên cửa hàng' }]}
          >
            <Input size="large" placeholder="Ví dụ: ESPVSTORE Chi nhánh 2" prefix={<ShopOutlined className="text-gray-400 mr-1" />} />
          </Form.Item>
          
          <div className="flex justify-end gap-3 mt-8">
            <Button size="large" onClick={() => setAddShopVisible(false)}>Huỷ bỏ</Button>
            <Button size="large" type="primary" htmlType="submit" loading={addShopLoading} className="bg-blue-600">
              Tạo cửa hàng
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SelectShopPage;
