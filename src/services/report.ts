import api from './api';

export interface DashboardSummary {
  totalRevenue: number;
  totalExpense: number;
  profit: number; // Keep for backwards compatibility
  grossProfit: number;
  netProfit: number;
  totalOrders: number;
  totalItemsSold: number;
  totalStockQuantity: number;
}

export interface RevenueByDate {
  date: string;
  revenue: number;
}

export interface TopSellingProduct {
  productName: string;
  sku: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface SalesPerformance {
  staffName: string;
  totalOrders: number;
  totalRevenue: number;
  totalItemsSold: number;
}

export interface DashboardReport {
  summary: DashboardSummary;
  revenueChart: RevenueByDate[];
  topSellingProducts: TopSellingProduct[];
  salesPerformances: SalesPerformance[];
}

export const getDashboardReport = async (startDate?: string, endDate?: string): Promise<DashboardReport> => {
  let url = '/reports/dashboard';
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  if (params.toString()) {
    url += '?' + params.toString();
  }
  
  const response: any = await api.get(url);
  return response as DashboardReport;
};
