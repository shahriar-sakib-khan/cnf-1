import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateOwnerSchema,
  AdminResetPasswordSchema,
  type CreateOwnerInput,
  type AdminResetPasswordInput
} from '@repo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Text, Button, Card, TextInput, Spin, Icon, Label,
  Modal, Toaster
} from '@gravity-ui/uikit';
import { Plus, Person, Smartphone, Key, LayoutHeader, ChevronDown, ChevronUp, Eye, EyeSlash } from '@gravity-ui/icons';
import api from '../../../common/lib/api';

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

const toaster = new Toaster();

export default function AdminDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [collapsedStores, setCollapsedStores] = useState<Record<string, boolean>>({});
  const [resettingUser, setResettingUser] = useState<{ id: string, name: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: owners = [], isLoading } = useQuery<Owner[]>({
    queryKey: ['admin', 'owners'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return data.data;
    },
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateOwnerInput>({
    resolver: zodResolver(CreateOwnerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '' },
  });

  const {
    control: resetControl,
    handleSubmit: handleResetSubmit,
    reset: resetResetForm,
    formState: { errors: resetErrors }
  } = useForm<AdminResetPasswordInput>({
    resolver: zodResolver(AdminResetPasswordSchema),
    defaultValues: { newPassword: '' },
  });

  const createMutation = useMutation({
    mutationFn: async (d: CreateOwnerInput) => {
      const { data } = await api.post('/admin/users', d);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'owners'] });
      reset();
      setShowForm(false);
      setShowPassword(false);
      toaster.add({
        name: 'create-success',
        title: 'Success',
        content: 'Owner and Store created successfully',
        theme: 'success',
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (d: AdminResetPasswordInput) => {
      if (!resettingUser) return;
      const { data } = await api.put(`/admin/users/${resettingUser.id}/password`, d);
      return data.data;
    },
    onSuccess: () => {
      toaster.add({
        name: 'reset-success',
        title: 'Password Reset',
        content: `Password for ${resettingUser?.name} has been reset successfully.`,
        theme: 'success',
      });
      setResettingUser(null);
      resetResetForm();
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

      {/* Create Owner Form */}
      {showForm && (
        <Card view="raised" className="p-6 rounded-2xl border border-red-500/20">
          <Text variant="subheader-2" className="block mb-4 font-semibold">Create Owner Account</Text>
          <Text variant="body-2" color="secondary" className="block mb-5">
            A store will be automatically created for this user.
          </Text>

          {createMutation.isError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4">
              {/* @ts-expect-error axios error */}
              {createMutation.error?.response?.data?.error?.message || 'Failed to create user'}
            </div>
          )}

          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Controller name="name" control={control} render={({ field }) => (
                <TextInput {...field} placeholder="Full Name (optional)" size="l"
                  validationState={errors.name ? 'invalid' : undefined}
                  errorMessage={errors.name?.message} />
              )} />
              <div className="relative">
                <Controller name="password" control={control} render={({ field }) => (
                  <TextInput {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password *"
                    size="l"
                    validationState={errors.password ? 'invalid' : undefined}
                    errorMessage={errors.password?.message}
                  />
                )} />
                <div className="absolute right-0 top-0 h-[38px] flex items-center pr-1">
                  <Button view="flat" size="m" onClick={() => setShowPassword(!showPassword)}>
                    <Icon data={showPassword ? EyeSlash : Eye} size={16} />
                  </Button>
                </div>
              </div>

              <Controller name="email" control={control} render={({ field }) => (
                <TextInput {...field} placeholder="Email (optional if phone given)" size="l"
                  validationState={errors.email ? 'invalid' : undefined}
                  errorMessage={errors.email?.message} />
              )} />
              <Controller name="phone" control={control} render={({ field }) => (
                <TextInput {...field} placeholder="Phone (optional if email given)" size="l" />
              )} />
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <Button view="flat" size="l" onClick={() => { setShowForm(false); reset(); setShowPassword(false); }}>Cancel</Button>
              <Button type="submit" view="action" size="l" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Spin size="xs" /> : 'Create User & Store'}
              </Button>
            </div>
          </form>
        </Card>
      )}

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

      {/* Reset Password Modal */}
      <Modal open={!!resettingUser} onClose={() => setResettingUser(null)}>
        <div className="p-6 flex flex-col gap-6 w-[400px]">
          <div>
            <Text variant="subheader-2" className="block font-bold">Reset Password</Text>
            <Text variant="body-2" color="secondary" className="block mt-1">
              Set a new password for <span className="text-[var(--g-color-text-primary)] font-bold">{resettingUser?.name}</span>.
              This will force logout other active sessions.
            </Text>
          </div>

          <form onSubmit={handleResetSubmit((d) => resetPasswordMutation.mutate(d))} className="flex flex-col gap-4">
            <Controller name="newPassword" control={resetControl} render={({ field }) => (
              <TextInput
                {...field}
                type="password"
                placeholder="New Password *"
                size="l"
                autoFocus
                validationState={resetErrors.newPassword ? 'invalid' : undefined}
                errorMessage={resetErrors.newPassword?.message}
              />
            )} />

            <div className="flex justify-end gap-3 mt-2">
              <Button view="flat" size="l" onClick={() => setResettingUser(null)}>Cancel</Button>
              <Button type="submit" view="action" size="l" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending ? <Spin size="xs" /> : 'Reset Password'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
