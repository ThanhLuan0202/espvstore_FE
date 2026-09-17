import api from './api';

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  shopCount: number;
}

export interface PagedAdminResult {
  items: AdminUser[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

export interface PlatformShop {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  domain?: string;
  isActive: boolean;
  createdAt: string;
}

export const platformAdminService = {
  getAdmins: async (page = 1, pageSize = 10, search?: string): Promise<PagedAdminResult> => {
    const response = await api.get('/platform/admins', {
      params: { page, pageSize, search }
    });
    return response as any;
  },

  toggleAdminStatus: async (id: string) => {
    const response = await api.put(`/platform/admins/${id}/toggle-status`);
    return response as any;
  },

  createAdmin: async (data: { username: string, fullName: string, email: string, password?: string }) => {
    const response = await api.post('/platform/admins', data);
    return response as any;
  },

  updateAdmin: async (id: string, data: { fullName: string, email: string, password?: string }) => {
    const response = await api.put(`/platform/admins/${id}`, data);
    return response as any;
  },

  getShopsByAdminId: async (adminId: string): Promise<PlatformShop[]> => {
    const response = await api.get(`/platform/admins/${adminId}/shops`);
    return (response as any).data;
  },

  toggleShopStatus: async (id: string) => {
    const response = await api.put(`/platform/shops/${id}/toggle-status`);
    return response as any;
  },

  updateShop: async (id: string, data: { name: string, email?: string, phone?: string, domain?: string }) => {
    const response = await api.put(`/platform/shops/${id}`, data);
    return response as any;
  }
};
