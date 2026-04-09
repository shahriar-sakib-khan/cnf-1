import { Text, Icon, Button, Label } from '@gravity-ui/uikit';
import { FileText, ChartBarStacked, File } from '@gravity-ui/icons';
import type { Expense } from '../hooks/useFinance';
import { formatMoney } from '../../../common/utils/money';

export default function ExpenseRow({
  expense,
  onViewFileLedger,
  onViewStaffLedger,
  onFilterFile,
  onFilterClient,
  onFilterReqDate,
  onFilterStaff,
  onFilterCategory,
  onViewReceipt,
  activeFilters,
  index,
}: {
  expense: Expense;
  onViewFileLedger: (file: any) => void;
  onViewStaffLedger: (staff: any) => void;
  onFilterFile: (fileId: string) => void;
  onFilterClient: (clientId: string) => void;
  onFilterReqDate: (date: string) => void;
  onFilterStaff: (staffId: string) => void;
  onFilterCategory: (categoryId: string) => void;
  onViewReceipt: (url: string) => void;
  activeFilters: any;
  index: number;
}) {
  const filePart = expense.fileId as any;
  const staffPart = expense.staffId as any;
  const categoryPart = expense.category as any;

  const dateStr = new Date(expense.createdAt).toLocaleDateString('en-BD', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  return (
    <div
      className="group relative flex flex-col lg:grid gap-x-3 px-6 lg:px-8 py-4 border-b border-[var(--g-color-line-generic)] hover:bg-[var(--g-color-base-generic-hover)] transition-colors lg:items-center"
      style={{ gridTemplateColumns: '40px 2fr 2fr 1.5fr 1.8fr minmax(130px,1.4fr) minmax(145px,1.4fr)' }}
    >
      {/* 0. SL */}
      <div className="hidden lg:flex items-center justify-center">
        <Text variant="body-1" color="secondary" className="font-mono opacity-50 text-[12px]">
          {(index + 1).toString().padStart(2, '0')}
        </Text>
      </div>
      {/* 1. File Info */}
      <div className="min-w-0">
        <Text color="secondary" className="lg:hidden text-[10px] uppercase font-bold tracking-tight mb-1">File Info</Text>
        {filePart?._id ? (
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`font-mono font-bold text-[16px] cursor-pointer hover:underline truncate ${activeFilters?.file === filePart._id ? 'text-indigo-600' : 'text-indigo-500'}`}
                onClick={() => onFilterFile(filePart._id)}
              >
                {filePart.fileNoFull}
              </span>
              <div
                className="p-0.5 rounded cursor-pointer hover:bg-gray-500/20 text-indigo-400"
                onClick={() => onViewFileLedger({ _id: filePart._id, fileNoFull: filePart.fileNoFull })}
              >
                <Icon data={FileText} size={16} />
              </div>
            </div>
            <span
              className={`block cursor-pointer text-[15px] truncate font-medium ${activeFilters?.client === filePart.clientId?._id ? 'text-indigo-400 font-bold' : 'text-[var(--g-color-text-secondary)] hover:text-indigo-400'}`}
              onClick={() => onFilterClient(filePart.clientId?._id)}
            >
              {filePart.clientId?.name || 'Unknown Importer'}
            </span>
          </div>
        ) : (
          <Label theme={activeFilters?.file === 'GENERAL' ? 'info' : 'normal'} size="m" className="cursor-pointer" onClick={() => onFilterFile('GENERAL')}>
            General Expense
          </Label>
        )}
      </div>

      {/* 2. Date */}
      <div className="min-w-0">
        <Text color="secondary" className="lg:hidden text-[10px] uppercase font-bold tracking-tight mb-1">Date</Text>
        <span
          className={`cursor-pointer text-[16px] font-bold ${activeFilters?.reqDate === dateStr ? 'text-indigo-400' : 'hover:text-indigo-400'}`}
          onClick={() => onFilterReqDate(dateStr)}
        >
          {dateStr}
        </span>
      </div>

      {/* 3. Purpose (Category + Description overlay) */}
      <div className="min-w-0 flex flex-col pl-2">
        <Text color="secondary" className="lg:hidden text-[10px] uppercase font-bold tracking-tight mb-1">Purpose</Text>
        <Text
          variant="body-2"
          className={`font-bold text-[15px] truncate cursor-pointer hover:underline ${activeFilters?.category === categoryPart?._id ? 'text-indigo-600' : 'text-indigo-400/80'}`}
          onClick={() => categoryPart?._id && onFilterCategory(categoryPart._id)}
        >
          {categoryPart?.name || 'Uncategorized'}
        </Text>
        <Text variant="body-1" className="truncate text-[14px] text-[var(--g-color-text-secondary)]" title={expense.description}>
          {expense.description}
        </Text>
      </div>

      {/* 4. Staff */}
      <div className="min-w-0">
        <Text color="secondary" className="lg:hidden text-[10px] uppercase font-bold tracking-tight mb-1">Staff</Text>
        <div className="flex flex-col gap-0.5">
           <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`cursor-pointer text-[15px] font-semibold truncate ${activeFilters?.requester === staffPart?._id ? 'text-indigo-400' : 'hover:text-indigo-400'}`}
                onClick={() => onFilterStaff(staffPart?._id)}
              >
                {staffPart?.name || 'Unknown'}
              </span>
              <div
                className="p-1 rounded cursor-pointer hover:bg-gray-500/20 text-indigo-400 flex-shrink-0"
                onClick={() => onViewStaffLedger(staffPart)}
                title="View Staff Ledger"
              >
                <Icon data={ChartBarStacked} size={14} />
              </div>
           </div>
           {staffPart?.balanceTaka !== undefined && (
              <Text className="text-[11px] font-bold text-emerald-500/80">Wallet: {formatMoney(staffPart.balanceTaka)}</Text>
           )}
        </div>
      </div>

      {/* 5. Amount */}
      <div className="flex lg:justify-end items-center gap-2">
        <Text color="secondary" className="lg:hidden text-[10px] uppercase font-bold tracking-tight">Amount</Text>
        <Text variant="header-2" className="font-mono font-bold text-red-500 text-[18px]">
          {formatMoney(expense.amount)}
        </Text>
      </div>

      {/* 6. Receipt / Actions */}
      <div className="flex lg:justify-end items-center gap-2 text-right">
        {expense.receiptUrl ? (
          <Button view="flat-info" size="s" onClick={() => onViewReceipt(expense.receiptUrl!)} title="View Receipt">
            <Icon data={File} size={16} />
          </Button>
        ) : (
          <span className="text-[12px] text-[var(--g-color-text-hint)] opacity-60">no doc</span>
        )}
      </div>
    </div>
  );
}
