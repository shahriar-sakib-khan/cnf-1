import { useNavigate } from 'react-router-dom';
import { Button, Text, Icon, Label } from '@gravity-ui/uikit';
import { FileText, FilePlus, ChevronRight } from '@gravity-ui/icons';

interface ReportRowProps {
  index: number;
  file: any;
}

const statusMapping: Record<string, { label: string; theme: any }> = {
  CREATED:             { label: 'New', theme: 'normal' },
  IGM_RECEIVED:       { label: 'New', theme: 'normal' },
  BE_FILED:           { label: 'Invoice Sent', theme: 'info' },
  UNDER_ASSESSMENT:    { label: 'Invoice Sent', theme: 'info' },
  ASSESSMENT_COMPLETE: { label: 'Invoice Sent', theme: 'info' },
  DUTY_PAID:          { label: 'Advanced', theme: 'warning' },
  DELIVERED:           { label: 'Advanced', theme: 'warning' },
  BILLED:              { label: 'Billed', theme: 'success' },
  ARCHIVED:            { label: 'Billed', theme: 'success' },
};

export default function ReportRow({ index, file }: ReportRowProps) {
  const navigate = useNavigate();
  const displayStatus = statusMapping[file.status] || { label: file.status, theme: 'normal' };

  const dateStr = new Date(file.createdAt).toLocaleDateString('en-BD', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  return (
    <div className="group flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-4 px-6 lg:px-12 py-5 items-start lg:items-center border-b border-[var(--g-color-line-generic)] last:border-b-0 hover:bg-[var(--g-color-base-generic-hover)] transition-colors">
      {/* 0. SL */}
      <div className="hidden lg:block lg:col-span-1">
        <Text variant="body-1" color="secondary" className="font-mono opacity-50">
          {(index + 1).toString().padStart(2, '0')}
        </Text>
      </div>

      {/* 1. File & Client */}
      <div className="w-full lg:col-span-3 flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
          <Icon data={FileText} size={20} className="text-indigo-400" />
        </div>
        <div className="flex flex-col min-w-0">
          <Text variant="body-2" className="block font-bold truncate text-[14px]">
            {file.fileNoFull}
          </Text>
          <Text variant="body-1" className="truncate block mt-0.5 text-[12px] text-[var(--g-color-text-secondary)]">
            {file.clientId?.name || 'Unknown Client'}
          </Text>
        </div>
      </div>

      {/* 2. Status */}
      <div className="w-full lg:col-span-2 flex items-center min-w-0">
        <Label theme={displayStatus.theme} size="m" className="font-bold py-1 px-3 rounded-lg uppercase tracking-tight text-[11px]">
          {displayStatus.label}
        </Label>
      </div>

      {/* 3. Date */}
      <div className="w-full lg:col-span-2 flex items-center min-w-0">
        <Text variant="body-1" color="secondary" className="font-medium text-[13px]">
          {dateStr}
        </Text>
      </div>

      {/* 4. PDA */}
      <div className="w-full lg:col-span-2 flex items-center min-w-0">
        <Button
          view={file.hasInitial ? 'outlined-success' : 'normal'}
          size="m"
          onClick={() => navigate(`/reports/invoice/${file._id}/PDA`)}
          className="rounded-lg font-bold text-[12px] h-9"
        >
          <Icon data={file.hasInitial ? FileText : FilePlus} size={14} className="mr-2" />
          {file.hasInitial ? 'View PDA' : 'Make PDA'}
        </Button>
      </div>

      {/* 5. FDA */}
      <div className="w-full lg:col-span-2 flex items-center justify-end min-w-0">
        <Button
          view={file.hasFinal ? 'flat-info' : 'normal'}
          size="m"
          onClick={() => navigate(`/reports/invoice/${file._id}/FDA`)}
          className={`rounded-lg font-bold text-[12px] h-9 ${file.hasFinal ? 'border border-blue-500/30' : ''}`}
        >
          <Icon data={file.hasFinal ? FileText : FilePlus} size={14} className="mr-2" />
          {file.hasFinal ? 'View FDA' : 'Make FDA'}
          <Icon data={ChevronRight} size={14} className="ml-1 opacity-50" />
        </Button>
      </div>
    </div>
  );
}
