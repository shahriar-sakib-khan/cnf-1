import { useState } from 'react';
import { Text, Button, TextInput, Modal, Select, Checkbox } from '@gravity-ui/uikit';
import { useRequestMoney } from '../hooks/useFinance';

interface RequestMoneyModalProps {
  open: boolean;
  onClose: () => void;
  fileOptions: { value: string; content: string }[];
}

export default function RequestMoneyModal({ open, onClose, fileOptions }: RequestMoneyModalProps) {
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [isGeneral, setIsGeneral] = useState(false);

  const requestMoney = useRequestMoney();

  const handleRequestSubmit = () => {
    requestMoney.mutate({
      amount: parseInt(amount),
      purpose,
      ...(isGeneral ? {} : selectedFileId ? { fileId: selectedFileId } : {}),
    } as any, {
      onSuccess: () => {
        onClose();
        setAmount('');
        setPurpose('');
        setSelectedFileId('');
        setIsGeneral(false);
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-8 flex flex-col gap-5 w-[480px] max-w-[95vw] bg-[var(--g-color-base-background)] rounded-2xl">
        <div>
          <Text variant="display-1" className="block font-bold">Request Money</Text>
          <Text variant="body-2" color="secondary" className="block mt-1">
            Submit a request for approval. Link it to a file or mark as general.
          </Text>
        </div>

        <div className="flex flex-col gap-1.5">
          <Text variant="body-2" className="font-semibold">Amount (Taka)</Text>
          <TextInput
            type="number"
            placeholder="0"
            size="xl"
            value={amount}
            onUpdate={setAmount}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Text variant="body-2" className="font-semibold">
            Purpose / Description <span className="font-normal text-[var(--g-color-text-secondary)]">(optional)</span>
          </Text>
          <TextInput
            placeholder="e.g. Port charges for shipment"
            size="xl"
            value={purpose}
            onUpdate={setPurpose}
          />
        </div>

        <div className="flex items-center gap-3 py-1">
          <Checkbox checked={isGeneral} onUpdate={setIsGeneral} size="l" />
          <div>
            <Text variant="body-2" className="font-semibold">General Expense</Text>
            <Text variant="caption-1" color="secondary">Not linked to any specific file</Text>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Text variant="body-2" className={`font-semibold ${isGeneral ? 'opacity-40' : ''}`}>
            Linked File <span className="font-normal text-[var(--g-color-text-secondary)]">(optional)</span>
          </Text>
          <Select
            disabled={isGeneral}
            placeholder="Select a file..."
            size="xl"
            options={fileOptions}
            value={selectedFileId ? [selectedFileId] : []}
            onUpdate={(v) => setSelectedFileId(v[0] || '')}
            filterable
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button view="flat" size="l" onClick={onClose}>Cancel</Button>
          <Button
            view="action"
            size="l"
            onClick={handleRequestSubmit}
            disabled={!amount}
            loading={requestMoney.isPending}
          >
            Submit Request
          </Button>
        </div>
      </div>
    </Modal>
  );
}
