import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateStaffSchema, type CreateStaffInput } from '@repo/shared';
import {
  Modal,
  Text,
  Button,
  TextInput,
  Select,
  Label,
  Icon,
  Alert,
} from '@gravity-ui/uikit';
import { Eye, EyeSlash, TriangleExclamation } from '@gravity-ui/icons';
import { useCreateStaff } from '../hooks/useStaff';

interface CreateStaffModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateStaffModal({ open, onClose }: CreateStaffModalProps) {
  const createStaff = useCreateStaff();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateStaffInput>({
    resolver: zodResolver(CreateStaffSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'STAFF',
      creatorPassword: '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = (data: CreateStaffInput) => {
    createStaff.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-8 flex flex-col gap-6 w-[450px] max-w-[95vw] bg-[var(--g-color-base-background)] rounded-2xl"
      >
        <div>
          <Text variant="display-1" className="block font-bold">Add Staff Member</Text>
          <Text variant="body-2" color="secondary" className="block mt-1">
            Create a new account for your store staff or manager.
          </Text>
        </div>

        {createStaff.isError && (
          <Alert
            theme="danger"
            view="filled"
            title="Update Failed"
            message={
              // @ts-expect-error axios error
              createStaff.error?.response?.data?.error?.message || 'Failed to create account'
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
            <Label>Password</Label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  size="l"
                  validationState={errors.password ? 'invalid' : undefined}
                  errorMessage={errors.password?.message}
                  endContent={
                    <Button
                      view="flat-secondary"
                      size="s"
                      className="mr-1"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <Icon data={showPassword ? EyeSlash : Eye} size={16} />
                    </Button>
                  }
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  value={[field.value]}
                  onUpdate={(v) => field.onChange(v[0])}
                  size="l"
                >
                  <Select.Option value="STAFF">Staff</Select.Option>
                  <Select.Option value="MANAGER">Manager</Select.Option>
                  <Select.Option value="OWNER">Owner</Select.Option>
                </Select>
              )}
            />
          </div>

          {selectedRole === 'OWNER' && (
             <div className="space-y-4 pt-2 border-t border-[var(--g-color-line-generic)]">
                <Alert
                  theme="warning"
                  view="outlined"
                  icon={<Icon data={TriangleExclamation} />}
                  message="Warning: Creating a new Owner will grant full access to this store and all its financial data."
                />
                <div className="flex flex-col gap-1.5">
                  <Label theme="danger">Your Current Password (Confirm)</Label>
                  <Controller
                    name="creatorPassword"
                    control={control}
                    render={({ field }) => (
                      <TextInput
                        {...field}
                        type="password"
                        placeholder="Verify your authorization"
                        size="l"
                        validationState={errors.creatorPassword ? 'invalid' : undefined}
                        errorMessage={errors.creatorPassword?.message}
                      />
                    )}
                  />
                </div>
             </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button view="flat" size="l" onClick={onClose}>Cancel</Button>
          <Button view="action" size="l" type="submit" loading={createStaff.isPending}>
            {selectedRole === 'OWNER' ? 'Create Owner' : 'Add Staff Member'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
