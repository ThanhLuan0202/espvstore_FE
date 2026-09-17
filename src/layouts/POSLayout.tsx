import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Layout, Button, Dropdown, Drawer } from 'antd';
import { ArrowLeft, User, LogOut, ClipboardList } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import ProfileModal from '../components/ProfileModal';
import OrderPage from '../pages/OrderPage';

const { Header, Content } = Layout;

const POSLayout: React.FC = () => {
  const navigate = useNavigate();
  const [profileVisible, setProfileVisible] = useState(false);
  const [orderHistoryVisible, setOrderHistoryVisible] = useState(false);
  const { user, logout } = useAuthStore();
  const role = user?.role || 'STAFF';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = [
    {
      key: 'profile',
      icon: <User size={16} className="mr-2" />,
      label: 'Hồ sơ',
    },
    {
      key: 'logout',
      icon: <LogOut size={16} className="mr-2" />,
      label: 'Đăng xuất',
    }
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      handleLogout();
    } else if (key === 'profile') {
      setProfileVisible(true);
    }
  };

  return (
    <Layout className="h-screen w-screen overflow-hidden bg-gray-50">
      <Header className="bg-white border-b border-gray-200 px-2 sm:px-4 h-14 leading-[56px] flex items-center justify-between shadow-sm z-10 w-full">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden shrink-0">
          {(role === 'ADMIN' || role === 'MANAGER') && (
            <>
              <Button 
                type="text" 
                icon={<ArrowLeft size={18} className="sm:size-5" />} 
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center hover:bg-gray-100 px-2 sm:px-4"
              >
                <span className="hidden sm:inline">Về trang quản trị</span>
              </Button>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
            </>
          )}
          <h1 className="text-blue-600 font-bold text-sm sm:text-lg m-0 truncate max-w-[100px] sm:max-w-none">{user?.tenantName ? `${user.tenantName.toUpperCase()} POS` : 'ESPV POS'}</h1>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {useAuthStore.getState().availableTenants?.length > 0 && (
            <Button 
              type="default" 
              onClick={() => navigate('/select-shop')}
              className="hidden sm:flex items-center text-blue-600 border-blue-200 hover:border-blue-400 bg-blue-50"
            >
              Danh sách cửa hàng
            </Button>
          )}
          <Button 
            type="default" 
            icon={<ClipboardList size={16} />} 
            onClick={() => setOrderHistoryVisible(true)}
            className="flex items-center px-2 sm:px-4"
            title="Lịch sử đơn hàng"
          >
            <span className="hidden sm:inline">Lịch sử đơn hàng</span>
          </Button>

          <Dropdown menu={{ items: userMenu, onClick: handleUserMenuClick }} placement="bottomRight" trigger={['click']}>
            <div className="flex items-center gap-1 sm:gap-2 bg-blue-50 px-2 sm:px-3 py-1 rounded-full text-blue-700 font-medium text-sm cursor-pointer hover:bg-blue-100 transition-colors">
              <User size={16} />
              <span className="hidden sm:inline max-w-[150px] truncate">Thu ngân: {user?.fullName || user?.username || 'Unknown'}</span>
            </div>
          </Dropdown>
        </div>
      </Header>
      
      <Content className="overflow-hidden">
        <Outlet />
      </Content>

      <ProfileModal 
        visible={profileVisible} 
        onClose={() => setProfileVisible(false)} 
      />

      <Drawer
        title="Lịch sử đơn hàng"
        placement="right"
        width="80%"
        onClose={() => setOrderHistoryVisible(false)}
        open={orderHistoryVisible}
        bodyStyle={{ padding: 0 }}
      >
        <OrderPage />
      </Drawer>
    </Layout>
  );
};

export default POSLayout;
