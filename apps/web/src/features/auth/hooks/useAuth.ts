import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { UpdateProfileInput, ChangePasswordInput } from '@repo/shared';
import { useAuthStore } from '../stores/useAuthStore';
import api from '../../../common/lib/api';

export const useAuthRestore = () => {
  const { login, logout, setLoading } = useAuthStore();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        setLoading(true);
        const res = await api.get('/auth/me');
        if (res.data?.success && res.data?.data) {
          login(res.data.data);
        } else {
          logout();
        }
      } catch (err) {
        // If 401, the interceptor will handle it, but we should stop loading here too
        logout();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [login, logout, setLoading]);
};

export const useUpdateProfile = () => {
  const { login } = useAuthStore();
  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const res = await api.put('/auth/profile', data);
      return res.data;
    },
    onSuccess: (data) => {
      // Update global auth state immediately with new name/email/phone
      if (data.success && data.data) {
        login(data.data);
      }
    }
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: ChangePasswordInput) => {
      const res = await api.put('/auth/password', data);
      return res.data;
    }
  });
};
