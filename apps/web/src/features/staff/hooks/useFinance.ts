import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../common/lib/api';
import type { MoneyRequestInput, ExpenseInput, RequestStatus, ExpenseCategoryInput } from '@repo/shared';

export interface ExpenseCategory extends ExpenseCategoryInput {
  _id: string;
}

export interface MoneyRequest extends Omit<MoneyRequestInput, 'fileId'> {
  _id: string;
  staffId: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    balanceTaka?: number;
    role?: string;
  };
  fileId?: {
    _id: string;
    fileNoFull: string;
    status: string;
  };
  status: RequestStatus;
  grantedAmount?: number;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: {
    _id: string;
    name: string;
    role: string;
  };
  isArchived: boolean;
}

export interface Expense extends Omit<ExpenseInput, 'fileId' | 'category'> {
  _id: string;
  staffId: {
    _id: string;
    name: string;
  };
  fileId?: {
    _id: string;
    fileNoFull: string;
    clientId?: { _id: string; name: string };
  };
  category: {
    _id: string;
    name: string;
  };
  description: string;
  createdAt: string;
}

export interface WalletFinancials {
  balance: number;
  requests: MoneyRequest[];
  expenses: Expense[];
}

// ── Staff Hooks ──────────────────────────────────────────

export const useMyFinancials = () => {
  return useQuery({
    queryKey: ['my-financials'],
    queryFn: async () => {
      const { data } = await api.get('/finance/my-wallet');
      return data.data as WalletFinancials;
    },
  });
};

export const useRequestMoney = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MoneyRequestInput) => {
      const res = await api.post('/finance/requests', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-financials'] });
      queryClient.invalidateQueries({ queryKey: ['finance-requests'] });
    },
  });
};

export const useSettleExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ExpenseInput & { requestId?: string }) => {
      const res = await api.post('/finance/settle', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-financials'] });
      queryClient.invalidateQueries({ queryKey: ['file-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['staff-financials'] });
      queryClient.invalidateQueries({ queryKey: ['finance-expenses'] });
    },
  });
};

// ── Manager Hooks ────────────────────────────────────────

export const useAllRequests = (status?: RequestStatus, isArchived: boolean = false) => {
  return useQuery({
    queryKey: ['finance-requests', status, isArchived],
    queryFn: async () => {
      const { data } = await api.get('/finance/requests', { params: { status, isArchived } });
      return data.data as MoneyRequest[];
    },
  });
};

// ── Category Hooks ────────────────────────────────────────

export const useExpenseCategories = () => {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data } = await api.get('/finance/categories');
      return data.data as ExpenseCategory[];
    },
  });
};

export const useCreateExpenseCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ExpenseCategoryInput) => {
      const res = await api.post('/finance/categories', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
  });
};

export const useUpdateExpenseCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: ExpenseCategoryInput & { id: string }) => {
      const res = await api.put(`/finance/categories/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
  });
};

export const useAllExpenses = () => {
  return useQuery({
    queryKey: ['finance-expenses', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/finance/expenses');
      return data.data as Expense[];
    },
  });
};

export const useApproveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, grantedAmount }: { id: string; grantedAmount: number }) => {
      const res = await api.put(`/finance/requests/${id}/approve`, { grantedAmount });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['staff'] }); // Update staff balances in list
    },
  });
};

export const useRejectRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const res = await api.put(`/finance/requests/${requestId}/reject`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-requests'] });
    },
  });
};

export const useArchiveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const res = await api.put(`/finance/requests/${requestId}/archive`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-requests'] });
    },
  });
};

export const useUnarchiveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const res = await api.put(`/finance/requests/${requestId}/unarchive`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-requests'] });
    },
  });
};

export const useStaffFinancials = (staffId: string) => {
  return useQuery({
    queryKey: ['staff-financials', staffId],
    queryFn: async () => {
      const { data } = await api.get(`/finance/staff/${staffId}`);
      return data.data as WalletFinancials;
    },
    enabled: !!staffId,
  });
};

export const useFileExpenses = (fileId: string) => {
  return useQuery({
    queryKey: ['file-expenses', fileId],
    queryFn: async () => {
      const { data } = await api.get(`/finance/files/${fileId}`);
      return data.data as Expense[];
    },
    enabled: !!fileId,
  });
};

export const useFileRequests = (fileId: string) => {
  return useQuery({
    queryKey: ['file-requests', fileId],
    queryFn: async () => {
      const { data } = await api.get('/finance/requests', { params: { fileId } });
      return data.data as MoneyRequest[];
    },
    enabled: !!fileId,
  });
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/finance/dashboard');
      return data.data;
    },
  });
};
