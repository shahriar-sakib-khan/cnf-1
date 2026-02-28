import { useState } from 'react';
import { useStaff, useResetStaffPassword } from '../hooks/useStaff';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useStaffFinancials } from '../hooks/useFinance';
import {
  Text,
  Button,
  Card,
  Icon,
  Label,
  Spin,
  TextInput,
  Modal,
} from '@gravity-ui/uikit';
import {
  Plus, Person, ShieldCheck, Key, At, Smartphone,
  CreditCard, Clock, ChevronRight, Calculator
} from '@gravity-ui/icons';
import CreateStaffModal from '../components/CreateStaffModal';

// ── Financial History Modal ──────────────────────────────
function StaffFinancialsModal({ staff, open, onClose }: { staff: any, open: boolean, onClose: () => void }) {
  const { data, isLoading } = useStaffFinancials(staff?._id);

  if (!staff) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-8 flex flex-col gap-6 w-[600px] max-w-[95vw] bg-[var(--g-color-base-background)] rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <div>
            <Text variant="display-1" className="block font-bold">Financial History</Text>
            <Text variant="body-2" color="secondary" className="block mt-1">{staff.name}'s Ledger</Text>
          </div>
          <div className="text-right">
             <Text color="secondary" variant="body-1" className="block">Current Balance</Text>
             <Text variant="header-2" className="text-indigo-400 font-bold">৳ {staff.balanceTaka?.toLocaleString()}</Text>
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 flex justify-center"><Spin size="l" /></div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card view="raised" className="p-4 bg-indigo-500/5 border-indigo-500/20">
                 <Text color="secondary" className="block mb-1">Total Given</Text>
                 <Text variant="header-1" className="font-bold">
                   ৳ {data?.requests.filter(r => r.status !== 'REJECTED' && r.status !== 'PENDING').reduce((acc, r) => acc + r.amount, 0).toLocaleString()}
                 </Text>
              </Card>
              <Card view="raised" className="p-4 bg-emerald-500/5 border-emerald-500/20">
                 <Text color="secondary" className="block mb-1">Total Settled</Text>
                 <Text variant="header-1" className="font-bold">
                   ৳ {data?.expenses.reduce((acc, e) => acc + e.amount, 0).toLocaleString()}
                 </Text>
              </Card>
            </div>

            <div>
              <Text variant="subheader-3" className="mb-3 block font-bold text-gray-500 uppercase tracking-wider">Recent Activity</Text>
              <div className="space-y-2">
                {[...(data?.requests || []), ...(data?.expenses || [])]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 10)
                  .map((item: any, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-[var(--g-color-base-generic-hover)]">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${'category' in item ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                           <Icon data={'category' in item ? Calculator : Clock} size={14} />
                        </div>
                        <div>
                          <Text variant="body-2" className="block font-medium">
                            {'purpose' in item ? item.purpose : item.description}
                          </Text>
                          <Text variant="caption-1" color="secondary">
                            {new Date(item.createdAt).toLocaleDateString()} • {'status' in item ? 'Advance Request' : item.category}
                          </Text>
                        </div>
                      </div>
                      <div className="text-right">
                        <Text variant="body-2" className={`block font-bold ${'category' in item ? 'text-red-400' : 'text-emerald-400'}`}>
                          {'category' in item ? '-' : '+'} ৳ {item.amount.toLocaleString()}
                        </Text>
                        {'status' in item && <Label size="s" theme={item.status === 'APPROVED' ? 'success' : item.status === 'PENDING' ? 'warning' : 'normal'}>{item.status}</Label>}
                      </div>
                    </div>
                ))}
                {(!data?.requests.length && !data?.expenses.length) && <Text color="secondary" className="block text-center p-4">No financial activity recorded.</Text>}
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

