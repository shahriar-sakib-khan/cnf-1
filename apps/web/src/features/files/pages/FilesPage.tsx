import { useState } from 'react';
import { Button, Text, Spin, Icon, TextInput, Select } from '@gravity-ui/uikit';
import { Plus, FileText, Xmark } from '@gravity-ui/icons';
import { useFiles, type OperationFile } from '../hooks/useFiles';
import CreateFileModal from '../components/CreateFileModal';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useFileTableStore } from '../stores/useFileTableStore';
import { LayoutColumns, Check } from '@gravity-ui/icons';
import { Popover } from '@gravity-ui/uikit';

import FileRow from '../components/FileRow';

export default function FilesPage() {
  const { user } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [page] = useState(1);

  const { data, isLoading, isError } = useFiles({ page, limit: 50, search, status, clientId });
  const files: OperationFile[] = data?.files || [];

  const { columns, toggleColumn } = useFileTableStore();
  const canCreate = user?.role === 'OWNER' || user?.role === 'MANAGER';
  const visibleColumns = columns.filter(c => c.visible);

  const getColSpan = (id: string) => {
    if (id === 'sl') return 'lg:col-span-1';
    if (id === 'fileNo') return 'lg:col-span-2';
    if (id === 'importer') return 'lg:col-span-2';
    if (id === 'exporter') return 'lg:col-span-1';
    if (id === 'blNo') return 'lg:col-span-1';
    if (id === 'status') return 'lg:col-span-1';
    if (id === 'dates') return 'lg:col-span-1';
    if (id === 'expenses') return 'lg:col-span-1';
    if (id === 'docs') return 'lg:col-span-1';
    if (id === 'actions') return 'lg:col-span-1';
    return 'lg:col-span-1';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-8 pb-6">
        <div>
          <Text variant="display-2" className="block font-bold leading-tight">Operation Files</Text>
          <Text variant="body-2" color="secondary" className="block mt-1">
            {clientId && clientName ? (
              <>Filtering files for <span className="font-bold text-indigo-400">{clientName}</span></>
            ) : (
              'Track customs processing and logistics for client imports/exports.'
            )}
          </Text>
        </div>
        <div className="flex gap-3">
          <Popover
            content={(
              <div className="p-4 flex flex-col gap-2 min-w-[200px]">
                <Text variant="subheader-1" className="mb-2 px-2">Visible Columns</Text>
                {columns.map(col => (
                  <div
                    key={col.id}
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-[var(--g-color-base-generic-hover)] rounded-lg cursor-pointer transition-colors"
                    onClick={() => toggleColumn(col.id)}
                  >
                    <Text variant="body-2">{col.label}</Text>
                    {col.visible && <Icon data={Check} size={14} className="text-indigo-400" />}
                  </div>
                ))}
              </div>
            )}
            placement="bottom-end"
          >
            <Button view="flat" size="l" title="Customise Columns">
              <Button.Icon><Icon data={LayoutColumns} /></Button.Icon>
              Columns
            </Button>
          </Popover>
          {canCreate && (
            <Button view="action" size="l" onClick={() => setModalOpen(true)} className="flex-shrink-0">
              <Button.Icon><Plus /></Button.Icon>
              Create New File
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 px-6 pb-4">
        <div className="flex-1 min-w-[200px] max-w-md">
          <TextInput
            placeholder="Search by B/L No, File No, Description..."
            size="l"
            value={search}
            onUpdate={setSearch}
          />
        </div>
        <Select
          placeholder="All Statuses"
          value={status ? [status] : []}
          onUpdate={(v) => setStatus(v[0] || '')}
          size="l"
          className="w-52"
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
      <div className="flex-1 overflow-y-auto">
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
          <div className="flex flex-col items-center justify-center h-80 gap-4 mx-6 mt-4 border border-[var(--g-color-line-generic)] bg-[var(--g-color-base-generic)] rounded-3xl">
            <div className="w-20 h-20 rounded-3xl bg-[var(--g-color-base-float)] shadow-sm border border-[var(--g-color-line-generic)] flex items-center justify-center">
              <Icon data={FileText} size={32} className="text-[var(--g-color-text-secondary)]" />
            </div>
            <div className="text-center">
              <Text variant="subheader-2" className="block font-bold">No operation files found</Text>
              <Text variant="body-2" color="secondary" className="block mt-1 max-w-xs">
                Start by creating your first file to track the customs processing lifecycle.
              </Text>
            </div>
            {canCreate && (
              <Button view="action" size="l" onClick={() => setModalOpen(true)}>
                <Button.Icon><Plus /></Button.Icon>
                Create New File
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 mx-6 mb-6 mt-4 bg-[var(--g-color-base-float)] rounded-2xl border border-[var(--g-color-line-generic)] overflow-hidden">
            {/* Standardized Header Row */}
            <div className={`hidden lg:grid grid-cols-12 gap-4 px-6 lg:px-12 py-4 bg-[var(--g-color-base-generic)] border-b border-[var(--g-color-line-generic)] text-xs font-bold text-[var(--g-color-text-secondary)] tracking-wider items-center uppercase`}>
               {visibleColumns.map(col => (
                 <div key={col.id} className={`${getColSpan(col.id)} flex items-center gap-2 ${col.id === 'expenses' || col.id === 'actions' ? 'justify-end' : ''}`}>
                   {col.label}
                   {col.id === 'importer' && clientId && (
                     <Button view="flat-danger" size="s" onClick={() => { setClientId(''); setClientName(''); }} className="h-5 w-5 p-0 rounded-full ml-1">
                       <Icon data={Xmark} size={12} />
                     </Button>
                   )}
                   {col.id === 'status' && status && (
                     <Button view="flat-danger" size="s" onClick={() => setStatus('')} className="h-5 w-5 p-0 rounded-full ml-1">
                       <Icon data={Xmark} size={12} />
                     </Button>
                   )}
                 </div>
               ))}
              </div>

            <div className="flex flex-col overflow-y-auto pb-4 custom-scrollbar">
              {files.map((file, idx) => (
                <FileRow
                  key={file._id}
                  index={idx}
                  file={file}
                  onStatusClick={(s: string) => setStatus((prev) => (prev === s ? '' : s))}
                  onClientClick={(id: string, name: string) => {
                    if (clientId === id) {
                      setClientId('');
                      setClientName('');
                    } else {
                      setClientId(id);
                      setClientName(name);
                    }
                  }}
                  activeFilters={{ status, clientId }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateFileModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
