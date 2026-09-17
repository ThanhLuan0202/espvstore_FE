import api from './api';

export interface Expense {
    id: string;
    title: string;
    amount: number;
    type: string; // INCOME | EXPENSE
    category: string; 
    transactionDate: string;
    note?: string;
    userId: string;
    userName?: string;
    createdAt: string;
}

export interface CreateExpenseRequest {
    title: string;
    amount: number;
    type: number; // 0 = INCOME, 1 = EXPENSE
    category: number; // 0=SALARY, 1=UTILITY, 2=SUPPLY, 3=MAINTENANCE, 4=OTHER_EXPENSE, 5=OTHER_INCOME
    transactionDate?: string;
    note?: string;
}

export const getExpenses = async (): Promise<Expense[]> => {
    const response = await api.get('/expenses');
    return response as any;
};

export const createExpense = async (data: CreateExpenseRequest): Promise<Expense> => {
    const response = await api.post('/expenses', data);
    return response as any;
};

export const deleteExpense = async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
};
