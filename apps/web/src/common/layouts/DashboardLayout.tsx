import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Button, Text, Icon } from '@gravity-ui/uikit';
import {
  House,
  Person,
  Persons,
  Folder,
  ChartBar,
  Gear,
  ArrowRightFromSquare,
  CircleDollar,
} from '@gravity-ui/icons';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';

const NAV_ITEMS = [
  { label: 'Dashboard',  path: '/dashboard', icon: House },
  { label: 'Clients',    path: '/clients',   icon: Person },
  { label: 'Staff',      path: '/staff',     icon: Persons },
  { label: 'Files',      path: '/files',     icon: Folder },
  { label: 'Expenses',   path: '/expenses',  icon: CircleDollar },
  { label: 'Reports',    path: '/reports',   icon: ChartBar },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Initials for avatar placeholder
  const initials = (user?.name ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-[var(--g-color-base-background)] overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-[var(--g-color-line-generic)] bg-[var(--g-color-base-float)]">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--g-color-line-generic)]">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-indigo-400">C</span>
          </div>
          <div className="min-w-0">
            <Text variant="subheader-2" className="block font-semibold truncate">CNF Nexus</Text>
            <Text variant="caption-1" color="secondary" className="block truncate">
              {user?.role ?? 'User'}
            </Text>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map(({ label, path, icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                    : 'text-[var(--g-color-text-secondary)] hover:bg-[var(--g-color-base-generic-hover)] hover:text-[var(--g-color-text-primary)]'
                }`
              }
            >
              <Icon data={icon} size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: Settings + Profile */}
        <div className="px-3 py-4 border-t border-[var(--g-color-line-generic)] flex flex-col gap-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                  : 'text-[var(--g-color-text-secondary)] hover:bg-[var(--g-color-base-generic-hover)] hover:text-[var(--g-color-text-primary)]'
              }`
            }
          >
            <Icon data={Gear} size={18} />
            Settings
          </NavLink>

          {/* Profile row */}
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl bg-[var(--g-color-base-generic)]">
            {/* Simple initials avatar — no Avatar component needed */}
            <div className="w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-500/40 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-indigo-300">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <Text variant="caption-2" className="block font-medium truncate">{user?.name ?? 'User'}</Text>
              <Text variant="caption-1" color="secondary" className="block truncate">
                {user?.email ?? user?.phone ?? ''}
              </Text>
            </div>
            <Button view="flat" size="s" onClick={handleLogout} title="Sign out">
              <Icon data={ArrowRightFromSquare} size={16} />
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
