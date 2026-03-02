import { Modal, Text, Button, Label, Spin, Icon, Card } from '@gravity-ui/uikit';
import { useNavigate } from 'react-router-dom';
import { useClientFiles, type Client } from '../hooks/useClients';
import { FileText, ArrowUpRightFromSquare, CreditCard, LayoutCellsLarge } from '@gravity-ui/icons';
import { formatMoney } from '../../../common/utils/money';

interface ClientFilesModalProps {
  client: Client | null;
  open: boolean;
  onClose: () => void;
}

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

export default function ClientFilesModal({ client, open, onClose }: ClientFilesModalProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useClientFiles(client?._id || null);

  if (!client) return null;

  const files = data?.files || [];
  const stats = data?.stats || { totalFiles: 0, totalExpenseAllFiles: 0, activeFiles: 0 };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-10 flex flex-col gap-8 w-[950px] max-w-[95vw] bg-[var(--g-color-base-background)] rounded-3xl max-h-[90vh] overflow-hidden border border-[var(--g-color-line-generic)] shadow-2xl">
        <div className="flex justify-between items-start">
            <div>
                <Text variant="display-1" className="block font-bold text-3xl">{client.name}'s Files</Text>
                <Text variant="body-2" color="secondary" className="block mt-2 font-medium opacity-70">
                    Detailed record of all files processed under this client account.
                </Text>
            </div>
            <Button view="flat-secondary" size="l" onClick={onClose} className="px-6">Close</Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-5">
            <Card view="raised" className="p-6 bg-red-500/[0.03] border-red-500/10 flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <Icon data={CreditCard} size={24} className="text-red-400" />
                </div>
                <div>
                    <Text variant="caption-1" color="secondary" className="block uppercase font-bold tracking-widest text-[10px] opacity-50 mb-1">Total Expenses</Text>
                    <Text variant="header-2" className="font-mono font-bold text-2xl text-red-500">
                      {formatMoney(stats.totalExpenseAllFiles)}
                    </Text>
                </div>
            </Card>
            <Card view="raised" className="p-6 bg-indigo-500/[0.03] border-indigo-500/10 flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                    <Icon data={FileText} size={24} className="text-indigo-400" />
                </div>
                <div>
                    <Text variant="caption-1" color="secondary" className="block uppercase font-bold tracking-widest text-[10px] opacity-50 mb-1">Active / Total</Text>
                    <Text variant="header-2" className="font-bold text-2xl">{stats.activeFiles} <span className="text-[var(--g-color-text-hint)] text-lg">/ {stats.totalFiles}</span></Text>
                </div>
            </Card>
            <Card view="raised" className="p-6 bg-emerald-500/[0.03] border-emerald-500/10 flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <Icon data={LayoutCellsLarge} size={24} className="text-emerald-500" />
                </div>
                <div>
                    <Text variant="caption-1" color="secondary" className="block uppercase font-bold tracking-widest text-[10px] opacity-50 mb-1">Member Since</Text>
                    <Text variant="header-2" className="font-bold text-2xl">
                        {new Date(client.createdAt).toLocaleDateString('en-BD', { year: 'numeric', month: 'short' })}
                    </Text>
                </div>
            </Card>
        </div>

        <div className="mt-2 flex-1 overflow-y-auto min-h-[400px] border-t border-[var(--g-color-line-generic)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spin size="l" />
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-[var(--g-color-base-generic)] rounded-2xl border border-dashed border-[var(--g-color-line-generic)] opacity-60">
                <Text color="secondary" variant="body-2">No file records discovered for this client.</Text>
            </div>
          ) : (
            <div className="flex flex-col w-full min-w-[800px]">
              {/* Manual Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 lg:px-10 py-4 bg-[var(--g-color-base-generic)] border-b border-[var(--g-color-line-generic)] text-xs font-bold text-[var(--g-color-text-secondary)] tracking-wider items-center uppercase">
                 <div className="col-span-4 pl-4">File Number & Description</div>
                 <div className="col-span-3">Status</div>
                 <div className="col-span-2">Expenses</div>
                 <div className="col-span-2 text-right pr-10">Creation Date</div>
                 <div className="col-span-1 text-right pr-4">Actions</div>
              </div>

              {/* Manual Table Rows */}
              <div className="flex flex-col overflow-y-auto custom-scrollbar">
                {files.map((item: any) => (
                  <div
                    key={item._id}
                    className="grid grid-cols-12 gap-4 px-6 lg:px-10 py-5 items-center border-b border-[var(--g-color-line-generic)] last:border-b-0 hover:bg-[var(--g-color-base-generic-hover)] transition-colors"
                  >
                    {/* File & Details */}
                    <div className="col-span-4 pl-4 flex flex-col cursor-pointer group/file" onClick={() => { onClose(); navigate(`/files/${item._id}`); }}>
                      <Text variant="header-2" className="font-mono font-bold text-indigo-400 group-hover/file:underline">{item.fileNoFull}</Text>
                      <Text variant="body-1" color="secondary" className="truncate mt-1 text-[13px] opacity-80">{item.description || 'No description provided'}</Text>
                    </div>

                    {/* Status */}
                    <div className="col-span-3 min-w-0">
                       <Label theme={STATUS_THEMES[item.status] || 'normal'} size="m" className="font-bold py-1 px-3 rounded-lg uppercase tracking-tight text-[11px] whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                        {item.status.replace('_', ' ')}
                      </Label>
                    </div>

                    {/* Expenses */}
                    <div className="col-span-2 flex flex-col min-w-0">
                       <Text variant="header-2" className="font-mono font-bold text-red-500 whitespace-nowrap">
                        {formatMoney(item.totalExpense || 0)}
                      </Text>
                    </div>

                    {/* Date */}
                    <div className="col-span-2 text-right pr-10 min-w-0">
                       <Text variant="body-1" color="secondary" className="font-medium text-[13px] opacity-70 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 text-right pr-4">
                      <Button
                        view="flat-secondary"
                        size="m"
                        onClick={() => {
                          onClose();
                          navigate(`/files/${item._id}`);
                        }}
                        className="hover:scale-110 transition-transform"
                        title="Open File Details"
                      >
                        <Icon data={ArrowUpRightFromSquare} size={18} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
