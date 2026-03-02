import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../common/lib/api';
import type { InvoiceInput, InvoiceType } from '@repo/shared';

export const useReports = () => {
  return useQuery({
    queryKey: ['reports', 'files'],
    queryFn: async () => {
      const resp = await api.get('/reports/files');
      return resp.data.data;
    }
  });
};

export const useInvoice = (fileId: string | undefined, type: InvoiceType) => {
  return useQuery({
    queryKey: ['reports', 'invoice', fileId, type],
    queryFn: async () => {
      if (!fileId) return null;
      const resp = await api.get(`/reports/invoice/${fileId}/${type}`);
      return resp.data.data;
    },
    enabled: !!fileId
  });
};

export const useUpsertInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InvoiceInput) => {
      const resp = await api.post('/reports/invoice', data);
      return resp.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'files'] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'invoice', variables.fileId, variables.type] });
    }
  });
};

export const useReportTemplate = (type: InvoiceType) => {
  return useQuery({
    queryKey: ['reports', 'template', type],
    queryFn: async () => {
      const resp = await api.get(`/reports/template/${type}`);
      return resp.data.data;
    }
  });
};

export const useUpsertReportTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const resp = await api.post('/reports/template', data);
      return resp.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'template', variables.type] });
    }
  });
};
