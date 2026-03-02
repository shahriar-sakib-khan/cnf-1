import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../common/lib/api';
import type { CreateStaffInput, AdminResetPasswordInput, UpdateStaffInput } from '@repo/shared';

export interface User {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  isActive: boolean;
  tenantId?: string;
  balanceTaka: number;
}

export const useStaff = () => {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data } = await api.get('/store/staff');
      return data.data as User[];
    },
  });
};

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStaffInput) => {
      const res = await api.post('/store/staff', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateStaffInput }) => {
      const res = await api.put(`/store/staff/${userId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
};

export const useResetStaffPassword = () => {
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: AdminResetPasswordInput }) => {
      const res = await api.put(`/store/staff/${userId}/password`, data);
      return res.data;
    },
  });
};
