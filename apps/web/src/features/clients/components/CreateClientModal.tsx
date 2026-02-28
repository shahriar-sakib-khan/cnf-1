import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateClientSchema } from '@repo/shared';
import type { CreateClientInput } from '@repo/shared';
import { useCreateClient } from '../hooks/useClients';
import { Modal, Card, Text, Button, TextInput, Select, Spin } from '@gravity-ui/uikit';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateClientModal({ open, onClose }: Props) {
  const createClient = useCreateClient();
  const [error, setError] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateClientInput>({
    resolver: zodResolver(CreateClientSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      type: 'IMPORTER'
    }
  });

  const onSubmit = (data: CreateClientInput) => {
    setError('');
    createClient.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
      onError: (err: any) => {
        setError(err.response?.data?.error?.message || 'Failed to create client');
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Card view="raised" style={{ width: '500px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Text variant="header-2">Add New Client</Text>

        {error && <Text color="danger">{error}</Text>}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <Text variant="body-2">Client Name <span style={{ color: 'red' }}>*</span></Text>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  placeholder="e.g. Acme Corp"
                  validationState={errors.name ? 'invalid' : undefined}
                  errorMessage={errors.name?.message}
                />
              )}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
               <Text variant="body-2">Phone</Text>
               <Controller
                 name="phone"
                 control={control}
                 render={({ field }) => <TextInput {...field} />}
               />
            </div>
            <div style={{ flex: 1 }}>
               <Text variant="body-2">Email</Text>
               <Controller
                 name="email"
                 control={control}
                 render={({ field }) => (
                   <TextInput
                     {...field}
                     type="email"
                     validationState={errors.email ? 'invalid' : undefined}
                     errorMessage={errors.email?.message}
                   />
                 )}
               />
            </div>
          </div>

          <div>
            <Text variant="body-2">Address</Text>
            <Controller
              name="address"
              control={control}
              render={({ field }) => <TextInput {...field} />}
            />
          </div>

          <div>
            <Text variant="body-2">Client Type <span style={{ color: 'red' }}>*</span></Text>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  value={[field.value]}
                  onUpdate={(vals) => field.onChange(vals[0])}
                  width="max"
                >
                  <Select.Option value="IMPORTER">Importer</Select.Option>
                  <Select.Option value="EXPORTER">Exporter</Select.Option>
                  <Select.Option value="BOTH">Both</Select.Option>
                </Select>
              )}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button onClick={onClose} view="flat" size="l">Cancel</Button>
            <Button type="submit" view="action" size="l" disabled={createClient.isPending}>
              {createClient.isPending ? <Spin size="xs" /> : 'Create Client'}
            </Button>
          </div>
        </form>
      </Card>
    </Modal>
  );
}
