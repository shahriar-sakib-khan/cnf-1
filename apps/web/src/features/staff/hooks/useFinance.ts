import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../common/lib/api';
import type { MoneyRequestInput, ExpenseInput, RequestStatus } from '@repo/shared';

export interface MoneyRequest extends MoneyRequestInput {
  _id: string;
  staffId: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  status: RequestStatus;
  createdAt: string;
  approvedAt?: string;
}

export interface Expense extends ExpenseInput {
  _id: string;
  staffId: {
    _id: string;
    name: string;
  };
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
    },
  });
};

// ── Manager Hooks ────────────────────────────────────────

export const useAllRequests = (status?: RequestStatus) => {
  return useQuery({
    queryKey: ['finance-requests', status],
    queryFn: async () => {
      const { data } = await api.get('/finance/requests', { params: { status } });
      return data.data as MoneyRequest[];
    },
  });
};

export const useApproveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const res = await api.put(`/finance/requests/${requestId}/approve`);
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
