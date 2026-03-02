import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../common/lib/api';
import type { CreateClientInput, UpdateClientInput, ClientType } from '@repo/shared';

export interface Client {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  type: ClientType;
  fileCount?: number;
  totalExpenseAllFiles?: number;
  createdAt: string;
}

export const useClients = (page: number = 1, limit: number = 50) => {
  return useQuery({
    queryKey: ['clients', page, limit],
    queryFn: async () => {
      const { data } = await api.get(`/clients?page=${page}&limit=${limit}`);
      return data;
    },
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clientData: CreateClientInput) => {
      const { data } = await api.post('/clients', clientData);
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClientInput }) => {
      const response = await api.put(`/clients/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/clients/${id}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
};

export const useClientStats = () => {
  return useQuery({
    queryKey: ['clients', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/clients/stats');
      return data.data;
    },
  });
};

export const useClientFiles = (clientId: string | null) => {
  return useQuery({
    queryKey: ['clients', clientId, 'files'],
    queryFn: async () => {
      if (!clientId) return null;
      const { data } = await api.get(`/clients/${clientId}/files`);
      return data.data;
    },
    enabled: !!clientId,
  });
};
