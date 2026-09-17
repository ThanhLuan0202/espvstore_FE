import api from './api';

export interface User {
    id: string;
    username: string;
    fullName: string;
    email: string;
    isActive: boolean;
    roleId: string;
    roleName: string;
    createdAt: string;
}

export interface CreateUserRequest {
    username: string;
    password?: string;
    fullName: string;
    email?: string;
    isActive: boolean;
    roleId: string;
}

export interface UpdateUserRequest {
    fullName: string;
    email?: string;
    isActive: boolean;
    roleId: string;
    password?: string;
}

export const getUsers = async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response as any;
};

export const getSalesStaff = async (): Promise<User[]> => {
    const response = await api.get('/users/sales');
    return response as any;
};

export const getUser = async (id: string): Promise<User> => {
    const response = await await api.get(`/users/${id}`);
    return response as any;
};

export const createUser = async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post('/users', data);
    return response as any;
};

export const updateUser = async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response as any;
};

export const deleteUser = async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
};
