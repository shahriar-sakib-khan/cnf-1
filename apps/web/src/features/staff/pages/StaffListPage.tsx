import { useState } from 'react';
import { useStaff, type User } from '../hooks/useStaff';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useAllRequests } from '../hooks/useFinance';
import { Text, Button, Card, Icon, Label, Spin, Tooltip } from '@gravity-ui/uikit';
import { Plus, ShieldCheck, At, Smartphone, CreditCard, TriangleExclamation } from '@gravity-ui/icons';
import { useMemo } from 'react';

import CreateStaffModal from '../components/CreateStaffModal';
import EditStaffModal from '../components/EditStaffModal';
import StaffFinancialsModal from '../components/StaffFinancialsModal';
import StaffResetPasswordModal from '../components/StaffResetPasswordModal';
import StaffRow from '../components/StaffRow';

export default function StaffListPage() {
  const { user } = useAuthStore();
  const { data: staff = [], isLoading } = useStaff();
  const { data: allRequests } = useAllRequests();

  // Robust matching helper to identify "Me" in any list
  const isMe = (s: User) => {
    if (!user) return false;
    const sid = String(s._id || '');
    const uid = String(user._id || '');

    return (sid && uid && sid === uid) ||
           (s.email && user.email && s.email.toLowerCase() === user.email.toLowerCase()) ||
           (s.phone && user.phone && s.phone === user.phone);
  };

  const currentUserInList = staff.find(isMe);
  const effectiveUser = currentUserInList || user;

  const pendingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (allRequests || []).forEach((r: any) => {
      if (r.status === 'PENDING' && r.staffId?._id) {
        counts[r.staffId._id] = (counts[r.staffId._id] || 0) + 1;
      }
    });
    return counts;
  }, [allRequests]);

  const [modalOpen, setModalOpen] = useState(false);
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [financialsModalUser, setFinancialsModalUser] = useState<User | null>(null);
  const [editModalUser, setEditModalUser] = useState<User | null>(null);

  if (isLoading) return <div className="p-10 flex justify-center h-full items-center"><Spin size="xl" /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Text variant="display-1" className="font-bold">Staff Management</Text>
          <Text variant="body-2" color="secondary" className="block mt-1">
            {user?.role === 'OWNER' ? "Manage your store's managers and field staff members." : 'View your store team members.'}
          </Text>
        </div>
        {user?.role === 'OWNER' && (
          <Button view="action" size="l" onClick={() => setModalOpen(true)}>
            <Icon data={Plus} className="mr-2" size={16} />
            Add Staff Member
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Owner Section (Me) */}
        <section>
          <Text variant="subheader-3" className="mb-3 block font-bold text-indigo-400 uppercase tracking-wider">Your Profile</Text>
          <Card view="raised" className="p-5 border-l-4 border-l-indigo-500 bg-indigo-500/5 transition-all border border-[var(--g-color-line-generic)]">
            <div className="flex justify-between items-center">
              <div
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => setEditModalUser(effectiveUser as User)}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Icon data={ShieldCheck} size={20} className="text-indigo-400" />
                </div>
                <div>
                  <Text variant="body-2" className="block font-bold">{(effectiveUser?.name || 'Store Owner')} (You)</Text>
                  <div className="flex gap-4 mt-0.5 text-xs text-secondary opacity-70">
                    {effectiveUser?.email && <span className="flex items-center gap-1"><Icon data={At} size={12}/> {effectiveUser.email}</span>}
                    {effectiveUser?.phone && <span className="flex items-center gap-1"><Icon data={Smartphone} size={12}/> {effectiveUser.phone}</span>}
                  </div>
                </div>
              </div>

                <div className="flex items-center gap-8">
                  {/* Wallet Status */}
                  <div
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setFinancialsModalUser(effectiveUser as User)}
                  >
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Text color="secondary" className="block text-[10px] uppercase font-bold tracking-tight mb-0.5">Wallet</Text>
                        {effectiveUser?._id && pendingCounts[effectiveUser._id] > 0 && (
                          <Tooltip content={`${pendingCounts[effectiveUser._id]} Pending Requests`}>
                             <Icon data={TriangleExclamation} size={12} className="text-amber-500 animate-pulse mb-0.5" />
                          </Tooltip>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <Icon data={CreditCard} size={12} className="text-indigo-400" />
                        <Text variant="body-2" className="font-bold">৳ {(effectiveUser?.balanceTaka ?? 0).toLocaleString()}</Text>
                      </div>
                    </div>
                    <Button view="flat-secondary" size="s">
                      <Icon data={CreditCard} size={16} />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 border-l border-[var(--g-color-line-generic)] pl-8">
                    <Label theme="info" size="m">{effectiveUser?.role}</Label>
                  </div>
                </div>
            </div>
          </Card>
        </section>

        {/* Staff List (Others) */}
        <section>
          <Text variant="subheader-3" className="mb-3 block font-bold text-[var(--g-color-text-secondary)] uppercase tracking-wider">
            Team Members {staff.filter(s => !isMe(s)).length > 0 && `(${staff.filter(s => !isMe(s)).length})`}
          </Text>

          <div className="flex flex-col flex-1 min-h-0 mb-6 bg-[var(--g-color-base-float)] rounded-2xl border border-[var(--g-color-line-generic)] overflow-hidden">
            {staff.filter(s => !isMe(s)).length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center gap-4 bg-[var(--g-color-base-generic)]">
                 <Text color="secondary">No other team members found.</Text>
                 <Button view="normal" onClick={() => setModalOpen(true)}>Add your first teammate</Button>
              </div>
            ) : (
              <>
                {/* Header Row */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-6 lg:px-12 py-4 bg-[var(--g-color-base-generic)] border-b border-[var(--g-color-line-generic)] text-xs font-bold text-[var(--g-color-text-secondary)] tracking-wider items-center uppercase">
                  <div className="col-span-1">SL</div>
                  <div className="col-span-3">Profile</div>
                  <div className="col-span-3">Contact</div>
                  <div className="col-span-3 text-right">Wallet</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                <div className="flex flex-col overflow-y-auto pb-4 custom-scrollbar">
                  {staff.filter(s => !isMe(s)).map((member, idx) => (
                    <StaffRow
                       key={member._id}
                       index={idx}
                       member={member}
                       isMe={false}
                       hasPendingAlert={pendingCounts[member._id] > 0}
                       onViewLedger={setFinancialsModalUser}
                       onEditStaff={setEditModalUser}
                       onResetPassword={setResetModalUser}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <CreateStaffModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <EditStaffModal
        member={editModalUser}
        open={!!editModalUser}
        onClose={() => setEditModalUser(null)}
      />

      <StaffFinancialsModal
         staff={financialsModalUser}
         open={!!financialsModalUser}
         onClose={() => setFinancialsModalUser(null)}
      />

      <StaffResetPasswordModal
        user={resetModalUser}
        open={!!resetModalUser}
        onClose={() => setResetModalUser(null)}
      />
    </div>
  );
}
