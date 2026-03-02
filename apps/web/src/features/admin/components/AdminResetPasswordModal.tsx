import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminResetPasswordSchema, type AdminResetPasswordInput } from '@repo/shared';
import { useMutation } from '@tanstack/react-query';
import { Text, Button, TextInput, Spin, Modal, Toaster } from '@gravity-ui/uikit';
import api from '../../../common/lib/api';

const toaster = new Toaster();

interface AdminResetPasswordModalProps {
  resettingUser: { id: string; name: string } | null;
  onClose: () => void;
}

export default function AdminResetPasswordModal({ resettingUser, onClose }: AdminResetPasswordModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<AdminResetPasswordInput>({
    resolver: zodResolver(AdminResetPasswordSchema),
    defaultValues: { newPassword: '' },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (d: AdminResetPasswordInput) => {
      if (!resettingUser) return;
      const { data } = await api.put(`/admin/users/${resettingUser.id}/password`, d);
      return data.data;
    },
    onSuccess: () => {
      toaster.add({
        name: 'reset-success',
        title: 'Password Reset',
        content: `Password for ${resettingUser?.name} has been reset successfully.`,
        theme: 'success',
      });
      reset();
      onClose();
    },
  });

  return (
    <Modal open={!!resettingUser} onClose={onClose}>
      <div className="p-6 flex flex-col gap-6 w-[400px]">
        <div>
          <Text variant="subheader-2" className="block font-bold">Reset Password</Text>
          <Text variant="body-2" color="secondary" className="block mt-1">
            Set a new password for <span className="text-[var(--g-color-text-primary)] font-bold">{resettingUser?.name}</span>.
            This will force logout other active sessions.
          </Text>
        </div>

        <form onSubmit={handleSubmit((d) => resetPasswordMutation.mutate(d))} className="flex flex-col gap-4">
          <Controller name="newPassword" control={control} render={({ field }) => (
            <TextInput
              {...field}
              type="password"
              placeholder="New Password *"
              size="l"
              autoFocus
              validationState={errors.newPassword ? 'invalid' : undefined}
              errorMessage={errors.newPassword?.message}
            />
          )} />

          <div className="flex justify-end gap-3 mt-2">
            <Button view="flat" size="l" onClick={onClose}>Cancel</Button>
            <Button type="submit" view="action" size="l" disabled={resetPasswordMutation.isPending}>
              {resetPasswordMutation.isPending ? <Spin size="xs" /> : 'Reset Password'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
