import { useState } from 'react';
import { Modal, Text, Button, TextInput, Label, Toaster } from '@gravity-ui/uikit';
import { useResetStaffPassword } from '../hooks/useStaff';

const toaster = new Toaster();

interface StaffResetPasswordModalProps {
  user: any;
  open: boolean;
  onClose: () => void;
}

export default function StaffResetPasswordModal({ user, open, onClose }: StaffResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmStep, setConfirmStep] = useState(1);
  const resetPassword = useResetStaffPassword();

  const handleResetPassword = () => {
    if (confirmStep === 1) {
      setConfirmStep(2);
    } else {
      resetPassword.mutate({
        userId: user._id,
        data: { newPassword }
      }, {
        onSuccess: () => {
          setNewPassword('');
          setConfirmStep(1);
          onClose();
          toaster.add({
            name: 'reset-success',
            title: 'Success',
            content: 'Password reset successfully',
            theme: 'success'
          });
        },
        onError: (error: any) => {
          toaster.add({
            name: 'reset-error',
            title: 'Reset Failed',
            content: error?.response?.data?.error?.message || 'Failed to reset password',
            theme: 'danger'
          });
        }
      });
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmStep(1);
    onClose();
  };

  if (!user) return null;

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="p-8 flex flex-col gap-6 w-[400px] bg-[var(--g-color-base-background)] rounded-2xl">
        <div>
          <Text variant="display-1" className="block font-bold text-red-500">Security Check</Text>
          <Text variant="body-2" color="secondary" className="block mt-1">
            {confirmStep === 1
              ? `Are you sure you want to reset password for ${user?.name}?`
              : `Enter new password for ${user?.name}.`}
          </Text>
        </div>

        {confirmStep === 2 && (
          <div className="flex flex-col gap-1.5">
            <Label>New Password</Label>
            <TextInput
              type="password"
              placeholder="At least 6 characters"
              size="l"
              value={newPassword}
              onUpdate={setNewPassword}
              autoFocus
            />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <Button view="flat" size="l" onClick={handleClose}>Cancel</Button>
          <Button
            view={confirmStep === 1 ? 'outlined-danger' : 'action'}
            size="l"
            onClick={handleResetPassword}
            disabled={confirmStep === 2 && newPassword.length < 6}
            loading={resetPassword.isPending}
          >
            {confirmStep === 1 ? 'Yes, I am sure' : 'Reset Password'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
