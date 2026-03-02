import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Text, TextInput, Select } from '@gravity-ui/uikit';
import { useSettleExpense, useMyFinancials, useExpenseCategories } from '../../staff/hooks/useFinance';
import DocumentUpload from '../../../common/components/DocumentUpload';

const FormSchema = z.object({
  amount: z.coerce.number().int().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().trim().optional(),
  receiptUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type FormData = z.infer<typeof FormSchema>;

export default function FileAddExpenseModal({
  open,
  onClose,
  fileId,
  fileNo
}: {
  open: boolean;
  onClose: () => void;
  fileId: string;
  fileNo: string;
}) {
  const [errorMsg, setErrorMsg] = useState('');
  const { mutate: settleExpense, isPending } = useSettleExpense();
  const { data: myFinancials } = useMyFinancials();
  const { data: categories = [] } = useExpenseCategories();

  const categoryOptions = categories.map(c => ({ value: c._id, content: c.name }));

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      amount: undefined,
      category: undefined,
      description: '',
      receiptUrl: '',
    },
  });

  const currentBalance = myFinancials?.balance || 0;

  const onSubmit = (data: FormData) => {
    setErrorMsg('');

    settleExpense(
      { ...data, fileId, receiptUrl: data.receiptUrl || undefined },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
        onError: (err: any) => {
          setErrorMsg(err.response?.data?.error?.message || 'Failed to record expense');
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    setErrorMsg('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-[480px] p-8 flex flex-col gap-5 bg-[var(--g-color-base-background)] rounded-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <div>
          <Text variant="display-1" className="mb-1 block font-bold">Add Direct Expense</Text>
          <Text variant="body-2" color="secondary">Record expenditure from your wallet for {fileNo}</Text>
        </div>

        <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20 flex justify-between items-center">
           <Text color="secondary" className="font-bold uppercase tracking-wider text-xs">Wallet Balance</Text>
           <Text variant="display-1" className={`font-bold ${currentBalance < 0 ? 'text-red-400' : 'text-indigo-400'}`}>
              ৳ {currentBalance.toLocaleString()}
           </Text>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <Text color="danger" variant="body-2">{errorMsg}</Text>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Text variant="body-2" className="font-semibold">Amount (৳)</Text>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <TextInput
                type="number"
                size="xl"
                placeholder="0"
                value={field.value ? String(field.value) : ''}
                onUpdate={(v) => field.onChange(v)}
                onBlur={field.onBlur}
                errorMessage={errors.amount?.message}
                validationState={errors.amount ? 'invalid' : undefined}
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Text variant="body-2" className="font-semibold">Category</Text>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <>
                <Select
                  size="xl"
                  options={categoryOptions}
                  value={field.value ? [field.value] : []}
                  onUpdate={(val) => field.onChange(val[0])}
                  placeholder="Select expense category"
                  validationState={errors.category ? 'invalid' : undefined}
                />
                {errors.category && <Text color="danger" variant="caption-1">{errors.category.message}</Text>}
              </>
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
           <Text variant="body-2" className="font-semibold">Description <span className="font-normal text-[var(--g-color-text-secondary)]">(Optional)</span></Text>
           <Controller
             name="description"
             control={control}
             render={({ field }) => (
                <TextInput
                  {...field}
                  placeholder="e.g. Paid crane charge"
                  size="xl"
                  errorMessage={errors.description?.message}
                  validationState={errors.description ? 'invalid' : undefined}
                />
             )}
           />
        </div>

        <DocumentUpload
          label="Receipt (Optional)"
          onUploadSuccess={(url) => setValue('receiptUrl', url)}
        />
        {errors.receiptUrl && <Text color="danger" variant="caption-1">{errors.receiptUrl.message}</Text>}

        <div className="flex justify-end gap-3 mt-2">
          <Button view="flat" size="l" onClick={handleClose}>Cancel</Button>
          <Button view="action" size="l" type="submit" loading={isPending}>
            Record Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}
