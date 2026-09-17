import React, { useState } from 'react';
import { Layout, Menu, Dropdown, Space, Avatar } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  GlobalOutlined,
  LogoutOutlined,
  UserOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import ProfileModal from '../components/ProfileModal';

const { Header, Sider, Content } = Layout;

const SystemAdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/platform-admin/dashboard',
      icon: <DashboardOutlined className="text-lg" />,
      label: <span className="font-medium">Tổng Quan</span>,
      onClick: () => navigate('/platform-admin/dashboard'),
    },
    {
      key: '/platform-admin/tenants',
      icon: <GlobalOutlined className="text-lg" />,
      label: <span className="font-medium">Quản Lý Cửa Hàng</span>,
      onClick: () => navigate('/platform-admin/tenants'),
    }
  ];

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Tài khoản',
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất',
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      handleLogout();
    } else if (key === 'profile') {
      setProfileVisible(true);
    }
  };

  return (
    <Layout className="min-h-screen bg-slate-50 font-sans">
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
        className="shadow-2xl"
        width={260}
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <div className="h-16 m-5 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-xl border border-white/10 shadow-inner cursor-pointer hover:bg-white/20 transition-all duration-300" onClick={() => setCollapsed(!collapsed)}>
          <GlobalOutlined className={`text-blue-400 text-2xl transition-all duration-300 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && (
            <span className="text-white font-bold text-xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
              ESPV Admin
            </span>
          )}
        </div>
        <Menu 
          theme="dark" 
          mode="inline" 
          selectedKeys={[location.pathname]}
          items={menuItems} 
          style={{ background: 'transparent' }}
          className="border-none px-3 mt-4 gap-2 flex flex-col"
        />
      </Sider>
      
      <Layout className="transition-all duration-300 ease-in-out bg-slate-50">
        <Header 
          className="px-8 flex justify-between items-center sticky top-0 z-10 backdrop-blur-xl bg-white/70 border-b border-slate-200 shadow-sm" 
          style={{ height: '72px', padding: '0 32px' }}
        >
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 m-0">
              Platform Operations
            </h1>
            <div className="hidden md:flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold border border-blue-100">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
              System Online
            </div>
          </div>
          <Dropdown menu={{ ...userMenu, onClick: handleUserMenuClick }} placement="bottomRight" trigger={['click']}>
            <Space className="cursor-pointer hover:bg-white/80 p-1 pr-3 rounded-full border border-slate-200 shadow-sm transition-all hover:shadow bg-white">
              <Avatar icon={<UserOutlined />} className="bg-gradient-to-r from-blue-500 to-indigo-600" size="large" />
              <div className="hidden sm:flex flex-col ml-1">
                <span className="font-semibold text-slate-700 leading-tight text-sm">{user?.fullName || user?.username}</span>
                <span className="text-xs text-slate-500 leading-tight">System Admin</span>
              </div>
            </Space>
          </Dropdown>
        </Header>
        
        <Content className="m-8">
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

export default SystemAdminLayout;
