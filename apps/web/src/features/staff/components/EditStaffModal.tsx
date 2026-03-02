import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateStaffSchema, type UpdateStaffInput } from '@repo/shared';
import {
  Modal,
  Text,
  Button,
  TextInput,
  Select,
  Label,
  Alert,
  Switch,
} from '@gravity-ui/uikit';
import { useUpdateStaff, type User } from '../hooks/useStaff';
import { useEffect } from 'react';

interface EditStaffModalProps {
  member: User | null;
  open: boolean;
  onClose: () => void;
}

export default function EditStaffModal({ member, open, onClose }: EditStaffModalProps) {
  const updateStaff = useUpdateStaff();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateStaffInput>({
    resolver: zodResolver(UpdateStaffSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'STAFF',
      isActive: true,
    },
  });

  // Reset form when member changes
  useEffect(() => {
    if (member) {
      reset({
        name: member.name || '',
        email: member.email || '',
        phone: member.phone || '',
        role: member.role,
        isActive: member.isActive,
      } as UpdateStaffInput);
    }
  }, [member, reset]);

  const onSubmit = (data: UpdateStaffInput) => {
    if (!member) return;
    updateStaff.mutate({ userId: member._id, data }, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  if (!member) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-8 flex flex-col gap-6 w-[450px] max-w-[95vw] bg-[var(--g-color-base-background)] rounded-2xl"
      >
        <div>
          <Text variant="display-1" className="block font-bold">Edit Staff Member</Text>
          <Text variant="body-2" color="secondary" className="block mt-1">
            Update account details for {member.name || 'this staff member'}.
          </Text>
        </div>

        {updateStaff.isError && (
          <Alert
            theme="danger"
            view="filled"
            title="Update Failed"
            message={
              // @ts-expect-error axios error
              updateStaff.error?.response?.data?.error?.message || 'Failed to update account'
            }
          />
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Full Name</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextInput {...field} placeholder="e.g. John Doe" size="l" />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    placeholder="john@example.com"
                    size="l"
                    validationState={errors.email ? 'invalid' : undefined}
                    errorMessage={errors.email?.message}
                  />
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Phone</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    placeholder="017XXXXXXXX"
                    size="l"
                    validationState={errors.phone ? 'invalid' : undefined}
                    errorMessage={errors.phone?.message}
                  />
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  value={[field.value as string]}
                  onUpdate={(v) => field.onChange(v[0])}
                  size="l"
                  disabled={member.role === 'OWNER'} // Cannot change owner role via this modal for safety
                >
                  <Select.Option value="STAFF">Staff</Select.Option>
                  <Select.Option value="MANAGER">Manager</Select.Option>
                  <Select.Option value="OWNER">Owner</Select.Option>
                </Select>
              )}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--g-color-base-generic)]">
            <div className="flex flex-col gap-0.5">
              <Label>Account Status</Label>
              <Text variant="body-1" color="secondary">Allow user to login</Text>
            </div>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch
                    checked={field.value}
                    onUpdate={(v) => field.onChange(v)}
                    disabled={member.role === 'OWNER'} // Cannot deactivate owner
                />
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button view="flat" size="l" onClick={onClose}>Cancel</Button>
          <Button
            view="action"
            size="l"
            type="submit"
            loading={updateStaff.isPending}
            disabled={!isDirty}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
