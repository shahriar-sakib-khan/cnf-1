import { Modal, Text, Card, Spin, Icon, Button } from '@gravity-ui/uikit';
import { Calculator, Clock } from '@gravity-ui/icons';
import { useFileExpenses } from '../../staff/hooks/useFinance';

interface FileExpensesModalProps {
  file: any;
  open: boolean;
  onClose: () => void;
}

export default function FileExpensesModal({ file, open, onClose }: FileExpensesModalProps) {
  const { data: expenses, isLoading } = useFileExpenses(file?._id);

  if (!file) return null;

  const totalAmount = expenses?.reduce((acc: number, e: any) => acc + e.amount, 0) || 0;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-8 flex flex-col gap-6 w-[650px] max-w-[95vw] bg-[var(--g-color-base-background)] rounded-2xl max-h-[90vh] overflow-y-auto border border-[var(--g-color-line-generic)]">
        <div className="flex justify-between items-start">
          <div>
            <Text variant="display-1" className="block font-bold">Expense History</Text>
            <div className="flex items-center gap-2 mt-1">
              <Text variant="body-2" color="secondary" className="font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded uppercase text-[12px] font-bold">
                {file.fileNoFull}
              </Text>
              <Text variant="body-2" color="secondary" className="font-medium">• {file.description || 'No description'}</Text>
            </div>
          </div>
          <div className="text-right">
             <Text color="secondary" variant="body-1" className="block uppercase text-[10px] font-bold tracking-wider opacity-60 mb-1">Total Expenses</Text>
             <Text variant="header-2" className="font-mono font-bold text-2xl text-red-500 bg-red-500/10 px-3 py-1 rounded-lg">
               ৳ {totalAmount.toLocaleString()}
             </Text>
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 flex justify-center"><Spin size="l" /></div>
        ) : (
          <div className="space-y-6">
            <div>
              <Text variant="subheader-3" className="mb-4 block font-bold text-gray-500 uppercase tracking-widest text-[10px]">Settled Expenses</Text>
              <div className="space-y-2.5">
                {expenses?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-4 rounded-2xl border border-transparent bg-[var(--g-color-base-generic)] hover:bg-[var(--g-color-base-generic-hover)] transition-all">
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 flex-shrink-0">
                         <Icon data={Calculator} size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Text variant="body-2" className="block font-bold truncate pr-2 text-indigo-400 leading-tight mb-1">
                          {item.description}
                        </Text>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                           <Text variant="caption-1" color="secondary" className="whitespace-nowrap opacity-70">
                             {new Date(item.createdAt).toLocaleDateString()}
                           </Text>
                           <span className="text-[10px] uppercase font-black text-[var(--g-color-text-hint)] opacity-30">•</span>
                           <Text variant="caption-1" className="font-bold text-orange-500 opacity-80 uppercase tracking-tight">
                             {item.category?.name || 'Expense'}
                           </Text>
                           <span className="text-[10px] uppercase font-black text-[var(--g-color-text-hint)] opacity-30">•</span>
                           <Text variant="caption-1" color="secondary" className="truncate italic opacity-60">
                             By {item.staffId?.name || 'Unknown'}
                           </Text>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Text variant="header-2" className="block font-mono font-bold text-lg text-red-400">
                        - ৳ {item.amount.toLocaleString()}
                      </Text>
                    </div>
                  </div>
                ))}

                {(!expenses || expenses.length === 0) && (
                  <Card view="outlined" className="p-12 flex flex-col items-center justify-center border-dashed border-2 opacity-50 bg-[var(--g-color-base-generic)]">
                     <Icon data={Clock} size={40} className="opacity-20 mb-3" />
                     <Text color="secondary" variant="body-2">No expenses recorded for this file yet.</Text>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-6 border-t border-[var(--g-color-line-generic)]">
          <Button view="flat-secondary" size="l" onClick={onClose} className="px-8 font-bold">Close History</Button>
        </div>
      </div>
    </Modal>
  );
}
