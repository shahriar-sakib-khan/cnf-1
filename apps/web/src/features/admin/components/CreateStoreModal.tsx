import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateOwnerSchema, type CreateOwnerInput } from '@repo/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Text, Button, Card, TextInput, Spin, Icon, Toaster } from '@gravity-ui/uikit';
import { Eye, EyeSlash } from '@gravity-ui/icons';
import { useState } from 'react';
import api from '../../../common/lib/api';

const toaster = new Toaster();

interface CreateStoreModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateStoreModal({ open, onClose }: CreateStoreModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateOwnerInput>({
    resolver: zodResolver(CreateOwnerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '' },
  });

  const createMutation = useMutation({
    mutationFn: async (d: CreateOwnerInput) => {
      const { data } = await api.post('/admin/users', d);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'owners'] });
      reset();
      setShowPassword(false);
      onClose();
      toaster.add({
        name: 'create-success',
        title: 'Success',
        content: 'Owner and Store created successfully',
        theme: 'success',
      });
    },
  });

  if (!open) return null;

  return (
    <Card view="raised" className="p-6 rounded-2xl border border-red-500/20">
      <Text variant="subheader-2" className="block mb-4 font-semibold">Create Owner Account</Text>
      <Text variant="body-2" color="secondary" className="block mb-5">
        A store will be automatically created for this user.
      </Text>

      {createMutation.isError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4">
          {/* @ts-expect-error axios error */}
          {createMutation.error?.response?.data?.error?.message || 'Failed to create user'}
        </div>
      )}

      <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Controller name="name" control={control} render={({ field }) => (
            <TextInput {...field} placeholder="Full Name (optional)" size="l"
              validationState={errors.name ? 'invalid' : undefined}
              errorMessage={errors.name?.message} />
          )} />
          <div className="relative">
            <Controller name="password" control={control} render={({ field }) => (
              <TextInput {...field}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password *"
                size="l"
                validationState={errors.password ? 'invalid' : undefined}
                errorMessage={errors.password?.message}
              />
            )} />
            <div className="absolute right-0 top-0 h-[38px] flex items-center pr-1">
              <Button view="flat" size="m" onClick={() => setShowPassword(!showPassword)}>
                <Icon data={showPassword ? EyeSlash : Eye} size={16} />
              </Button>
            </div>
          </div>

          <Controller name="email" control={control} render={({ field }) => (
            <TextInput {...field} placeholder="Email (optional if phone given)" size="l"
              validationState={errors.email ? 'invalid' : undefined}
              errorMessage={errors.email?.message} />
          )} />
          <Controller name="phone" control={control} render={({ field }) => (
            <TextInput {...field} placeholder="Phone (optional if email given)" size="l" />
          )} />
        </div>
        <div className="flex justify-end gap-3 mt-2">
          <Button view="flat" size="l" onClick={() => { reset(); setShowPassword(false); onClose(); }}>Cancel</Button>
          <Button type="submit" view="action" size="l" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Spin size="xs" /> : 'Create User & Store'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
