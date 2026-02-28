import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type LoginInput } from '@repo/shared';
import { useAuthStore } from '../stores/useAuthStore';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Card, Text, Button, TextInput, Spin } from '@gravity-ui/uikit';
import { useNavigate } from 'react-router-dom';

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { identifier: '', password: '' }
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, { ...data, userType: 'STAFF' }, { withCredentials: true });
      return res.data;
    },
    onSuccess: (data) => {
      loginAction(data.data);
      navigate('/');
    }
  });

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--g-color-base-generic-hover)] p-4">
      <Card view="raised" className="w-full max-w-md p-8 flex flex-col gap-6 rounded-2xl">
        <div className="text-center">
          <Text variant="display-2" className="mb-2">Staff Portal</Text>
          <Text variant="body-2" color="secondary">Enter your credentials and Store Code.</Text>
        </div>

        {loginMutation.isError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm text-center">
            Failed to login. Please verify your email, password, and Store Code.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

          <Controller
            name="identifier"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                placeholder="Email or Phone Number"
                size="xl"
                validationState={errors.identifier ? 'invalid' : undefined}
                errorMessage={errors.identifier?.message}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                type="password"
                placeholder="Password"
                size="xl"
                validationState={errors.password ? 'invalid' : undefined}
                errorMessage={errors.password?.message}
              />
            )}
          />

          <Button type="submit" view="action" size="xl" width="max" className="mt-2" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? <Spin size="xs" /> : 'Login to Workspace'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
