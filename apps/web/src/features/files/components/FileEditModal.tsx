import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Button, TextInput, Text } from '@gravity-ui/uikit';
import type { UpdateFileInput } from '@repo/shared';
import { UpdateFileSchema } from '@repo/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../common/lib/api';

interface FileEditModalProps {
  open: boolean;
  onClose: () => void;
  file: any;
}

export function FileEditModal({ open, onClose, file }: FileEditModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<UpdateFileInput>({
    resolver: zodResolver(UpdateFileSchema),
    defaultValues: {
      clientId: file.clientId?._id || file.clientId,
      blNo: file.blNo,
      blDate: new Date(file.blDate).toISOString().split('T')[0],
      invoiceValue: file.invoiceValue,
      currency: file.currency,
      hsCode: file.hsCode,
      description: file.description,
      quantity: file.quantity,
      weight: file.weight,
      vesselName: file.vesselName,
      voyageNo: file.voyageNo,
      rotationNo: file.rotationNo,
      igmNo: file.igmNo,
      igmDate: file.igmDate ? new Date(file.igmDate).toISOString().split('T')[0] : undefined,
      arrivalDate: file.arrivalDate ? new Date(file.arrivalDate).toISOString().split('T')[0] : undefined,
      exporterName: file.exporterName || '',
      copyDocsReceived: file.copyDocsReceived || false,
      originalDocsReceived: file.originalDocsReceived || false,
      boeNumber: file.boeNumber || '',
      beDate: file.beDate ? new Date(file.beDate).toISOString().split('T')[0] : undefined,
      assessmentValue: file.assessmentValue || 0,
      customsLane: file.customsLane,
      cNumber: file.cNumber || '',
      cDate: file.cDate ? new Date(file.cDate).toISOString().split('T')[0] : undefined,
      deliveryOrderStatus: file.deliveryOrderStatus || false,
      gatePassNo: file.gatePassNo || '',
      lcNumber: file.lcNumber || '',
      lcDate: file.lcDate ? new Date(file.lcDate).toISOString().split('T')[0] : undefined,
      piNumber: file.piNumber || '',
      countryOfOrigin: file.countryOfOrigin || '',
      containerType: file.containerType || '',
      packageType: file.packageType || '',
    }
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateFileInput) => api.put(`/files/${file._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file', file._id] });
      onClose();
    }
  });

  return (
    <Modal open={open} onClose={onClose}>
        <div className="p-6 w-full max-w-2xl bg-[var(--g-color-base-background)] rounded-xl">
            <Text variant="header-2" className="mb-6 block">Edit File Details</Text>
            <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <TextInput
                        label="B/L Number"
                        {...register('blNo')}
                        error={errors.blNo?.message}
                    />
                    <TextInput
                        label="B/L Date"
                        placeholder="YYYY-MM-DD"
                        {...register('blDate')}
                        error={errors.blDate?.message}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <TextInput
                        label="Exporter Name"
                        {...register('exporterName')}
                        error={errors.exporterName?.message}
                    />
                    <div className="flex items-end gap-4 pb-2">
                         <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="edit-copyDocs"
                                {...register('copyDocsReceived')}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="edit-copyDocs" className="text-xs font-bold uppercase tracking-wider text-[var(--g-color-text-secondary)]">Copy RCVD</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="edit-origDocs"
                                {...register('originalDocsReceived')}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="edit-origDocs" className="text-xs font-bold uppercase tracking-wider text-[var(--g-color-text-secondary)]">Orig RCVD</label>
                        </div>
                    </div>
                </div>

                <TextInput
                    label="Description"
                    {...register('description')}
                    error={errors.description?.message}
                />

                <div className="grid grid-cols-3 gap-4">
                    <TextInput
                        label="Invoice Value"
                        type="number"
                        {...register('invoiceValue', { valueAsNumber: true })}
                        error={errors.invoiceValue?.message}
                    />
                    <TextInput
                        label="Currency"
                        {...register('currency')}
                        error={errors.currency?.message}
                    />
                    <TextInput
                        label="HS Code"
                        {...register('hsCode')}
                        error={errors.hsCode?.message}
                    />
                </div>

                <Text variant="subheader-1" className="mt-4 border-b pb-1">Customs & Logistics</Text>
                <div className="grid grid-cols-2 gap-4">
                    <TextInput label="B/E Number" {...register('boeNumber')} />
                    <TextInput label="B/E Date" placeholder="YYYY-MM-DD" {...register('beDate')} />
                    <TextInput label="C Number" {...register('cNumber')} />
                    <TextInput label="C Date" placeholder="YYYY-MM-DD" {...register('cDate')} />
                    <TextInput 
                        label="Assessment Value" 
                        type="number" 
                        {...register('assessmentValue', { valueAsNumber: true })} 
                    />
                    <div>
                        <Text variant="caption-1" color="secondary" className="mb-1 block">Customs Lane</Text>
                        <select 
                            {...register('customsLane')}
                            className="w-full bg-[var(--g-color-base-generic-hover)] border border-[var(--g-color-line-generic)] rounded p-1 text-sm h-[28px]"
                        >
                            <option value="">Select Lane</option>
                            <option value="GREEN">Green</option>
                            <option value="YELLOW">Yellow</option>
                            <option value="RED">Red</option>
                        </select>
                    </div>
                </div>

                <Text variant="subheader-1" className="mt-4 border-b pb-1">Financial Docs & Cargo</Text>
                <div className="grid grid-cols-2 gap-4">
                    <TextInput label="L/C Number" {...register('lcNumber')} />
                    <TextInput label="L/C Date" placeholder="YYYY-MM-DD" {...register('lcDate')} />
                    <TextInput label="PI Number" {...register('piNumber')} />
                    <TextInput label="Country of Origin" {...register('countryOfOrigin')} />
                    <div>
                        <Text variant="caption-1" color="secondary" className="mb-1 block">Container Type</Text>
                        <select 
                            {...register('containerType')}
                            className="w-full bg-[var(--g-color-base-generic-hover)] border border-[var(--g-color-line-generic)] rounded p-1 text-sm h-[28px]"
                        >
                            <option value="">Select Type</option>
                            <option value="FCL">FCL (Full)</option>
                            <option value="LCL">LCL (Part)</option>
                        </select>
                    </div>
                    <div>
                        <Text variant="caption-1" color="secondary" className="mb-1 block">Package Type</Text>
                        <select 
                            {...register('packageType')}
                            className="w-full bg-[var(--g-color-base-generic-hover)] border border-[var(--g-color-line-generic)] rounded p-1 text-sm h-[28px]"
                        >
                            <option value="">Select Type</option>
                            <option value="CARTON">Carton</option>
                            <option value="ROLL">Roll</option>
                            <option value="BALE">Bale</option>
                            <option value="CASE">Case</option>
                            <option value="DRUM">Drum</option>
                            <option value="BAG">Bag</option>
                            <option value="PX">PX</option>
                            <option value="PACKAGE">Package</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                    <TextInput label="Gate Pass No" {...register('gatePassNo')} />
                    <div className="flex items-center gap-2 pt-6">
                        <input
                            type="checkbox"
                            id="edit-do-status"
                            {...register('deliveryOrderStatus')}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="edit-do-status" className="text-xs font-bold uppercase tracking-wider text-[var(--g-color-text-secondary)] tracking-tighter">D/O Status (RCVD)</label>
                    </div>
                </div>

                <Text variant="subheader-1" className="mt-4 border-b pb-1">Shipping Info</Text>
                <div className="grid grid-cols-2 gap-4">
                    <TextInput label="Vessel Name" {...register('vesselName')} />
                    <TextInput label="Voyage No" {...register('voyageNo')} />
                    <TextInput label="Rotation No" {...register('rotationNo')} />
                    <TextInput label="IGM No" {...register('igmNo')} />
                    <TextInput label="IGM Date" placeholder="YYYY-MM-DD" {...register('igmDate')} />
                    <TextInput label="Arrival Date" placeholder="YYYY-MM-DD" {...register('arrivalDate')} />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button onClick={onClose}>Cancel</Button>
                    <Button view="action" type="submit" loading={mutation.isPending}>Save Changes</Button>
                </div>
            </form>
        </div>
    </Modal>
  );
}
