import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../common/lib/api';
import type { CreateFileInput, UpdateFileInput } from '@repo/shared';

export interface File {
  _id: string;
  fileNoFull: string;
  clientId: {
    _id: string;
    name: string;
  };
  blNo: string;
  blDate: string;
  invoiceValue: number;
  currency: string;
  description: string;
  status: string;
  createdAt: string;
}

export const useFiles = (filters: { page?: number; limit?: number; status?: string; search?: string } = {}) => {
  return useQuery({
    queryKey: ['files', filters],
    queryFn: async () => {
      const { data } = await api.get('/files', { params: filters });
      return data;
    },
  });
};

export const useCreateFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateFileInput) => {
      const res = await api.post('/files', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
};

export const useUpdateFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateFileInput }) => {
      const res = await api.put(`/files/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
};
