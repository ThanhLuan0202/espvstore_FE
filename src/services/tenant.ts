import api from './api';

export interface Tenant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  domain?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PagedTenantResult {
  items: Tenant[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

export const tenantService = {
  getAll: async (page = 1, pageSize = 10, search?: string): Promise<PagedTenantResult> => {
    const response = await api.get('/tenants', {
      params: { page, pageSize, search }
    });
    return response as any;
  },

  toggleStatus: async (id: string) => {
    const response = await api.put(`/tenants/${id}/toggle-status`);
    return response as any;
  }
};
