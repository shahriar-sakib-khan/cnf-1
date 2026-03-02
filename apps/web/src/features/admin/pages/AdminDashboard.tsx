import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Text, Button, Card, Spin, Icon, Label } from '@gravity-ui/uikit';
import { Plus, Person, Smartphone, Key, LayoutHeader, ChevronDown, ChevronUp } from '@gravity-ui/icons';
import api from '../../../common/lib/api';

import CreateStoreModal from '../components/CreateStoreModal';
import AdminResetPasswordModal from '../components/AdminResetPasswordModal';
import CategoryManagement from '../components/CategoryManagement';

interface StaffMember {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  role: 'MANAGER' | 'STAFF';
  isActive: boolean;
}

interface Owner {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  storeId?: {
    _id: string;
    name: string;
  };
  staff: StaffMember[];
  isActive: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [collapsedStores, setCollapsedStores] = useState<Record<string, boolean>>({});
  const [resettingUser, setResettingUser] = useState<{ id: string, name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'finance'>('users');

  const { data: owners = [], isLoading } = useQuery<Owner[]>({
    queryKey: ['admin', 'owners'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return data.data;
    },
  });

  const toggleExpand = (ownerId: string) => {
    setCollapsedStores(prev => ({ ...prev, [ownerId]: !prev[ownerId] }));
  };

  const closeAll = () => {
    const newCollapsed: Record<string, boolean> = {};
    owners.forEach(o => newCollapsed[o._id] = true);
    setCollapsedStores(newCollapsed);
  };

  const openAll = () => {
    setCollapsedStores({});
  };

  const allClosed = owners.length > 0 && owners.every(o => collapsedStores[o._id]);

  return (
    <div className="flex flex-col gap-8 p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Text variant="display-2" className="block font-bold">Users & Stores</Text>
          <div className="flex items-center gap-3 mt-1">
            <Text variant="body-2" color="secondary">
              {owners.length} store{owners.length !== 1 ? 's' : ''} registered
            </Text>
            {owners.length > 0 && (
              <Button view="flat-secondary" size="s" onClick={allClosed ? openAll : closeAll}>
                {allClosed ? 'Open All' : 'Close All'}
              </Button>
            )}
          </div>
        </div>
        <Button view="action" size="l" onClick={() => setShowForm(!showForm)}>
          <Button.Icon><Plus /></Button.Icon>
          New User
        </Button>
      </div>

      {/* Admin Tabs */}
      <div className="flex gap-2">
        <Button
          view={activeTab === 'users' ? 'action' : 'flat'}
          size="l"
          onClick={() => setActiveTab('users')}
          className="rounded-xl px-6"
        >
          Users & Stores
        </Button>
        <Button
          view={activeTab === 'finance' ? 'action' : 'flat'}
          size="l"
          onClick={() => setActiveTab('finance')}
          className="rounded-xl px-6"
        >
          Expense Categories
        </Button>
      </div>

      {activeTab === 'users' ? (
        <div className="flex flex-col gap-6">
          {/* Create Owner Form */}
          <CreateStoreModal open={showForm} onClose={() => setShowForm(false)} />

          {/* Owners List */}
          {isLoading ? (
            <div className="flex justify-center h-48 items-center"><Spin size="xl" /></div>
          ) : owners.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 border border-dashed border-[var(--g-color-line-generic)] rounded-2xl">
              <Text variant="subheader-2">No users yet</Text>
              <Text variant="body-2" color="secondary">Click "New User" to create the first store owner.</Text>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {owners.map((owner) => {
                const displayName = owner.name || owner.email || owner.phone || 'Unnamed User';
                return (
                  <div key={owner._id} className="flex flex-col gap-2">
                    <Card view="raised" className="p-4 rounded-2xl border border-[var(--g-color-line-generic)] hover:border-red-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                            <Icon data={Person} size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Text variant="subheader-2" className="font-semibold">{displayName}</Text>
                              <Label theme="info" size="s">OWNER</Label>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              {owner.email && owner.name && (
                                <span className="flex items-center gap-1 text-xs text-[var(--g-color-text-secondary)]">
                                  {owner.email}
                                </span>
                              )}
                              {owner.phone && (owner.name || owner.email) && (
                                <span className="flex items-center gap-1 text-xs text-[var(--g-color-text-secondary)]">
                                  <Icon data={Smartphone} size={12} />{owner.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <div className="flex items-center justify-end gap-1.5 text-indigo-400">
                              <Icon data={LayoutHeader} size={14} />
                              <Text variant="body-2" className="font-medium">
                                {owner.storeId?.name || 'No Store'}
                              </Text>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 border-l border-[var(--g-color-line-generic)] pl-4">
                            <Button view="flat" size="m" onClick={() => setResettingUser({ id: owner._id, name: displayName })} title="Reset Password">
                              <Icon data={Key} size={16} />
                            </Button>
                            <Button view="flat" size="m" onClick={() => toggleExpand(owner._id)} className="ml-1">
                              <Icon data={collapsedStores[owner._id] ? ChevronDown : ChevronUp} size={18} />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Staff Sub-list */}
                      {!collapsedStores[owner._id] && (
                        <div className="mt-4 pt-4 border-t border-[var(--g-color-line-generic)] flex flex-col gap-2">
                          <div className="flex items-center justify-between px-2 mb-1">
                            <Text variant="caption-2" color="secondary" className="uppercase tracking-wider font-bold">Staff Members</Text>
                            <Text variant="caption-1" color="secondary">{owner.staff.length} member(s)</Text>
                          </div>

                          {owner.staff.length === 0 ? (
                            <div className="px-4 py-3 bg-[var(--g-color-base-generic)] rounded-lg text-center">
                              <Text variant="body-1" color="secondary">No staff members found for this store.</Text>
                            </div>
                          ) : (
                            owner.staff.map((member) => {
                              const staffDisplayName = member.name || member.email || member.phone || 'Unnamed Staff';
                              return (
                                <div key={member._id} className="flex items-center justify-between px-4 py-2.5 bg-[var(--g-color-base-generic)] hover:bg-[var(--g-color-base-generic-hover)] rounded-xl transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--g-color-base-selection)] flex items-center justify-center text-[var(--g-color-text-secondary)]">
                                      <Icon data={Person} size={14} />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <Text variant="body-2" className="font-medium">{staffDisplayName}</Text>
                                        <Label theme={member.role === 'MANAGER' ? 'warning' : 'info'} size="s" className="text-[10px] py-0 h-4">
                                          {member.role}
                                        </Label>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {member.email && member.name && (
                                          <Text variant="caption-1" color="secondary">
                                            {member.email}
                                          </Text>
                                        )}
                                        {member.phone && (member.name || member.email) && (
                                          <Text variant="caption-1" color="secondary">
                                            {member.phone}
                                          </Text>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <Button view="flat" size="s" onClick={() => setResettingUser({ id: member._id, name: staffDisplayName })} title="Reset Password">
                                    <Icon data={Key} size={14} />
                                  </Button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <CategoryManagement />
      )}

      {/* Reset Password Modal */}
      <AdminResetPasswordModal resettingUser={resettingUser} onClose={() => setResettingUser(null)} />
    </div>
  );
}
