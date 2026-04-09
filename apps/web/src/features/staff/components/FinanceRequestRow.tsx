import { useState } from 'react';
import { Text, Button, Icon, Label, TextInput, Tooltip } from '@gravity-ui/uikit';
import { CircleCheck, CircleXmark, Folder, Archive, Person, ArrowShapeTurnUpLeft, FileText } from '@gravity-ui/icons';
import { formatMoney } from '../../../common/utils/money';

const StatusBadge = ({ status }: { status: string }) => {
  const theme =
    status === 'APPROVED' ? 'success' :
    status === 'PENDING'  ? 'warning' :
    status === 'SETTLED'  ? 'info'    : 'danger';
  return <Label theme={theme} size="m">{status}</Label>;
};

export default function FinanceRequestRow({
  r,
  isManager,
  onApprove,
  onReject,
  onArchive,
  approving,
  rejecting,
  archiving,
  onFilterFile,
  onFilterRequester,
  onFilterApprover,
  onFilterReqDate,
  onFilterClient,
  onFilterAccDate,
  onViewStaffLedger,
  onViewFileLedger,
  activeFilters,
  onUnarchive,
  unarchiving,
  index
}: any) {
  const [grantAmount, setGrantAmount] = useState<string>(r.amount.toString());

  const reqDate = new Date(r.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
  const reqTime = new Date(r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const accDate = r.approvedAt ? new Date(r.approvedAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
  const accTime = r.approvedAt ? new Date(r.approvedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null;

  const isPending = r.status === 'PENDING';
  const isApprovedOrSettled = r.status === 'APPROVED' || r.status === 'SETTLED';
  const isRejected = r.status === 'REJECTED';

  const canArchive = isManager && (isApprovedOrSettled || isRejected) && (!r.fileId || ['DELIVERED', 'BILLED', 'ARCHIVED'].includes(r.fileId?.status));

  const isToday = r.createdAt && new Date(r.createdAt).toDateString() === new Date().toDateString();
  const todayHighlight = isToday ? 'shadow-[inset_0_0_0_1px_rgba(99,102,241,0.5)] my-0.5 rounded-sm bg-indigo-500/5' : '';

  const requesterName = r.staffId?.name || r.staffId?.email || r.staffId?.phone || 'Unknown';

  // Calculate Granted Diff
  const diff = r.grantedAmount !== undefined ? r.grantedAmount - r.amount : 0;
  const isEq = diff === 0;
  const isMore = diff > 0;

  return (
    <div
      className={`group relative flex flex-col lg:grid gap-y-4 gap-x-4 px-6 lg:px-8 py-5 border-b border-[var(--g-color-line-generic)] ${isPending && !isToday ? 'border-l-4 border-l-yellow-400 bg-yellow-500/5' : ''} ${todayHighlight} hover:bg-[var(--g-color-base-generic-hover)] transition-colors`}
      style={{ gridTemplateColumns: '40px 1.8fr 2fr 1.5fr 1.6fr 100px 140px 140px' }}
    >
      {/* 0. SL (Col 0) */}
      <div className="hidden lg:flex items-center justify-center">
        <Text variant="body-1" color="secondary" className="font-mono opacity-50 text-[12px]">
          {(index + 1).toString().padStart(2, '0')}
        </Text>
      </div>

      {/* 1. File & Importer (Col 1) */}
      <div className="w-full flex flex-col justify-center min-w-0">
        {r.fileId?.fileNoFull ? (
          <div className="flex flex-col items-start gap-1 w-fit">
            <span className={`cursor-pointer transition-colors flex items-center gap-1.5 relative z-10 ${activeFilters?.file === r.fileId?._id ? 'text-indigo-400 font-bold' : 'hover:text-indigo-400'}`} title="Filter by this file" onClick={() => onFilterFile(r.fileId?._id)}>
              <Icon data={Folder} size={18} className={`${activeFilters?.file === r.fileId?._id ? 'text-indigo-400' : 'text-indigo-300'} flex-shrink-0`} />
              <Text variant="body-2" className={`font-mono truncate text-[16px] ${activeFilters?.file === r.fileId?._id ? 'text-indigo-400 font-bold' : 'text-indigo-300 font-semibold'}`}>{r.fileId.fileNoFull}</Text>
               <Tooltip content="File Ledger">
                 <div className="p-0.5 rounded cursor-pointer hover:bg-gray-500/20 text-indigo-300 hover:text-indigo-400 transition-colors relative z-10" onClick={(e) => { e.stopPropagation(); onViewFileLedger(r.fileId); }}>
                   <Icon data={FileText} size={16} />
                 </div>
               </Tooltip>
            </span>
            <div className="flex items-center gap-1.5 w-full">
               <span className={`block cursor-pointer transition-colors relative z-10 ${activeFilters?.client === r.fileId.clientId?._id ? 'text-indigo-400 font-bold' : 'text-[var(--g-color-text-secondary)] hover:text-indigo-400'}`} onClick={() => onFilterClient(r.fileId.clientId?._id)}>
                 <Text variant="body-1" className="truncate font-medium text-[15px]" title={r.fileId.clientId?.name || 'Unknown Importer'}>
                   {r.fileId.clientId?.name || 'Unknown Importer'}
                 </Text>
               </span>
            </div>
          </div>
        ) : (
          <span className={`cursor-pointer transition-colors relative z-10 w-fit ${activeFilters?.file === 'GENERAL' ? 'opacity-100 ring-2 ring-indigo-400 rounded' : ''}`} onClick={() => onFilterFile('GENERAL')} title="Filter by general expenses">
            <Label theme={activeFilters?.file === 'GENERAL' ? 'info' : 'normal'} size="m" className="hover:opacity-80">General Expense</Label>
          </span>
        )}
      </div>

      {/* 2. Date & Purpose (Col 2) */}
      <div className="w-full flex flex-col justify-center min-w-0">
        <Text variant="body-2" className="block font-semibold truncate text-[16px]" title={r.purpose || 'No description'}>{r.purpose || <span className="italic text-[var(--g-color-text-secondary)] font-normal border-b border-dashed border-[var(--g-color-line-generic)]">None</span>}</Text>
        <div className="flex items-center gap-2 mt-1">
          <span className={`cursor-pointer transition-colors relative z-10 ${activeFilters?.reqDate === reqDate ? 'text-indigo-400 font-bold' : 'text-[var(--g-color-text-secondary)] hover:text-indigo-400'}`} title="Filter by this date" onClick={() => onFilterReqDate(reqDate)}>
            <Text variant="body-1" className="font-medium text-[15px]">{reqDate} <span className="opacity-60 text-[13px]">{reqTime}</span></Text>
          </span>
        </div>
      </div>

      {/* 3. Requester details (Col 3) */}
      <div className="w-full flex flex-col justify-center">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`cursor-pointer transition-colors text-[16px] relative z-10 line-clamp-1 ${activeFilters?.requester === r.staffId?._id ? 'text-indigo-400 font-bold' : 'font-semibold hover:text-indigo-400'}`} title="Filter by requester" onClick={() => onFilterRequester(r.staffId?._id)}>
            {requesterName}
          </span>
          {r.staffId && (
            <Tooltip content="Staff Ledger">
              <div className="p-0.5 rounded cursor-pointer hover:bg-gray-500/20 text-gray-500 hover:text-indigo-400 transition-colors relative z-10" onClick={() => onViewStaffLedger(r.staffId)}>
                 <Icon data={Person} size={14} />
              </div>
            </Tooltip>
          )}
        </div>
        {r.staffId?.balanceTaka !== undefined && (
          <Text variant="body-1" color="secondary" className="block mt-0.5 font-bold text-[14px]">
            Wallet: {formatMoney(r.staffId.balanceTaka)}
          </Text>
        )}
      </div>

      {/* 4. Acceptor details (Col 4) */}
      <div className="w-full flex flex-col justify-center overflow-hidden">
        {r.approvedBy ? (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`cursor-pointer transition-colors text-[16px] relative z-10 font-semibold truncate max-w-[130px] ${activeFilters?.approver === r.approvedBy._id ? 'text-indigo-400 font-bold' : 'hover:text-indigo-400'}`} title={r.approvedBy.name} onClick={() => onFilterApprover(r.approvedBy._id)}>
                {r.approvedBy.name}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase flex-shrink-0">{r.approvedBy.role}</span>
            </div>
            <span className={`cursor-pointer transition-colors relative z-10 mt-0.5 block ${activeFilters?.accDate === accDate ? 'text-indigo-400 font-bold' : 'text-[var(--g-color-text-secondary)] hover:text-indigo-400'}`} title={`${accDate} ${accTime}`} onClick={() => onFilterAccDate(accDate)}>
              <span className="text-[14px] font-medium whitespace-nowrap">{accDate}</span>
              <span className="text-[12px] ml-1 opacity-70">{accTime}</span>
            </span>
          </>
        ) : (
          <span className="text-[var(--g-color-text-secondary)] italic text-[15px]">—</span>
        )}
      </div>

      {/* 5. Requested Amount (Col 5) */}
      <div className="w-full flex flex-col items-end justify-center border-t lg:border-t-0 border-[var(--g-color-line-generic)] pt-4 lg:pt-0 mt-2 lg:mt-0">
        <span className="lg:hidden text-[9px] font-bold text-[var(--g-color-text-secondary)] uppercase mb-0.5 pr-2">Requested</span>
        <Text variant="header-2" className="font-bold text-indigo-300 leading-none pr-1" title={formatMoney(r.amount)}>
          {formatMoney(r.amount, false)}
        </Text>
      </div>

      {/* 6. Granted Amount (Col 6) */}
      <div className="w-full flex flex-col items-end justify-center">
        <span className="lg:hidden text-[9px] font-bold text-[var(--g-color-text-secondary)] uppercase mb-0.5">Granted</span>
        {isManager && isPending ? (
          <div className="flex items-center gap-2 relative z-10 justify-end">
            <TextInput
              type="number"
              size="m"
              value={grantAmount}
              onUpdate={setGrantAmount}
              className="!w-[100px] font-bold text-right"
              placeholder="Amount"
            />
            {grantAmount && Number(grantAmount) !== r.amount && (
              <Label theme={Number(grantAmount) > r.amount ? 'success' : 'danger'} size="xs" className="font-bold font-mono flex-shrink-0">
                {Number(grantAmount) > r.amount ? '+' : ''}{formatMoney(Number(grantAmount) - r.amount, false)}
              </Label>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Text variant="header-2" className="block font-bold leading-none text-emerald-300" title={r.grantedAmount !== undefined ? formatMoney(r.grantedAmount) : 'N/A'}>
              {r.grantedAmount !== undefined ? formatMoney(r.grantedAmount, false) : '—'}
            </Text>
            {r.grantedAmount !== undefined && (
              <Label theme={isEq ? 'normal' : isMore ? 'success' : 'danger'} size="xs" className="font-bold font-mono flex-shrink-0">
                {isEq ? 0 : isMore ? `+${formatMoney(diff, false)}` : formatMoney(diff, false)}
              </Label>
            )}
          </div>
        )}
      </div>

      {/* 7. Status & Actions (Col 7) */}
      <div className="w-full flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center border-t lg:border-t-0 border-[var(--g-color-line-generic)] pt-4 lg:pt-0 mt-2 lg:mt-0 flex-shrink-0 relative">

        {/* Manager Pending Actions */}
        {isManager && isPending ? (
          <div className="flex flex-row gap-1 relative z-10">
            <Button view="outlined-success" size="s" width="max" onClick={() => onApprove(r._id, Number(grantAmount) * 100)} loading={approving}>
              <Icon data={CircleCheck} size={14} className="mr-1" /> Accept
            </Button>
            <Button view="outlined-danger" size="s" width="max" onClick={() => onReject(r._id)} loading={rejecting} title="Reject">
              <Icon data={CircleXmark} size={14} />
            </Button>
          </div>
        ) : (
          <StatusBadge status={r.status} />
        )}

        {/* Manager Archive Action (Hover only) */}
        {canArchive && !r.isArchived && (
          <div className="hidden group-hover:block absolute right-[-10px] z-10 bg-[var(--g-color-base-background)] rounded-full p-1 shadow-md border border-[var(--g-color-line-generic)]">
             <Tooltip content={r.fileId ? "Archive request (File is cleared)" : "Archive request"}>
              <Button view="flat-secondary" size="s" onClick={() => onArchive(r._id)} loading={archiving}>
                <Icon data={Archive} size={16} className="text-[var(--g-color-text-secondary)] hover:text-indigo-400" />
              </Button>
             </Tooltip>
          </div>
        )}

        {/* Manager Unarchive Action (Always visible in archived mode) */}
        {isManager && r.isArchived && (
          <div className="absolute right-[-10px] z-10 bg-[var(--g-color-base-background)] rounded-full p-1 border border-[var(--g-color-line-generic)]">
             <Tooltip content="Bring back from archive">
              <Button view="flat-secondary" size="s" onClick={() => onUnarchive(r._id)} loading={unarchiving}>
                <Icon data={ArrowShapeTurnUpLeft} size={16} className="text-[var(--g-color-text-secondary)] hover:text-indigo-400" />
              </Button>
             </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}
