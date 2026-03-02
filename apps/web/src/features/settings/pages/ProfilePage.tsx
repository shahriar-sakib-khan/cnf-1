import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useUpdateProfile, useChangePassword } from '../../auth/hooks/useAuth';
import type { UpdateProfileInput } from '@repo/shared';
import { Text, Card, Button, TextInput, Icon } from '@gravity-ui/uikit';
import { Person, Envelope, Smartphone, ShieldCheck, Key } from '@gravity-ui/icons';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Profile Form
  const [profileForm, setProfileForm] = useState<UpdateProfileInput>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  useEffect(() => {
    // Keep local state in sync if user updates
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleProfileSubmit = () => {
    updateProfile.mutate(profileForm, {
      onSuccess: () => {
        alert('Profile updated successfully.');
      },
      onError: (err: any) => {
        alert(err.response?.data?.error?.message || 'Failed to update profile.');
      }
    });
  };

  const handlePasswordSubmit = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return alert('New passwords do not match.');
    }

    changePassword.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    }, {
      onSuccess: () => {
        alert('Password changed successfully. Please log in again.');
        logout();
        navigate('/');
      },
      onError: (err: any) => {
        alert(err.response?.data?.error?.message || 'Failed to change password.');
      }
    });
  };

  const profileChanged =
    profileForm.name !== (user?.name || '') ||
    profileForm.email !== (user?.email || '') ||
    profileForm.phone !== (user?.phone || '');

  const passwordValid =
    passwordForm.currentPassword.length >= 6 &&
    passwordForm.newPassword.length >= 6 &&
    passwordForm.newPassword === passwordForm.confirmPassword;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 w-full">
      <header>
        <Text variant="display-1" className="font-bold">Settings & Profile</Text>
        <Text variant="body-2" color="secondary" className="block mt-1">
          Update your personal details and manage your security.
        </Text>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Details */}
        <section>
          <Text variant="subheader-3" className="mb-3 block font-bold text-indigo-400 uppercase tracking-wider">Personal Information</Text>
          <Card view="raised" className="p-6 flex flex-col gap-5 border border-[var(--g-color-line-generic)]">
            <div className="flex flex-col gap-1.5">
              <Text variant="body-2" className="font-semibold px-1">Full Name</Text>
              <TextInput
                size="xl"
                value={profileForm.name}
                onUpdate={(v) => setProfileForm(p => ({ ...p, name: v }))}
                startContent={<Icon data={Person} className="text-gray-400 ml-3" size={16} />}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Text variant="body-2" className="font-semibold px-1">Email <span className="font-normal text-[var(--g-color-text-secondary)]">(Optional)</span></Text>
              <TextInput
                size="xl"
                type="email"
                value={profileForm.email}
                onUpdate={(v) => setProfileForm(p => ({ ...p, email: v }))}
                startContent={<Icon data={Envelope} className="text-gray-400 ml-3" size={16} />}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Text variant="body-2" className="font-semibold px-1">Phone <span className="font-normal text-[var(--g-color-text-secondary)]">(Optional)</span></Text>
              <TextInput
                size="xl"
                type="tel"
                value={profileForm.phone}
                onUpdate={(v) => setProfileForm(p => ({ ...p, phone: v }))}
                startContent={<Icon data={Smartphone} className="text-gray-400 ml-3" size={16} />}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                view="action"
                size="l"
                disabled={!profileChanged}
                loading={updateProfile.isPending}
                onClick={handleProfileSubmit}
              >
                Save Changes
              </Button>
            </div>
          </Card>
        </section>

        {/* Security & Password */}
        <section>
          <Text variant="subheader-3" className="mb-3 block font-bold text-amber-500 uppercase tracking-wider">Security</Text>
          <Card view="raised" className="p-6 flex flex-col gap-5 border border-[var(--g-color-line-generic)]">
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3 text-amber-500 mb-2">
              <Icon data={ShieldCheck} size={20} className="mt-0.5 flex-shrink-0" />
              <Text variant="body-1" className="text-sm">
                Changing your password will immediately log you out of all your devices. You will need to sign in again.
              </Text>
            </div>

            <div className="flex flex-col gap-1.5">
              <Text variant="body-2" className="font-semibold px-1">Current Password</Text>
              <TextInput
                size="xl"
                type="password"
                value={passwordForm.currentPassword}
                onUpdate={(v) => setPasswordForm(p => ({ ...p, currentPassword: v }))}
                startContent={<Icon data={Key} className="text-gray-400 mx-3" size={16} />}
              />
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <Text variant="body-2" className="font-semibold px-1">New Password</Text>
              <TextInput
                size="xl"
                type="password"
                value={passwordForm.newPassword}
                onUpdate={(v) => setPasswordForm(p => ({ ...p, newPassword: v }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Text variant="body-2" className="font-semibold px-1">Confirm New Password</Text>
              <TextInput
                size="xl"
                type="password"
                value={passwordForm.confirmPassword}
                onUpdate={(v) => setPasswordForm(p => ({ ...p, confirmPassword: v }))}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                view="outlined-danger"
                size="l"
                disabled={!passwordValid}
                loading={changePassword.isPending}
                onClick={handlePasswordSubmit}
              >
                Update Password
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
