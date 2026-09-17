import api from './api';

export interface OrderDetail {
    id?: string;
    productVariantId: string;
    productName?: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
}

export interface PaymentTransaction {
    id: string;
    amount: number;
    paymentMethod: string;
    status: string;
    referenceId?: string;
    note?: string;
    createdAt: string;
}

export interface Order {
    id: string;
    orderCode: string;
    customerId?: string;
    customerName?: string;
    userId: string;
    userName?: string;
    subTotal: number;
    discountAmount: number;
    totalAmount: number;
    paymentMethod: string;
    status: string;
    note?: string;
    createdAt: string;
    orderDetails: OrderDetail[];
    paymentTransactions: PaymentTransaction[];
}

export interface CreateOrderRequest {
    customerId?: string;
    saleId?: string;
    paymentMethod: number; // Enum: 0=CASH, 1=TRANSFER, 2=CARD
    discountAmount: number;
    promotionCode?: string;
    note?: string;
    orderDetails: {
        productVariantId: string;
        quantity: number;
        unitPrice: number;
    }[];
}

export const getOrders = async (): Promise<Order[]> => {
    const response = await api.get('/orders');
    return response as any;
};

export const getOrder = async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response as any;
};

export const createOrder = async (data: CreateOrderRequest): Promise<Order> => {
    const response = await api.post('/orders', data);
    return response as any;
};

export const updateOrderStatus = async (id: string, status: number, note?: string, isDefective: boolean = false): Promise<void> => {
    await api.put(`/orders/${id}/status`, { status, note, isDefective });
};

export interface MyRevenue {
    totalRevenue: number;
    totalOrders: number;
}

export const getMyRevenue = async (startDate?: string, endDate?: string): Promise<MyRevenue> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/orders/my-revenue?${params.toString()}`);
    return response as any;
};
