import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type LoginInput } from '@repo/shared';
import { useAuthStore } from '../stores/useAuthStore';
import { useMutation } from '@tanstack/react-query';
import api from '../../../common/lib/api';
import { Card, Text, Button, TextInput, Spin, Icon } from '@gravity-ui/uikit';
import { Eye, EyeSlash } from '@gravity-ui/icons';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const loginAction = useAuthStore((state) => state.login);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { identifier: '', password: '' }
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await api.post('/auth/login', data, { withCredentials: true });
      return res.data;
    },
    onSuccess: (data) => {
      loginAction(data.data);
      // Route based on userType: admin → /admin, user → /dashboard
      if (data.data?.userType === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  });

  const onSubmit = (data: LoginInput) => loginMutation.mutate(data);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--g-color-base-background)] p-4">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/20 mb-4 border border-indigo-500/30">
            <span className="text-2xl font-bold text-indigo-400">C</span>
          </div>
          <Text variant="display-2" className="block font-bold">CNF Nexus</Text>
          <Text variant="body-2" color="secondary" className="block mt-1">Sign in to your account</Text>
        </div>

        <Card view="raised" className="p-7 flex flex-col gap-5 rounded-2xl border border-[var(--g-color-line-generic)]">
          {loginMutation.isError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm text-center">
              Invalid credentials. Please try again.
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

            <div className="relative">
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    size="xl"
                    validationState={errors.password ? 'invalid' : undefined}
                    errorMessage={errors.password?.message}
                  />
                )}
              />
              <div className="absolute right-0 top-0 h-[42px] flex items-center pr-1">
                <Button view="flat" size="m" onClick={() => setShowPassword(!showPassword)}>
                  <Icon data={showPassword ? EyeSlash : Eye} size={16} />
                </Button>
              </div>
            </div>

            <Button type="submit" view="action" size="xl" width="max" disabled={loginMutation.isPending} className="mt-1">
              {loginMutation.isPending ? <Spin size="xs" /> : 'Sign In'}
            </Button>
          </form>


        </Card>
      </div>
    </div>
  );
}
