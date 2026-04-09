import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Text, Icon, Label, Tooltip } from '@gravity-ui/uikit';
import { FileText, ArrowRight } from '@gravity-ui/icons';
import { useFileTableStore } from '../stores/useFileTableStore';
import { type OperationFile } from '../hooks/useFiles';
import { formatMoney } from '../../../common/utils/money';
import FileAddExpenseModal from './FileAddExpenseModal';

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

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Created',
  IGM_RECEIVED: 'IGM Received',
  BE_FILED: 'BE Filed',
  UNDER_ASSESSMENT: 'Under Assessment',
  ASSESSMENT_COMPLETE: 'Assessment Complete',
  DUTY_PAID: 'Duty Paid',
  DELIVERED: 'Delivered',
  BILLED: 'Billed',
  ARCHIVED: 'Archived',
};

interface FileRowProps {
  index: number;
  file: OperationFile;
  onStatusClick?: (status: string) => void;
  onClientClick?: (clientId: string, clientName: string) => void;
  activeFilters?: { status?: string; clientId?: string };
}

export default function FileRow({ index, file, onStatusClick, onClientClick, activeFilters }: FileRowProps) {
  const navigate = useNavigate();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const { columns } = useFileTableStore();
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

  const formattedDate = new Date(file.createdAt).toLocaleDateString('en-BD', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <>
    <div
      className="group flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-4 px-6 lg:px-12 py-5 lg:py-6 items-start lg:items-center border-[var(--g-color-line-generic)] border-b last:border-b-0 hover:bg-[var(--g-color-base-generic-hover)] transition-colors text-[13px]"
    >
      {visibleColumns.map(col => {
        const span = getColSpan(col.id);

        if (col.id === 'sl') return (
          <div key={col.id} className={`hidden lg:block ${span}`}>
            <Text variant="body-1" color="secondary" className="font-mono opacity-50">
              {(index + 1).toString().padStart(2, '0')}
            </Text>
          </div>
        );

        if (col.id === 'fileNo') return (
          <div key={col.id} className={`w-full ${span} flex items-center gap-4 min-w-0`}>
            <div className="flex items-center gap-3 min-w-0 cursor-pointer group/file" onClick={() => navigate(`/files/${file._id}`)}>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 group-hover/file:bg-indigo-500/20 transition-colors">
                <Icon data={FileText} size={16} className="text-indigo-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <Text variant="body-2" className="block font-mono font-bold text-indigo-400 group-hover/file:underline">
                  {file.fileNoFull}
                </Text>
                <Text variant="caption-1" className="truncate opacity-60">
                   {file.description || 'No description'}
                </Text>
              </div>
            </div>
          </div>
        );

        if (col.id === 'importer') return (
          <div key={col.id} className={`w-full ${span} min-w-0`}>
             <Text
                variant="body-1"
                className={`truncate font-bold hover:text-indigo-400 cursor-pointer ${activeFilters?.clientId === file.clientId?._id ? 'text-indigo-500' : ''}`}
                onClick={() => onClientClick?.(file.clientId?._id || '', file.clientId?.name || '')}
              >
                {file.clientId?.name ?? 'Unknown Client'}
              </Text>
          </div>
        );

        if (col.id === 'exporter') return (
          <div key={col.id} className={`w-full ${span} min-w-0`}>
             <Text variant="body-1" className="truncate opacity-80" title={file.exporterName}>
                {file.exporterName || '—'}
             </Text>
          </div>
        );

        if (col.id === 'blNo') return (
          <div key={col.id} className={`w-full ${span} min-w-0`}>
             <Text variant="body-1" className="font-mono opacity-60">
                {file.blNo || '—'}
             </Text>
          </div>
        );

        if (col.id === 'status') return (
          <div key={col.id} className={`w-full ${span} flex items-center min-w-0`}>
             <div
                className={`cursor-pointer transition-transform hover:scale-105 active:scale-95 ${activeFilters?.status === file.status ? 'ring-2 ring-indigo-500/50 rounded-lg' : ''}`}
                onClick={() => onStatusClick?.(file.status)}
              >
                <Label theme={STATUS_THEMES[file.status] || 'normal'} size="m" className="font-bold py-1 px-3 rounded-lg uppercase tracking-tight text-[10px]">
                  {STATUS_LABELS[file.status] ?? file.status}
                </Label>
              </div>
          </div>
        );

        if (col.id === 'dates') return (
          <div key={col.id} className={`w-full ${span} flex flex-col justify-center min-w-0`}>
             <Text variant="body-1" color="secondary" className="font-medium">
                {formattedDate}
             </Text>
          </div>
        );

        if (col.id === 'expenses') return (
          <div key={col.id} className={`w-full ${span} flex flex-col items-end justify-center gap-1 min-w-0`}>
             <Tooltip content="Add Expense">
                <Text
                    variant="body-2"
                    className="font-mono font-bold text-red-500 cursor-pointer hover:underline"
                    onClick={() => setIsExpenseModalOpen(true)}
                >
                    {formatMoney(file.totalExpenses)}
                </Text>
             </Tooltip>
          </div>
        );

        if (col.id === 'docs') return (
           <div key={col.id} className={`w-full ${span} flex gap-2 min-w-0`}>
              <Tooltip content="Copy Documents Received">
                 <Label theme={file.copyDocsReceived ? 'success' : 'normal'} size="m" className="w-8 justify-center opacity-80">C</Label>
              </Tooltip>
              <Tooltip content="Original Documents Received">
                 <Label theme={file.originalDocsReceived ? 'success' : 'normal'} size="m" className="w-8 justify-center opacity-80">O</Label>
              </Tooltip>
           </div>
        );

        if (col.id === 'actions') return (
          <div key={col.id} className={`hidden lg:flex ${span} items-center justify-end gap-1`}>
             <Button view="flat-secondary" size="s" onClick={() => navigate(`/files/${file._id}`)}>
                <Icon data={ArrowRight} size={16} />
             </Button>
          </div>
        );

        return null;
      })}
    </div>

    {isExpenseModalOpen && (
      <FileAddExpenseModal
        open={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        fileId={file._id}
        fileNo={file.fileNoFull}
      />
    )}
    </>
  );
}
