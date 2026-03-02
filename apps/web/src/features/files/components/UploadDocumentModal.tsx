import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Button, Text, TextInput, Select, Label as GravityLabel } from '@gravity-ui/uikit';
import api from '../../../common/lib/api';

interface UploadDocumentModalProps {
  open: boolean;
  onClose: () => void;
  fileId: string;
  defaultCategory?: 'COPY' | 'ORIGINAL';
}

export default function UploadDocumentModal({ open, onClose, fileId, defaultCategory = 'COPY' }: UploadDocumentModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('BL');
  const [category, setCategory] = useState<'COPY' | 'ORIGINAL'>(defaultCategory);

  const mutation = useMutation({
    mutationFn: (data: any) => api.post(`/files/${fileId}/documents`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file', fileId] });
      onClose();
      setName('');
      setUrl('');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;
    mutation.mutate({ name, url, type, category });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 flex flex-col gap-6 w-[450px]">
        <Text variant="header-2">Upload Document</Text>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <GravityLabel>Document Name</GravityLabel>
            <TextInput 
              value={name} 
              onUpdate={setName} 
              placeholder="e.g. Master BL, Commercial Invoice" 
              size="l"
            />
          </div>

          <div className="flex flex-col gap-2">
            <GravityLabel>Document URL (Simulated Upload)</GravityLabel>
            <TextInput 
              value={url} 
              onUpdate={setUrl} 
              placeholder="Paste Cloudinary/S3 URL" 
              size="l"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <GravityLabel>Type</GravityLabel>
              <Select value={[type]} onUpdate={(v) => setType(v[0])} size="l">
                <Select.Option value="BL">B/L</Select.Option>
                <Select.Option value="INVOICE">Invoice</Select.Option>
                <Select.Option value="PACKING_LIST">Packing List</Select.Option>
                <Select.Option value="OTHER">Other</Select.Option>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <GravityLabel>Category</GravityLabel>
              <Select value={[category]} onUpdate={(v) => setCategory(v[0] as any)} size="l">
                <Select.Option value="COPY">Copy</Select.Option>
                <Select.Option value="ORIGINAL">Original</Select.Option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button view="flat" size="l" onClick={onClose}>Cancel</Button>
            <Button view="action" size="l" type="submit" loading={mutation.isPending}>Upload</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
