import { useState } from 'react';
import { Modal, Button, Text, Select, TextArea } from '@gravity-ui/uikit';
import { FileStatusEnum } from '@repo/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../common/lib/api';

interface FileStageModalProps {
  open: boolean;
  onClose: () => void;
  file: any;
}

const STAGES = FileStatusEnum.options;

export function FileStageModal({ open, onClose, file }: FileStageModalProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>(file.status);
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: (data: { status: string; statusNotes: string }) =>
        api.put(`/files/${file._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file', file._id] });
      onClose();
    }
  });

  return (
    <Modal open={open} onClose={onClose}>
        <div className="p-6 w-[400px] bg-[var(--g-color-base-background)] rounded-xl">
            <Text variant="header-2" className="mb-6 block">Process File Stage</Text>

            <div className="flex flex-col gap-6">
                <div>
                    <Text variant="body-1" className="mb-2 block">Next Stage</Text>
                    <Select
                        value={[status]}
                        onUpdate={(val) => setStatus(val[0])}
                        width="max"
                    >
                        {STAGES.map(s => (
                            <Select.Option key={s} value={s}>{s.replace('_', ' ')}</Select.Option>
                        ))}
                    </Select>
                </div>

                <div>
                    <Text variant="body-1" className="mb-2 block">Status Notes</Text>
                    <TextArea
                        placeholder="Add a comment about this transition..."
                        value={notes}
                        onUpdate={setNotes}
                        rows={3}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <Button onClick={onClose}>Cancel</Button>
                    <Button view="action" onClick={() => mutation.mutate({ status, statusNotes: notes })} loading={mutation.isPending}>
                        Confirm Transition
                    </Button>
                </div>
            </div>
        </div>
    </Modal>
  );
}
