import { Button, Text, Icon, Label, Tooltip } from '@gravity-ui/uikit';
import { Person, Smartphone, At, MapPin, TrashBin, Pencil, FileText } from '@gravity-ui/icons';
import type { Client } from '../hooks/useClients';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { formatMoney } from '../../../common/utils/money';

const TYPE_COLORS = {
  IMPORTER: 'info',
  EXPORTER: 'success',
  BOTH: 'warning',
} as const;

interface ClientRowProps {
  index: number;
  client: Client;
  onDelete: (id: string) => void;
  onEdit: (client: Client) => void;
  onViewFiles: (client: Client) => void;
  onAddressClick?: (address: string) => void;
  activeAddressFilter?: string;
}

export default function ClientRow({ index, client, onDelete, onEdit, onViewFiles, onAddressClick, activeAddressFilter }: ClientRowProps) {
  const { user } = useAuthStore();
  const isOwner = user?.role === 'OWNER';

  return (
    <div className="group flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-4 px-6 lg:px-12 py-5 lg:py-6 items-start lg:items-center border-[var(--g-color-line-generic)] border-b last:border-b-0 hover:bg-[var(--g-color-base-generic-hover)] transition-colors">
      {/* 0. SL (Col 1) */}
      <div className="hidden lg:block lg:col-span-1">
        <Text variant="body-1" color="secondary" className="font-mono opacity-50">
          {(index + 1).toString().padStart(2, '0')}
        </Text>
      </div>

      {/* 1. Details (Cols 2-3) */}
      <div className="w-full lg:col-span-2 flex items-center justify-between lg:justify-start gap-3 min-w-0 overflow-hidden">
        <div
          className="flex items-center gap-3 min-w-0 cursor-pointer group/item overflow-hidden"
          onClick={() => onEdit(client)}
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0 group-hover/item:bg-indigo-500/20 transition-colors">
            <Icon data={Person} size={18} className="text-indigo-400" />
          </div>
          <div className="min-w-0 overflow-hidden">
            <Text variant="body-2" className="block truncate font-bold text-[14px] group-hover/item:text-indigo-400 transition-colors">
              {client.name}
            </Text>
            <div className="mt-1">
               <Label theme={TYPE_COLORS[client.type]} size="xs" className="font-bold">
                 {client.type}
               </Label>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Contact Details (Cols 4-6) */}
      <div
        className="w-full lg:col-span-3 flex flex-col justify-center min-w-0 cursor-pointer hover:opacity-70 transition-opacity overflow-hidden"
        onClick={() => onEdit(client)}
      >
        {client.phone && (
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon data={Smartphone} size={14} className="text-[var(--g-color-text-secondary)] flex-shrink-0" />
            <Text variant="body-1" className="truncate text-[13px]">{client.phone}</Text>
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
            <Icon data={At} size={14} className="text-[var(--g-color-text-secondary)] flex-shrink-0" />
            <Text variant="body-1" className="truncate text-[13px]">{client.email}</Text>
          </div>
        )}
      </div>

      {/* 3. File Stats (Cols 7-8) */}
      <div className="w-full lg:col-span-2 flex flex-col justify-center min-w-0">
        <div
          className="flex flex-col cursor-pointer group/stats"
          onClick={() => onViewFiles(client)}
        >
           <div className="flex items-center gap-1.5">
              <Icon data={FileText} size={14} className="text-indigo-400" />
              <Text variant="body-1" className="font-bold text-[13px] text-indigo-400 group-hover/stats:underline">
                {client.fileCount || 0} Files
              </Text>
           </div>
           <Text variant="body-2" className="mt-1 font-mono font-bold text-red-500 bg-red-500/5 px-1.5 py-0.5 rounded w-max">
             {formatMoney(client.totalExpenseAllFiles || 0)}
           </Text>
        </div>
      </div>

      {/* 4. Address (Cols 9-11) */}
      <div className="w-full lg:col-span-3 flex flex-col justify-center min-w-0">
         {client.address ? (
          <div
            className={`flex items-start gap-1.5 min-w-0 cursor-pointer p-1.5 rounded-lg transition-colors group/address ${activeAddressFilter === client.address ? 'bg-indigo-500/10 ring-1 ring-indigo-500/30' : 'hover:bg-indigo-500/5'}`}
            onClick={() => onAddressClick?.(client.address!)}
          >
            <Icon data={MapPin} size={14} className={`flex-shrink-0 mt-0.5 group-hover/address:text-indigo-400 ${activeAddressFilter === client.address ? 'text-indigo-400' : 'text-[var(--g-color-text-secondary)]'}`} />
            <Text variant="body-1" className={`text-[13px] line-clamp-2 group-hover/address:text-indigo-400 transition-colors ${activeAddressFilter === client.address ? 'text-indigo-400 font-bold' : 'text-[var(--g-color-text-secondary)]'}`} title={client.address}>
              {client.address}
            </Text>
          </div>
         ) : (
           <Text variant="body-1" className="text-[13px] italic text-[var(--g-color-text-secondary)] px-1.5">No address provided</Text>
         )}
      </div>

      {/* 5. Actions Desktop (Col 12) */}
      <div className="hidden lg:flex col-span-12 lg:col-span-1 items-center justify-end flex-shrink-0">
        <div className="flex bg-[var(--g-color-base-background)] rounded-full p-1 border border-[var(--g-color-line-generic)] gap-1">
           <Tooltip content="Edit Client">
             <Button view="flat-secondary" size="s" onClick={() => onEdit(client)}>
               <Icon data={Pencil} size={16} />
             </Button>
           </Tooltip>
           {isOwner && (
             <Tooltip content="Delete Client">
               <Button view="flat-danger" size="s" onClick={() => onDelete(client._id)}>
                 <Icon data={TrashBin} size={16} className="text-[var(--g-color-text-secondary)] hover:text-red-400" />
               </Button>
             </Tooltip>
           )}
        </div>
      </div>

      {/* Mobile Actions Overlay (Simple fallback) */}
      <div className="lg:hidden flex items-center gap-2 mt-2 pt-2 border-t border-[var(--g-color-line-generic)] w-full">
         <Button view="normal" size="s" onClick={() => onEdit(client)}>Edit</Button>
         <Button view="normal" size="s" onClick={() => onViewFiles(client)}>Files</Button>
         {isOwner && (
           <Button view="outlined-danger" size="s" onClick={() => onDelete(client._id)}>Delete</Button>
         )}
      </div>

    </div>
  );
}
