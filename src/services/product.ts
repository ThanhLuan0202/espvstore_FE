import api from './api';

export const exportProducts = async () => {
    // We use fetch or axios directly to handle blob because the interceptor assumes json
    const state = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const token = state?.state?.token;
    
    const response = await fetch('/api/Products/export', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) throw new Error('Export failed');
    return await response.blob();
};

export const getImportTemplate = async () => {
    const state = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const token = state?.state?.token;
    
    const response = await fetch('/api/Products/import-template', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) throw new Error('Template download failed');
    return await response.blob();
};

export const importProducts = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/Products/import', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response as any;
};
