import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Text, Spin, Icon, Label, TextInput, Select } from '@gravity-ui/uikit';
import { Plus, FileText, Magnet, ArrowRight } from '@gravity-ui/icons';
import { useFiles } from '../hooks/useFiles';
import type { File } from '../hooks/useFiles';
import CreateFileModal from '../components/CreateFileModal';

const STATUS_THEMES: Record<string, any> = {
  CREATED: 'normal',
  IGM_RECEIVED: 'info',
  BE_FILED: 'info',
  UNDER_ASSESSMENT: 'warning',
  ASSESSMENT_COMPLETE: 'success',
  DUTY_PAID: 'success',
  DELIVERED: 'success',
  BILLED: 'info',
  ARCHIVED: 'normal',
};

function FileCard({ file }: { file: File }) {
  const navigate = useNavigate();

  // Format price (Taka)
  const taka = (file.invoiceValue).toLocaleString('en-BD', {
    style: 'currency',
    currency: file.currency,
  });

  return (
    <div
      className="bg-[var(--g-color-base-float)] border border-[var(--g-color-line-generic)] rounded-2xl p-5 flex flex-col gap-4 hover:border-[var(--g-color-line-brand)] transition-all duration-200 hover:shadow-lg group cursor-pointer"
      onClick={() => navigate(`/files/${file._id}`)}
    >
      <div className="flex justify-between items-start">
        <Label theme={STATUS_THEMES[file.status] || 'normal'} size="s">
          {file.status.replace('_', ' ')}
        </Label>
        <Text variant="body-1" color="secondary" className="font-mono text-xs">
          {file.fileNoFull}
        </Text>
      </div>

      <div className="flex flex-col gap-1">
        <Text variant="subheader-3" className="font-bold truncate" title={file.description}>
          {file.description}
        </Text>
        <div className="flex items-center gap-2">
          <Icon data={Magnet} size={14} className="text-indigo-400" />
          <Text variant="body-2" color="secondary" className="truncate">
            {file.clientId.name}
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--g-color-line-generic)]">
        <div className="flex flex-col">
          <Text variant="caption-1" color="secondary">B/L Number</Text>
          <Text variant="body-2" className="font-medium">{file.blNo}</Text>
        </div>
        <div className="flex flex-col">
          <Text variant="caption-1" color="secondary">Invoice Value</Text>
          <Text variant="body-2" className="font-medium">{taka}</Text>
        </div>
      </div>

      <div className="flex justify-end pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button view="flat-secondary" size="s" onClick={(e) => { e.stopPropagation(); navigate(`/files/${file._id}`); }}>
          Details <Icon data={ArrowRight} size={14} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}

export default function FilesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page] = useState(1);

  const { data, isLoading, isError } = useFiles({ page, limit: 50, search, status });
  const files: File[] = data?.files || [];

  return (
    <div className="flex flex-col gap-6 p-8 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Text variant="display-2" className="block font-bold">Operation Files</Text>
          <Text variant="body-2" color="secondary" className="block mt-1">
            Track customs processing and logistics for client imports/exports.
          </Text>
        </div>
        <Button view="action" size="l" onClick={() => setModalOpen(true)}>
          <Button.Icon><Plus /></Button.Icon>
          Create New File
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-[var(--g-color-base-generic-hover)] p-4 rounded-xl">
        <div className="flex-1 max-w-sm">
          <TextInput
            placeholder="Search by B/L No, File No, Description..."
            size="l"
            value={search}
            onUpdate={setSearch}
            /* startContent or similar? Gravity UI usually uses select/input custom styling */
          />
        </div>
        <Select
          placeholder="All Statuses"
          value={status ? [status] : []}
          onUpdate={(v) => setStatus(v[0] || '')}
          size="l"
          className="w-48"
        >
          <Select.Option value="">All Statuses</Select.Option>
          <Select.Option value="CREATED">Created</Select.Option>
          <Select.Option value="UNDER_ASSESSMENT">Under Assessment</Select.Option>
          <Select.Option value="ASSESSMENT_COMPLETE">Assessment Complete</Select.Option>
          <Select.Option value="DELIVERED">Delivered</Select.Option>
          <Select.Option value="BILLED">Billed</Select.Option>
        </Select>
      </div>

      {/* State rendering */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spin size="xl" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Text variant="body-2" color="danger">Failed to load files.</Text>
          <Button view="normal" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 gap-4 border border-dashed border-[var(--g-color-line-generic)] rounded-3xl">
          <div className="w-20 h-20 rounded-3xl bg-[var(--g-color-base-generic)] flex items-center justify-center">
            <Icon data={FileText} size={32} className="text-[var(--g-color-text-secondary)]" />
          </div>
          <div className="text-center">
            <Text variant="subheader-2" className="block">No operational files yet</Text>
            <Text variant="body-2" color="secondary" className="block mt-1 max-w-xs">
              Start by creating your first file to track the customs processing lifecycle.
            </Text>
          </div>
          <Button view="action" size="l" onClick={() => setModalOpen(true)}>
            <Button.Icon><Plus /></Button.Icon>
            Create New File
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((file) => (
            <FileCard key={file._id} file={file} />
          ))}
        </div>
      )}

      <CreateFileModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
