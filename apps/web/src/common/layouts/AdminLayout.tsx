import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Button, Text, Icon } from '@gravity-ui/uikit';
import { Persons, ArrowRightFromSquare, ChartBar } from '@gravity-ui/icons';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';
import api from '../lib/api';

const NAV_ITEMS = [
  { label: 'Users & Stores', path: '/admin',         icon: Persons },
  { label: 'Overview',       path: '/admin/overview', icon: ChartBar },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await api.post('/auth/logout');
    logout();
    navigate('/');
  };

  const initials = (user?.name ?? 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-[var(--g-color-base-background)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-[var(--g-color-line-generic)] bg-[var(--g-color-base-float)]">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--g-color-line-generic)]">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-red-400">A</span>
          </div>
          <div className="min-w-0">
            <Text variant="subheader-2" className="block font-semibold truncate">CNF Admin</Text>
            <Text variant="caption-1" color="secondary" className="block truncate">System Admin</Text>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, path, icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                    : 'text-[var(--g-color-text-secondary)] hover:bg-[var(--g-color-base-generic-hover)] hover:text-[var(--g-color-text-primary)]'
                }`
              }
            >
              <Icon data={icon} size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Profile */}
        <div className="px-3 py-4 border-t border-[var(--g-color-line-generic)]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--g-color-base-generic)]">
            <div className="w-7 h-7 rounded-full bg-red-500/30 border border-red-500/40 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-red-300">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <Text variant="caption-2" className="block font-medium truncate">{user?.name ?? 'Admin'}</Text>
              <Text variant="caption-1" color="secondary" className="block truncate">{user?.email ?? ''}</Text>
            </div>
            <Button view="flat" size="s" onClick={handleLogout} title="Sign out">
              <Icon data={ArrowRightFromSquare} size={16} />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
