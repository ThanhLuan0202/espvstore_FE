import api from './api';

export interface Customer {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    note?: string;
    point: number;
    totalSpent: number;
    isActive: boolean;
    createdAt: string;
}

export interface CreateCustomerRequest {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    note?: string;
}

export interface UpdateCustomerRequest {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    note?: string;
    isActive: boolean;
}

export const getCustomers = async (search?: string): Promise<Customer[]> => {
    let url = '/customers';
    if (search) {
        url += `?search=${encodeURIComponent(search)}`;
    }
    const response = await api.get(url);
    return response as any;
};

export const getCustomer = async (id: string): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`);
    return response as any;
};

export const createCustomer = async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await api.post('/customers', data);
    return response as any;
};

export const updateCustomer = async (id: string, data: UpdateCustomerRequest): Promise<Customer> => {
    const response = await api.put(`/customers/${id}`, data);
    return response as any;
};

export const deleteCustomer = async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
};
