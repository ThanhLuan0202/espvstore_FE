import React, { useState } from 'react';
import { Layout, Menu, Button, theme, Dropdown } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import ProfileModal from '../components/ProfileModal';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Building2,
  Menu as MenuIcon,
  LogOut,
  User,
  ListTree,
  Boxes,
  Wallet,
  Tag
} from 'lucide-react';

const { Header, Sider, Content } = Layout;

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const { user, logout, availableTenants } = useAuthStore();
  const role = user?.role || 'STAFF';

  const menuItems = [
    { key: '/dashboard', icon: <LayoutDashboard size={18} />, label: role === 'STAFF' ? 'Doanh thu cá nhân' : 'Tổng quan', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { key: '/categories', icon: <ListTree size={18} />, label: 'Danh mục', roles: ['ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'STAFF'] },
    { key: '/products', icon: <Package size={18} />, label: 'Sản phẩm', roles: ['ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'STAFF'] },
    { key: '/inventory', icon: <Boxes size={18} />, label: 'Tồn kho', roles: ['ADMIN', 'INVENTORY_MANAGER'] },
    { key: '/orders', icon: <ShoppingCart size={18} />, label: 'Đơn hàng', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { key: '/customers', icon: <Users size={18} />, label: 'Khách hàng', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { key: '/suppliers', icon: <Building2 size={18} />, label: 'Nhà cung cấp', roles: ['ADMIN', 'MANAGER', 'INVENTORY_MANAGER'] },
    { key: '/expenses', icon: <Wallet size={18} />, label: 'Sổ Quỹ / Thu Chi', roles: ['ADMIN', 'MANAGER'] },
    { key: '/promotions', icon: <Tag size={18} />, label: 'Khuyến mãi', roles: ['ADMIN', 'MANAGER'] },
    { key: '/users', icon: <User size={18} />, label: 'Nhân viên', roles: ['ADMIN', 'MANAGER'] },
  ].filter(item => item.roles.includes(role));

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
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
      logout();
      navigate('/login');
    } else if (key === 'profile') {
      setProfileVisible(true);
    }
  };

  return (
    <Layout className="min-h-screen">
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light" width={240}>
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <h1 className={`text-blue-600 font-bold text-xl transition-all duration-300 ${collapsed ? 'scale-0 hidden' : 'scale-100'} truncate px-4 w-full text-center`}>
            {user?.tenantName || 'ESPVSTORE'}
          </h1>
          <h1 className={`text-blue-600 font-bold text-xl transition-all duration-300 ${!collapsed ? 'scale-0 hidden' : 'scale-100'}`}>
            ES
          </h1>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-r-0 pt-4"
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} className="flex justify-between items-center px-4 shadow-sm z-10 relative">
          <Button
            type="text"
            icon={<MenuIcon />}
            onClick={() => setCollapsed(!collapsed)}
            className="w-10 h-10 flex items-center justify-center"
          />
          <div className="flex items-center gap-4">
            {availableTenants && availableTenants.length > 0 && (
              <Button 
                type="default" 
                icon={<Building2 size={16} />}
                onClick={() => navigate('/select-shop')}
                className="flex items-center text-blue-600 border-blue-200 hover:border-blue-400 bg-blue-50"
              >
                Danh sách cửa hàng
              </Button>
            )}
            <Dropdown menu={{ items: userMenu, onClick: handleUserMenuClick }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-1 rounded-md transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold uppercase">
                  {(user?.fullName || user?.username || 'AD').substring(0, 2)}
                </div>
                <span className="font-medium hidden sm:block">{user?.fullName || user?.username || 'User'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="m-6 p-6 rounded-lg bg-white overflow-initial min-h-[280px]">
          <Outlet />
        </Content>
      </Layout>
      
      <ProfileModal 
        visible={profileVisible} 
        onClose={() => setProfileVisible(false)} 
      />
    </Layout>
  );
};

export default DashboardLayout;
