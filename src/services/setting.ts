import api from './api';

export interface Setting {
    key: string;
    value: string;
    description?: string;
}

export interface UpdateSettingRequest {
    key: string;
    value: string;
}

export const getSettings = async (): Promise<Setting[]> => {
    const response = await api.get('/settings');
    return response as any;
};

export const updateSettings = async (data: UpdateSettingRequest[]): Promise<void> => {
    await api.put('/settings', data);
};
