import { Modal, Text, Card, Spin, Icon, Label, Button } from '@gravity-ui/uikit';
import { Link as LinkIcon } from '@gravity-ui/icons';
import { useFileExpenses, useFileRequests } from '../../staff/hooks/useFinance';
import { formatMoney } from '../../../common/utils/money';

interface FileFinancialsModalProps {
  fileItem: any;
  open: boolean;
  onClose: () => void;
  context?: 'requisitions' | 'expenses';
}

export default function FileFinancialsModal({ fileItem, open, onClose, context = 'requisitions' }: FileFinancialsModalProps) {
  const { data: expenses, isLoading: expLoading } = useFileExpenses(fileItem?._id || '');
  const { data: requests, isLoading: reqLoading } = useFileRequests(fileItem?._id || '');

  const isLoading = expLoading || reqLoading;

  if (!fileItem) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-8 flex flex-col gap-6 w-[600px] max-w-[95vw] bg-[var(--g-color-base-background)] rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center bg-[var(--g-color-base-generic)] -m-8 p-6 pb-4 mb-4 border-b border-[var(--g-color-line-generic)]">
          <div>
            <Text variant="display-1" className="block font-bold">
               File {context === 'requisitions' ? 'Requisitions' : 'Expenses'}
            </Text>
            <Text variant="body-2" color="secondary" className="block mt-1 font-mono">{fileItem.fileNoFull}</Text>
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 flex justify-center"><Spin size="l" /></div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {context === 'requisitions' ? (
                <Card view="raised" className="p-4 bg-indigo-500/5 border-indigo-500/20 col-span-2">
                   <Text color="secondary" className="block mb-1 text-xs uppercase font-bold tracking-wider">Total Advanced</Text>
                   <Text variant="header-2" className="font-bold text-indigo-400">
                     {formatMoney(requests?.filter((r: any) => r.status !== 'REJECTED' && r.status !== 'PENDING').reduce((acc: number, r: any) => acc + (r.grantedAmount || r.amount), 0))}
                   </Text>
                </Card>
              ) : (
                <Card view="raised" className="p-4 bg-emerald-500/5 border-emerald-500/20 col-span-2">
                   <Text color="secondary" className="block mb-1 text-xs uppercase font-bold tracking-wider">Total Expenses</Text>
                   <Text variant="header-2" className="font-bold text-emerald-500">
                     {formatMoney(expenses?.reduce((acc: number, e: any) => acc + e.amount, 0))}
                   </Text>
                </Card>
              )}
            </div>

            <div>
              <Text variant="subheader-3" className="mb-3 block font-bold text-gray-500 uppercase tracking-wider">Ledger Records</Text>
              <div className="space-y-4">
                {(context === 'requisitions' ? (requests || []) : (expenses || []))
                  .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((item: any, i: number) => {
                    const isExpense = 'category' in item;
                    const dateStr = new Date(item.createdAt).toLocaleDateString();
                    const title = isExpense ? item.description : (item.purpose || 'No description');
                    const staffName = item.staffId?.name || item.requesterId?.name || 'Unknown';
                    const amount = isExpense ? item.amount : (item.grantedAmount !== undefined ? item.grantedAmount : item.amount);

                    return (
                      <div key={i} className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--g-color-line-generic)] bg-[var(--g-color-base-float)]">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-1">
                             <Text variant="body-2" className="block font-bold text-[15px]">{title}</Text>
                             <div className="flex gap-2 items-center text-xs">
                               <Text color="secondary">{dateStr}</Text>
                               <span>•</span>
                               {isExpense ? (
                                  <Text color="secondary">Spent by <span className="font-bold text-emerald-400/90">{staffName}</span></Text>
                               ) : (
                                  <Text color="secondary">Requested by <span className="font-bold text-indigo-400/90">{staffName}</span></Text>
                               )}
                             </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <Text variant="header-2" className={`block font-bold ${isExpense ? 'text-red-400' : 'text-indigo-400'}`}>
                              {formatMoney(amount)}
                            </Text>
                            {!isExpense && item.status && (
                               <Label size="s" theme={item.status === 'APPROVED' ? 'success' : item.status === 'PENDING' ? 'warning' : 'normal'}>{item.status}</Label>
                            )}
                          </div>
                        </div>

                        {/* Additional Details */}
                        <div className="flex justify-between items-end border-t border-[var(--g-color-line-generic)] pt-3 mt-1">
                           <div className="flex flex-col gap-1 text-xs">
                             {isExpense ? (
                               <div className="flex items-center gap-2">
                                   <Label theme="normal" size="s">{item.category?.name || 'Uncategorized'}</Label>
                               </div>
                             ) : (
                               <div className="text-[var(--g-color-text-secondary)] flex flex-col gap-0.5">
                                 {item.approvedBy ? (
                                    <span>Approved by <span className="font-medium text-[var(--g-color-text-primary)]">{item.approvedBy.name}</span></span>
                                 ) : (
                                    <span>Approval Pending</span>
                                 )}
                               </div>
                             )}
                           </div>

                           {/* Action / Receipt */}
                           {isExpense && (
                              item.receiptUrl ? (
                                <Button view="outlined-info" size="s" href={item.receiptUrl} target="_blank">
                                  <Icon data={LinkIcon} size={16} className="mr-1.5" /> View Receipt
                                </Button>
                              ) : (
                                <Text variant="caption-1" color="secondary" className="italic">No receipt attached</Text>
                              )
                           )}
                        </div>
                      </div>
                    );
                })}
                {((context === 'requisitions' && !requests?.length) || (context === 'expenses' && !expenses?.length)) && (
                   <Text color="secondary" className="block text-center p-8 border border-dashed rounded-xl border-[var(--g-color-line-generic)]">
                     No {context} recorded for this file.
                   </Text>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button view="action" size="l" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
