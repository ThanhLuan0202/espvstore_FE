import api from './api';

export interface Promotion {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number;
  maxUses?: number;
  usedCount: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface CreatePromotionRequest {
  code: string;
  discountType: number;
  discountValue: number;
  maxDiscountAmount?: number;
  maxUses?: number;
  startDate?: string;
  endDate?: string;
}

export const getPromotions = async (): Promise<Promotion[]> => {
    const response = await api.get('/promotions');
    return response as any;
};

export const checkPromotion = async (code: string): Promise<Promotion> => {
    const response = await api.get(`/promotions/check?code=${code}`);
    return response as any;
};

export const createPromotion = async (data: CreatePromotionRequest): Promise<Promotion> => {
    const response = await api.post('/promotions', data);
    return response as any;
};

export const togglePromotionStatus = async (id: string): Promise<void> => {
    await api.put(`/promotions/${id}/toggle`);
};
