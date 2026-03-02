import { useState } from 'react';
import { Text, Button, Icon, Label, Spin } from '@gravity-ui/uikit';
import { Magnet, Receipt, Link as LinkIcon } from '@gravity-ui/icons';
import { useFileExpenses, useFileRequests } from '../../staff/hooks/useFinance';

interface FileFinancialsTabProps {
  fileId: string;
  isManager: boolean;
}

export function FileFinancialsTab({ fileId }: FileFinancialsTabProps) {
  const { data: expenses = [], isLoading: expLoading } = useFileExpenses(fileId);
  const { data: requests = [], isLoading: reqLoading } = useFileRequests(fileId);
  const [showReqs, setShowReqs] = useState(true);
  const [showExps, setShowExps] = useState(true);

  if (expLoading || reqLoading) return <div className="flex justify-center py-12"><Spin size="l" /></div>;

  const totalExpenses = expenses.reduce((s: number, e: any) => s + e.amount, 0);
  const totalRequested = requests.reduce((s: number, r: any) => s + r.amount, 0);

  // Filter and Merge
  const approvedReqs = requests
    .filter((r: any) => r.status === 'APPROVED' || r.status === 'SETTLED')
    .map((r: any) => ({ ...r, unifiedType: 'REQUISITION', date: new Date(r.createdAt) }));

  const expenseRecords = expenses.map((e: any) => ({
    ...e,
    unifiedType: 'EXPENSE',
    date: new Date(e.createdAt)
  }));

  const unifiedList = [
    ...(showReqs ? approvedReqs : []),
    ...(showExps ? expenseRecords : [])
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-4">
          <Text color="secondary" className="block text-xs uppercase font-bold tracking-wider mb-1">Total Requested</Text>
          <Text variant="display-2" className="font-bold text-indigo-300">৳ {totalRequested.toLocaleString()}</Text>
        </div>
        <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4">
          <Text color="secondary" className="block text-xs uppercase font-bold tracking-wider mb-1">Total Expenses</Text>
          <Text variant="display-2" className="font-bold text-red-300">৳ {totalExpenses.toLocaleString()}</Text>
        </div>
      </div>

      {/* Filter Toggles */}
      <div className="flex items-center gap-3 bg-[var(--g-color-base-generic-hover)] p-2 rounded-xl border border-[var(--g-color-line-generic)]">
        <button 
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${showReqs ? 'bg-indigo-500 text-white shadow-lg' : 'hover:bg-white/5 text-white/40'}`}
          onClick={() => setShowReqs(!showReqs)}
        >
          Requisitions
        </button>
        <button 
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${showExps ? 'bg-indigo-500 text-white shadow-lg' : 'hover:bg-white/5 text-white/40'}`}
          onClick={() => setShowExps(!showExps)}
        >
          Expenses & Settled Records
        </button>
      </div>

      {/* Unified Timeline */}
      <div className="flex flex-col gap-3">
        {unifiedList.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-[var(--g-color-line-generic)] rounded-2xl opacity-50">
            <Text color="secondary">No records found matching current filters.</Text>
          </div>
        ) : (
          unifiedList.map((item: any) => (
            <div 
              key={item._id} 
              className={`flex items-center justify-between px-4 py-4 rounded-xl border transition-colors hover:bg-[var(--g-color-base-generic-hover)] ${
                item.unifiedType === 'REQUISITION' 
                  ? 'bg-indigo-500/5 border-indigo-500/20' 
                  : 'bg-[var(--g-color-base-background)] border-[var(--g-color-line-generic)]'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.unifiedType === 'REQUISITION' ? 'bg-indigo-500/20' : 'bg-red-500/10'
                }`}>
                  <Icon data={item.unifiedType === 'REQUISITION' ? Magnet : Receipt} size={18} className={
                    item.unifiedType === 'REQUISITION' ? 'text-indigo-400' : 'text-red-400'
                  } />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Text variant="body-2" className="font-bold">৳ {item.amount.toLocaleString()}</Text>
                    <Label theme={item.unifiedType === 'REQUISITION' ? 'info' : 'normal'} size="s">
                      {item.unifiedType}
                    </Label>
                  </div>
                  <Text variant="caption-1" color="secondary" className="block mt-0.5">
                    {item.purpose || item.description || 'No description'} · {item.requesterId?.name || item.staffId?.name}
                  </Text>
                  <Text variant="caption-2" color="secondary" className="opacity-60 text-[10px] uppercase font-bold tracking-tighter">
                    {item.date.toLocaleString()}
                  </Text>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {item.unifiedType === 'EXPENSE' && (
                  <div className="flex items-center gap-2">
                    <Label theme="clear">{item.category?.name || 'Uncategorized'}</Label>
                    {item.receiptUrl && (
                      <Button view="flat-info" size="s" href={item.receiptUrl} target="_blank">
                        <Icon data={LinkIcon} size={16} />
                      </Button>
                    )}
                  </div>
                )}
                {item.unifiedType === 'REQUISITION' && (
                  <Label theme={item.status === 'SETTLED' ? 'success' : 'info'}>{item.status}</Label>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
