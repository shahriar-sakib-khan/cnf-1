import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateClientSchema, type UpdateClientInput } from '@repo/shared';
import {
  Modal,
  Text,
  Button,
  TextInput,
  Select,
  Label,
  Alert,
  TextArea,
} from '@gravity-ui/uikit';
import { useUpdateClient, type Client } from '../hooks/useClients';
import { useEffect } from 'react';

interface EditClientModalProps {
  client: Client | null;
  open: boolean;
  onClose: () => void;
}

export default function EditClientModal({ client, open, onClose }: EditClientModalProps) {
  const updateClient = useUpdateClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateClientInput>({
    resolver: zodResolver(UpdateClientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      type: 'IMPORTER',
    },
  });

  // Reset form when client changes
  useEffect(() => {
    if (client) {
      reset({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        type: client.type,
      });
    }
  }, [client, reset]);

  const onSubmit = (data: UpdateClientInput) => {
    if (!client) return;
    updateClient.mutate({ id: client._id, data }, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  if (!client) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-8 flex flex-col gap-6 w-[450px] max-w-[95vw] bg-[var(--g-color-base-background)] rounded-2xl"
      >
        <div>
          <Text variant="display-1" className="block font-bold">Edit Client</Text>
          <Text variant="body-2" color="secondary" className="block mt-1">
            Update contact and business details for {client.name}.
          </Text>
        </div>

        {updateClient.isError && (
          <Alert
            theme="danger"
            view="filled"
            title="Update Failed"
            message={
              // @ts-expect-error axios error
              updateClient.error?.response?.data?.error?.message || 'Failed to update client'
            }
          />
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Client Name</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextInput
                   {...field}
                   placeholder="e.g. Acme Corp"
                   size="l"
                   validationState={errors.name ? 'invalid' : undefined}
                   errorMessage={errors.name?.message}
                />
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
                    placeholder="contact@acme.com"
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
            <Label>Client Type</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  value={[field.value as string]}
                  onUpdate={(v) => field.onChange(v[0])}
                  size="l"
                >
                  <Select.Option value="IMPORTER">Importer</Select.Option>
                  <Select.Option value="EXPORTER">Exporter</Select.Option>
                  <Select.Option value="BOTH">Both</Select.Option>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Address</Label>
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <TextArea
                  {...field}
                  placeholder="Full office address"
                  size="l"
                  rows={3}
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
            loading={updateClient.isPending}
            disabled={!isDirty}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
