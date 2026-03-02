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
import { useAuthRestore } from '../../features/auth/hooks/useAuth';
import { Spin } from '@gravity-ui/uikit';

const ALL_NAV_ITEMS = [
  { label: 'Dashboard',  path: '/dashboard', icon: House,         roles: ['OWNER', 'MANAGER', 'STAFF'] },
  { label: 'Clients',    path: '/clients',   icon: Person,         roles: ['OWNER', 'MANAGER'] },
  { label: 'Staff',      path: '/staff',     icon: Persons,        roles: ['OWNER', 'MANAGER'] },
  { label: 'Files',      path: '/files',     icon: Folder,         roles: ['OWNER', 'MANAGER', 'STAFF'] },
  { label: 'Financials',  path: '/finance',   icon: CircleDollar,   roles: ['OWNER', 'MANAGER', 'STAFF'] },
  { label: 'Reports',    path: '/reports',   icon: ChartBar,       roles: ['OWNER'] },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuthStore();

  // Restore session on mount
  useAuthRestore();

  // Filter nav items based on the user's role AND userType
  const navItems = ALL_NAV_ITEMS.filter(item => {
    // If user is Admin, they shouldn't see store-specific sidebar items yet
    // unless they have a tenantId (which they usually don't)
    if (user?.userType === 'ADMIN' && item.path !== '/dashboard') {
       // Admins might have different menu later, for now hide store items to prevent 403 redirects
       return false;
    }

    return !user?.role || (item.roles as string[]).includes(user.role);
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-[var(--g-color-base-background)]">
        <Spin size="xl" />
        <Text variant="body-2" color="secondary">Restoring session...</Text>
      </div>
    );
  }

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
            {user?.role === 'OWNER' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">OWNER</span>}
            {user?.role === 'MANAGER' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">MANAGER</span>}
            {user?.role === 'STAFF' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">STAFF</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(({ label, path, icon }) => (
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
          <div className="flex items-center gap-1 px-2 py-2 mt-1 rounded-xl bg-[var(--g-color-base-generic)] border border-[var(--g-color-line-generic)]">
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex-1 flex items-center gap-3 min-w-0 p-1.5 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-500/15'
                    : 'hover:bg-[var(--g-color-base-generic-hover)]'
                }`
              }
              title="View Profile"
            >
              {/* Simple initials avatar */}
              <div className="w-8 h-8 rounded-full bg-indigo-500/30 border border-indigo-500/40 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-indigo-300">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <Text variant="body-2" className="block font-bold truncate">{user?.name ?? 'User'}</Text>
                <Text variant="caption-1" color="secondary" className="block truncate opacity-80 mt-0.5">
                  {user?.email ?? user?.phone ?? ''}
                </Text>
              </div>
            </NavLink>

            <Button view="flat-danger" size="m" onClick={handleLogout} title="Sign out" className="flex-shrink-0 mx-1">
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
