import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateFileSchema, type CreateFileInput } from '@repo/shared';
import {
  Modal, Button, TextInput, Select, Text, Toaster, Spin,
  Label, Icon
} from '@gravity-ui/uikit';
import { Plus } from '@gravity-ui/icons';
import { useClients } from '../../clients/hooks/useClients';
import { useCreateFile } from '../hooks/useFiles';
import CreateClientModal from '../../clients/components/CreateClientModal';

const toaster = new Toaster();

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateFileModal({ open, onClose }: Props) {
  const { data: clientData, isLoading: clientsLoading, refetch: refetchClients } = useClients(1, 100);
  const createFile = useCreateFile();
  const [clientModalOpen, setClientModalOpen] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateFileInput>({
    resolver: zodResolver(CreateFileSchema) as any,
    defaultValues: {
      clientId: '',
      blNo: '',
      blDate: new Date().toISOString().split('T')[0],
      description: '',
      invoiceValue: 0,
      currency: 'USD',
      exporterName: '',
      copyDocsReceived: false,
      originalDocsReceived: false,
    } as any,
  });

  const onSubmit = (data: any) => {
    createFile.mutate(data as CreateFileInput, {
      onSuccess: () => {
        toaster.add({
          name: 'create-file-success',
          title: 'Success',
          content: 'File created successfully',
          theme: 'success',
        });
        reset();
        onClose();
      },
    });
  };

  const handleClientUpdate = (vals: string[], fieldChange: (val: string) => void) => {
    const val = vals[0];
    if (val === 'ADD_NEW') {
      setClientModalOpen(true);
    } else {
      fieldChange(val);
    }
  };

  const clients = clientData?.data || [];

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <div className="p-8 flex flex-col gap-6 w-[500px] max-w-[95vw] bg-[var(--g-color-base-background)] rounded-2xl max-h-[90vh] overflow-y-auto">
          <div>
            <Text variant="display-1" className="block font-bold">Create new file</Text>
            <Text variant="body-2" color="secondary" className="block mt-1">
              Start with the basic shipment details.
            </Text>
          </div>

          {createFile.isError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
              {/* @ts-expect-error axios error */}
              {createFile.error?.response?.data?.error?.message || 'Failed to create file'}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label>Client *</Label>
              <Controller name="clientId" control={control} render={({ field }) => (
                <Select
                  value={[field.value]}
                  onUpdate={(v) => handleClientUpdate(v, field.onChange)}
                  placeholder="Select Client"
                  size="l"
                  disabled={clientsLoading}
                  validationState={errors.clientId ? 'invalid' : undefined}
                  errorMessage={errors.clientId?.message}
                >
                  {clients.map((c: any) => (
                    <Select.Option key={c._id} value={c._id}>{c.name}</Select.Option>
                  ))}
                  <Select.Option value="ADD_NEW">
                    <div className="text-indigo-400 font-bold flex items-center py-1">
                      <Icon data={Plus} size={14} className="mr-2" />
                      Add New Client
                    </div>
                  </Select.Option>
                </Select>
              )} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>B/L Number *</Label>
              <Controller name="blNo" control={control} render={({ field }) => (
                <TextInput {...field} placeholder="e.g. MSCU1234567" size="l"
                  validationState={errors.blNo ? 'invalid' : undefined}
                  errorMessage={errors.blNo?.message} />
              )} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>B/L Date *</Label>
              <Controller name="blDate" control={control} render={({ field }) => (
                <TextInput {...field} size="l"
                  validationState={errors.blDate ? 'invalid' : undefined}
                  errorMessage={errors.blDate?.message} />
              )} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Exporter Name</Label>
              <Controller name="exporterName" control={control} render={({ field }) => (
                <TextInput {...field} placeholder="e.g. ABC Global Inc." size="l" />
              )} />
            </div>

            <div className="flex gap-6 mt-2">
              <div className="flex items-center gap-2">
                <Controller name="copyDocsReceived" control={control} render={({ field }) => (
                  <input
                    type="checkbox"
                    id="copyDocs"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                )} />
                <label htmlFor="copyDocs" className="text-sm font-medium">Copy Docs RCVD</label>
              </div>

              <div className="flex items-center gap-2">
                <Controller name="originalDocsReceived" control={control} render={({ field }) => (
                  <input
                    type="checkbox"
                    id="originalDocs"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                )} />
                <label htmlFor="originalDocs" className="text-sm font-medium">Original Docs RCVD</label>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Controller name="description" control={control} render={({ field }) => (
                <TextInput {...field} placeholder="Brief goods description" size="l"
                  validationState={errors.description ? 'invalid' : undefined}
                  errorMessage={errors.description?.message} />
              )} />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button view="flat" size="xl" onClick={onClose}>Cancel</Button>
              <Button type="submit" view="action" size="xl" disabled={createFile.isPending}>
                {createFile.isPending ? <Spin size="xs" /> : 'Create File'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <CreateClientModal
        open={clientModalOpen}
        onClose={() => {
          setClientModalOpen(false);
          refetchClients();
        }}
      />
    </>
  );
}