export default function StaffListPage() {
  const { user } = useAuthStore();
  const { data: staff = [], isLoading } = useStaff();
  const resetPassword = useResetStaffPassword();

  const [modalOpen, setModalOpen] = useState(false);
  const [resetModalUser, setResetModalUser] = useState<any>(null);
  const [financialsModalUser, setFinancialsModalUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmStep, setConfirmStep] = useState(1);

  const handleResetPassword = () => {
     if (confirmStep === 1) {
       setConfirmStep(2);
     } else {
       resetPassword.mutate({
         userId: resetModalUser._id,
         data: { newPassword }
       }, {
         onSuccess: () => {
           setResetModalUser(null);
           setNewPassword('');
           setConfirmStep(1);
           alert('Password reset successfully');
         }
       });
     }
  };

  if (isLoading) return <div className="p-10 flex justify-center h-full items-center"><Spin size="xl" /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Text variant="display-1" className="font-bold">Staff Management</Text>
          <Text variant="body-2" color="secondary" className="block mt-1">
            Manage your store's managers and field staff members.
          </Text>
        </div>
        <Button view="action" size="l" onClick={() => setModalOpen(true)}>
          <Icon data={Plus} className="mr-2" size={16} />
          Add Staff Member
        </Button>
      </div>

      <div className="space-y-6">
        {/* Owner Section (Me) */}
        <section>
          <Text variant="subheader-3" className="mb-3 block font-bold text-indigo-400 uppercase tracking-wider">Your Profile</Text>
          <Card view="raised" className="p-5 border-l-4 border-l-indigo-500 bg-indigo-500/5 transition-all border border-[var(--g-color-line-generic)]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Icon data={ShieldCheck} size={20} className="text-indigo-400" />
                </div>
                <div>
                  <Text variant="body-2" className="block font-bold">{user?.name} (You)</Text>
                  <div className="flex gap-4 mt-0.5 text-xs text-secondary opacity-70">
                    {user?.email && <span className="flex items-center gap-1"><Icon data={At} size={12}/> {user.email}</span>}
                    {user?.phone && <span className="flex items-center gap-1"><Icon data={Smartphone} size={12}/> {user.phone}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                {/* Wallet Status */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Text color="secondary" className="block text-[10px] uppercase font-bold tracking-tight mb-0.5">Wallet</Text>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Icon data={CreditCard} size={12} className="text-indigo-400" />
                      <Text variant="body-2" className="font-bold">৳ {user?.balanceTaka?.toLocaleString()}</Text>
                    </div>
                  </div>
                  <Button view="flat-secondary" size="s" onClick={() => setFinancialsModalUser(user)}>
                    <Icon data={ChevronRight} size={16} />
                  </Button>
                </div>

                <div className="flex items-center gap-3 border-l border-[var(--g-color-line-generic)] pl-8">
                  <Label theme="info" size="m">{user?.role}</Label>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Staff List (Others) */}
        <section>
          <Text variant="subheader-3" className="mb-3 block font-bold text-gray-500 uppercase tracking-wider">Team Members {staff.filter(s => s._id !== user?._id).length > 0 && `(${staff.filter(s => s._id !== user?._id).length})`}</Text>
          <div className="grid gap-4">
            {staff.filter(s => s._id !== user?._id).length === 0 ? (
              <Card view="outlined" className="p-10 flex flex-col items-center justify-center gap-4 border-dashed border-2">
                 <Text color="secondary">No other team members found.</Text>
                 <Button view="normal" onClick={() => setModalOpen(true)}>Add your first teammate</Button>
              </Card>
            ) : (
              staff.filter(s => s._id !== user?._id).map((member) => (
                <Card key={member._id} view="raised" className="p-5 hover:border-indigo-500/30 transition-all border border-[var(--g-color-line-generic)]">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${member.role === 'MANAGER' ? 'bg-blue-500/10' : 'bg-gray-500/10'}`}>
                        <Icon data={Person} size={20} className={member.role === 'MANAGER' ? 'text-blue-400' : 'text-gray-400'} />
                      </div>
                      <div>
                        <Text variant="body-2" className="block font-bold">{member.name || 'Unnamed Staff'}</Text>
                        <div className="flex gap-4 mt-0.5 text-xs text-secondary opacity-70">
                           {member.email && <span className="flex items-center gap-1"><Icon data={At} size={12}/> {member.email}</span>}
                           {member.phone && <span className="flex items-center gap-1"><Icon data={Smartphone} size={12}/> {member.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      {/* Wallet Status */}
                      <div className="flex items-center gap-3">
                         <div className="text-right">
                            <Text color="secondary" className="block text-[10px] uppercase font-bold tracking-tight mb-0.5">Wallet</Text>
                            <div className="flex items-center gap-1.5 justify-end">
                               <Icon data={CreditCard} size={12} className="text-indigo-400" />
                               <Text variant="body-2" className="font-bold">৳ {member.balanceTaka?.toLocaleString()}</Text>
                            </div>
                         </div>
                         <Button view="flat-secondary" size="s" onClick={() => setFinancialsModalUser(member)}>
                            <Icon data={ChevronRight} size={16} />
                         </Button>
                      </div>

                      <div className="flex items-center gap-3 border-l border-[var(--g-color-line-generic)] pl-8">
                        <Label theme={member.role === 'MANAGER' ? 'info' : 'normal'}>{member.role}</Label>
                        <Button view="flat" size="s" title="Reset Password" onClick={() => { setResetModalUser(member); setConfirmStep(1); }}>
                          <Icon data={Key} size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>

      <CreateStaffModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <StaffFinancialsModal
         staff={financialsModalUser}
         open={!!financialsModalUser}
         onClose={() => setFinancialsModalUser(null)}
      />

      {/* 2-Layered Reset Password Confirmation Modal */}
      <Modal open={!!resetModalUser} onClose={() => setResetModalUser(null)}>
        <div className="p-8 flex flex-col gap-6 w-[400px] bg-[var(--g-color-base-background)] rounded-2xl">
          <div>
            <Text variant="display-1" className="block font-bold text-red-500">Security Check</Text>
            <Text variant="body-2" color="secondary" className="block mt-1">
              {confirmStep === 1
                ? `Are you sure you want to reset password for ${resetModalUser?.name}?`
                : `Enter new password for ${resetModalUser?.name}.`}
            </Text>
          </div>

          {confirmStep === 2 && (
            <div className="flex flex-col gap-1.5">
              <Label>New Password</Label>
              <TextInput
                type="password"
                placeholder="At least 6 characters"
                size="l"
                value={newPassword}
                onUpdate={setNewPassword}
                autoFocus
              />
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <Button view="flat" size="l" onClick={() => setResetModalUser(null)}>Cancel</Button>
            <Button
              view={confirmStep === 1 ? 'outlined-danger' : 'action'}
              size="l"
              onClick={handleResetPassword}
              disabled={confirmStep === 2 && newPassword.length < 6}
              loading={resetPassword.isPending}
            >
              {confirmStep === 1 ? 'Yes, I am sure' : 'Reset Password'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
