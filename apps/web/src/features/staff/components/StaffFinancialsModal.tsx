import { Modal, Text, Card, Spin, Icon, Button } from '@gravity-ui/uikit';
import { Calculator, Clock, TriangleExclamation, Person } from '@gravity-ui/icons';
import { useStaffFinancials } from '../hooks/useFinance';
import { useNavigate } from 'react-router-dom';
import { formatMoney } from '../../../common/utils/money';

interface StaffFinancialsModalProps {
  staff: any;
  open: boolean;
  onClose: () => void;
}

export default function StaffFinancialsModal({ staff, open, onClose }: StaffFinancialsModalProps) {
  const { data, isLoading } = useStaffFinancials(staff?._id);
  const navigate = useNavigate();

  if (!staff) return null;

  const movements = [
    ...(data?.requests || [])
      .filter((r: any) => r.status === 'APPROVED' || r.status === 'SETTLED')
      .map((r: any) => ({ ...r, _type: 'CREDIT' as const })),
    ...(data?.expenses || [])
      .map((e: any) => ({ ...e, _type: 'DEBIT' as const }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingRequests = (data?.requests || [])
    .filter((r: any) => r.status === 'PENDING');

  const totalGranted = movements
    .filter(m => m._type === 'CREDIT')
    .reduce((acc: number, r: any) => acc + (r.grantedAmount ?? r.amount), 0);

  const totalExpenses = movements
    .filter(m => m._type === 'DEBIT')
    .reduce((acc: number, e: any) => acc + e.amount, 0);

  const ledgerBalance = totalGranted - totalExpenses;

  const handleGoToPending = () => {
    onClose();
    navigate('/finance');
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-8 flex flex-col gap-6 w-[650px] max-w-[95vw] bg-[var(--g-color-base-background)] rounded-2xl max-h-[90vh] overflow-y-auto border border-[var(--g-color-line-generic)]">
        <div className="flex justify-between items-start">
          <div>
            <Text variant="display-1" className="block font-bold">Financial History</Text>
            <Text variant="body-2" color="secondary" className="block mt-1 font-medium">{staff.name}'s Ledger</Text>
          </div>
          <div className="text-right flex flex-col items-end">
             <Text color="secondary" variant="body-1" className="block uppercase text-[10px] font-bold tracking-wider opacity-60 mb-1">Calculated Wallet</Text>
             <Text variant="header-2" className={`font-mono font-bold text-2xl px-3 py-1 rounded-lg ${ledgerBalance < 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
               {formatMoney(ledgerBalance)}
             </Text>
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 flex justify-center"><Spin size="l" /></div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card view="raised" className="p-5 bg-emerald-500/5 border-emerald-500/20 shadow-sm">
                 <Text color="secondary" className="block mb-2 text-[11px] font-bold uppercase opacity-80">Total Granted (+)</Text>
                 <Text variant="header-1" className="font-bold text-emerald-400 text-3xl">{formatMoney(totalGranted)}</Text>
              </Card>
              <Card view="raised" className="p-5 bg-red-500/5 border-red-500/20 shadow-sm">
                 <Text color="secondary" className="block mb-2 text-[11px] font-bold uppercase opacity-80">Total Expenses (-)</Text>
                 <Text variant="header-1" className="font-bold text-red-400 text-3xl">{formatMoney(totalExpenses)}</Text>
              </Card>
            </div>

            {/* Pending Alert */}
            {pendingRequests.length > 0 && (
              <div
                className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors group"
                onClick={handleGoToPending}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-500 text-black">
                    <Icon data={TriangleExclamation} size={16} />
                  </div>
                  <div>
                    <Text className="block font-bold text-amber-500 text-[15px]">
                      {pendingRequests.length} Money Request{pendingRequests.length > 1 ? 's' : ''} Pending
                    </Text>
                    <Text variant="caption-2" color="secondary">Click to view in financial requisitions</Text>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button view="flat-warning" size="s">View Requisitions</Button>
                </div>
              </div>
            )}

            {/* Recent Ledger Entries */}
            <div>
              <Text variant="subheader-3" className="mb-4 block font-bold text-gray-500 uppercase tracking-widest text-[10px]">Movement History</Text>
              <div className="space-y-2.5">
                {movements
                  .slice(0, 30)
                  .map((item: any, i) => {
                    const isCredit = item._type === 'CREDIT';
                    return (
                      <div key={i} className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${isCredit ? 'bg-emerald-500/[0.04] border-emerald-500/10 hover:bg-emerald-500/[0.08]' : 'bg-[var(--g-color-base-generic)] border-transparent hover:bg-[var(--g-color-base-generic-hover)]'}`}>
                        <div className="flex items-center gap-4 min-w-0 pr-4">
                          <div className={`p-2.5 rounded-xl flex-shrink-0 ${isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                             <Icon data={isCredit ? Person : Calculator} size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <Text variant="body-2" className="block font-bold truncate pr-2 text-indigo-400 leading-tight mb-1">
                              {item.fileId?.fileNoFull ? item.fileId.fileNoFull : (isCredit ? 'General Requisition' : 'Direct Expense')}
                            </Text>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                               <Text variant="caption-1" color="secondary" className="whitespace-nowrap opacity-70">
                                 {new Date(item.createdAt).toLocaleDateString()}
                               </Text>
                               <span className="text-[10px] uppercase font-black text-[var(--g-color-text-hint)] opacity-30">•</span>
                               <Text variant="caption-1" className={`font-bold ${isCredit ? 'text-emerald-500' : 'text-orange-500'} opacity-80 uppercase tracking-tight`}>
                                 {isCredit ? (item.approvedBy?.name || 'Requisition') : (item.category?.name || 'Expense')}
                               </Text>
                               <span className="text-[10px] uppercase font-black text-[var(--g-color-text-hint)] opacity-30">•</span>
                               <Text variant="caption-1" color="secondary" className="truncate italic opacity-60" title={isCredit ? item.purpose : item.description}>
                                 {isCredit ? item.purpose : item.description}
                               </Text>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <Text variant="header-2" className={`block font-mono font-bold text-lg ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isCredit ? '+' : '-'} {formatMoney(item.grantedAmount ?? item.amount)}
                          </Text>
                        </div>
                      </div>
                    );
                })}
                {movements.length === 0 && (
                  <Card view="outlined" className="p-12 flex flex-col items-center justify-center border-dashed border-2 opacity-50 bg-[var(--g-color-base-generic)]">
                     <Icon data={Clock} size={40} className="opacity-20 mb-3" />
                     <Text color="secondary" variant="body-2">No financial movements found for this staff.</Text>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-6 border-t border-[var(--g-color-line-generic)]">
          <Button view="flat-secondary" size="l" onClick={onClose} className="px-8 font-bold">Close Ledger</Button>
        </div>
      </div>
    </Modal>
  );
}
