import { Button, Text, Icon, Label, Tooltip } from '@gravity-ui/uikit';
import { Person, ShieldCheck, At, Smartphone, CreditCard, Pencil, Key, TriangleExclamation } from '@gravity-ui/icons';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import type { User } from '../hooks/useStaff';
import { formatMoney } from '../../../common/utils/money';

interface StaffRowProps {
  index: number;
  member: User;
  isMe: boolean;
  hasPendingAlert?: boolean;
  onViewLedger: (user: User) => void;
  onEditStaff: (user: User) => void;
  onResetPassword?: (user: User) => void;
}

export default function StaffRow({ index, member, isMe, hasPendingAlert, onViewLedger, onEditStaff, onResetPassword }: StaffRowProps) {
  const currentUser = useAuthStore((state) => state.user);
  const currentRole = currentUser?.role;

  const isOwner = member.role === 'OWNER';
  const isManager = member.role === 'MANAGER';

  // Permissions
  const canEdit = currentRole === 'OWNER' || currentRole === 'MANAGER';
  const canResetPassword = currentRole === 'OWNER';

  // Choose icon based on me/role
  const UserIcon = isMe ? ShieldCheck : Person;
  const iconBaseColor = isMe ? 'text-indigo-400' : isOwner ? 'text-indigo-400' : isManager ? 'text-blue-400' : 'text-[var(--g-color-text-secondary)]';
  const iconBg = isMe ? 'bg-indigo-500/10' : isOwner ? 'bg-indigo-500/10' : isManager ? 'bg-blue-500/10' : 'bg-[var(--g-color-base-generic)]';
  const rowBorder = isMe ? 'border-l-4 border-l-indigo-500 bg-indigo-500/5' : 'border-b border-[var(--g-color-line-generic)] last:border-b-0 hover:bg-[var(--g-color-base-generic-hover)]';

  const handleEditClick = () => {
    if (canEdit) onEditStaff(member);
  };

  return (
    <div className={`group flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-4 px-6 lg:px-12 py-4 lg:py-5 items-start lg:items-center transition-colors ${rowBorder}`}>
      {/* 0. SL (Col 1) */}
      <div className="hidden lg:block lg:col-span-1">
        <Text variant="body-1" color="secondary" className="font-mono opacity-50">
          {(index + 1).toString().padStart(2, '0')}
        </Text>
      </div>

      {/* 1. Profile Details (Cols 2-4) */}
      <div className="w-full lg:col-span-3 flex items-center justify-between lg:justify-start gap-4 min-w-0">
        <div className="flex items-center gap-4 min-w-0 cursor-pointer" onClick={handleEditClick}>
          <div className={`w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center ${iconBg}`}>
            <Icon data={UserIcon} size={20} className={iconBaseColor} />
          </div>
          <div className="min-w-0">
            <Text variant="body-2" className={`block truncate text-[14px] ${isMe ? 'font-bold' : 'font-semibold'}`}>
              {member.name || (isOwner ? 'Store Owner' : 'Unnamed Staff')} {isMe && '(You)'}
            </Text>
            <div className="mt-1 flex items-center gap-2">
              <Label theme={isOwner ? 'info' : isManager ? 'info' : 'normal'} size="xs" className="font-bold">
                 {member.role}
              </Label>
            </div>
          </div>
        </div>

        {/* Mobile Actions Overlay */}
        <div className="lg:hidden flex items-center gap-1 flex-shrink-0 relative">
            <Button view="flat-secondary" size="s" title="View Ledger" onClick={() => onViewLedger(member)}>
               <Icon data={CreditCard} size={16} />
            </Button>
            {canEdit && (
              <Button view="flat-secondary" size="s" title="Edit Staff" onClick={() => onEditStaff(member)}>
                <Icon data={Pencil} size={16} />
              </Button>
            )}
            {onResetPassword && canResetPassword && !isOwner && (
              <Button view="flat-secondary" size="s" title="Reset Password" onClick={() => onResetPassword(member)}>
                <Icon data={Key} size={16} />
              </Button>
            )}
        </div>
      </div>

      {/* 2. Contact Details (Cols 5-7) */}
      <div className="w-full lg:col-span-3 flex flex-col justify-center min-w-0 cursor-pointer" onClick={handleEditClick}>
        {member.phone && (
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon data={Smartphone} size={14} className="text-[var(--g-color-text-secondary)] flex-shrink-0" />
            <Text variant="body-1" className="truncate text-[13px]">{member.phone}</Text>
          </div>
        )}
        {member.email && (
          <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
            <Icon data={At} size={14} className="text-[var(--g-color-text-secondary)] flex-shrink-0" />
            <Text variant="body-1" className="truncate text-[13px]">{member.email}</Text>
          </div>
        )}
      </div>

       {/* 3. Wallet Balance (Cols 8-10) */}
       <div
          className="w-full lg:col-span-3 flex items-center justify-between lg:justify-end min-w-0 border-t lg:border-t-0 border-[var(--g-color-line-generic)] pt-4 lg:pt-0 mt-2 lg:mt-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onViewLedger(member)}
       >
          <div className="lg:hidden flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] uppercase font-bold text-[var(--g-color-text-secondary)] tracking-tight">Current Wallet</span>
            {hasPendingAlert && <Icon data={TriangleExclamation} size={10} className="text-amber-500 animate-pulse" />}
          </div>
          <div className="text-right">
            <div className="hidden lg:flex items-center gap-1.5 justify-end mb-1">
               <Text color="secondary" className="text-[10px] uppercase font-bold tracking-tight">Current Wallet</Text>
               {hasPendingAlert && (
                 <Tooltip content="Has Pending Requests">
                   <Icon data={TriangleExclamation} size={12} className="text-amber-500 animate-pulse" />
                 </Tooltip>
               )}
            </div>
            <div className="flex items-center gap-1.5 justify-end">
               <Icon data={CreditCard} size={14} className="text-indigo-400" />
               <Text variant="body-2" className="font-bold text-[14px]">{formatMoney(member.balanceTaka ?? 0)}</Text>
            </div>
         </div>
       </div>

      {/* 4. Actions Desktop (Cols 11-12) */}
      <div className="hidden lg:flex lg:col-span-2 items-center justify-end gap-1 flex-shrink-0 relative">
         <div className="flex gap-1 items-center bg-[var(--g-color-base-background)] rounded-full p-1 border border-[var(--g-color-line-generic)]">
            {canEdit && (
              <Button view="flat-secondary" size="s" title="Edit Staff" onClick={() => onEditStaff(member)}>
                <Icon data={Pencil} size={16} />
              </Button>
            )}
            {onResetPassword && canResetPassword && !isOwner && (
              <Button view="flat-secondary" size="s" title="Reset Password" onClick={() => onResetPassword(member)}>
                <Icon data={Key} size={16} />
              </Button>
            )}
         </div>
      </div>

    </div>
  );
}
