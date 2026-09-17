import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

import DashboardLayout from './layouts/DashboardLayout';
import POSLayout from './layouts/POSLayout';
import SystemAdminLayout from './layouts/SystemAdminLayout';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import LoginPage from './pages/LoginPage';
import SelectShopPage from './pages/SelectShopPage';
import ProtectedRoute from './components/ProtectedRoute';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import ProductFormPage from './pages/ProductFormPage';
import InventoryPage from './pages/InventoryPage';
import SupplierPage from './pages/SupplierPage';
import PurchasePage from './pages/PurchasePage';
import PurchaseFormPage from './pages/PurchaseFormPage';
import CustomerPage from './pages/CustomerPage';
import OrderPage from './pages/OrderPage';
import ExpensePage from './pages/ExpensePage';
import PromotionPage from './pages/PromotionPage';
import UserPage from './pages/UserPage';
import TenantManagementPage from './pages/TenantManagementPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN} theme={{ token: { colorPrimary: '#1677ff' } }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/select-shop" element={<SelectShopPage />} />
            
            {/* Protected Routes for authenticated users */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                
                {/* Inventory: ADMIN, INVENTORY_MANAGER */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'INVENTORY_MANAGER']} />}>
                  <Route path="/inventory" element={<InventoryPage />} />
                </Route>

                {/* Orders, Customers: ADMIN, MANAGER, STAFF */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']} />}>
                  <Route path="/orders" element={<OrderPage />} />
                  <Route path="/customers" element={<CustomerPage />} />
                </Route>

                {/* Products, Categories, Suppliers: ADMIN, MANAGER, INVENTORY_MANAGER, STAFF */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'STAFF']} />}>
                  <Route path="/products" element={<ProductPage />} />
                  <Route path="/products/new" element={<ProductFormPage />} />
                  <Route path="/products/edit/:id" element={<ProductFormPage />} />
                  <Route path="/categories" element={<CategoryPage />} />
                  <Route path="/suppliers" element={<SupplierPage />} />
                </Route>

                {/* Dashboard: ADMIN, MANAGER, STAFF */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']} />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                </Route>

                {/* Everything else (Users, Finance, etc): ADMIN, MANAGER */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
                  <Route path="/purchase" element={<PurchasePage />} />
                  <Route path="/purchase/new" element={<PurchaseFormPage />} />
                  <Route path="/expenses" element={<ExpensePage />} />
                  <Route path="/promotions" element={<PromotionPage />} />
                  <Route path="/users" element={<UserPage />} />
                </Route>

              </Route>
            </Route>

            {/* POS Route - Specific Roles */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CASHIER', 'STAFF']} />}>
              <Route element={<POSLayout />}>
                <Route path="/pos" element={<POSPage />} />
              </Route>
            </Route>

            {/* Platform Admin Route */}
            <Route element={<ProtectedRoute allowedRoles={['SYSTEM_ADMIN']} />}>
              <Route element={<SystemAdminLayout />}>
                <Route path="/platform-admin/dashboard" element={<div className="text-xl">Tổng Quan Hệ Thống (Đang phát triển)</div>} />
                <Route path="/platform-admin/tenants" element={<TenantManagementPage />} />
              </Route>
            </Route>
            
            {/* Fallback 404 */}
            <Route path="*" element={<div className="p-10 text-center text-2xl font-bold">404 - Không tìm thấy trang</div>} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
