import { Text, Button } from '@gravity-ui/uikit';
import { useLocation } from 'react-router-dom';

const PAGE_CONFIG: Record<string, { name: string; addLabel?: string }> = {
  '/staff':    { name: 'Staff Management',   addLabel: 'Add Staff Member' },
  '/files':    { name: 'Files',              addLabel: 'Create File' },
  '/expenses': { name: 'Expenses',           addLabel: 'Add Expense' },
  '/reports':  { name: 'Reports' },
  '/settings': { name: 'Settings' },
};

export default function ComingSoonPage() {
  const { pathname } = useLocation();
  const config = PAGE_CONFIG[pathname] ?? { name: 'This Page' };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[70vh] gap-5">
      <div className="text-6xl mb-2">🚧</div>
      <div className="text-center">
        <Text variant="display-2" className="block font-bold">{config.name}</Text>
        <Text variant="body-2" color="secondary" className="block mt-2 max-w-sm">
          This feature is under construction and will be available soon.
        </Text>
      </div>
      {config.addLabel && (
        <Button view="action" size="l" disabled title="Coming soon">
          + {config.addLabel}
        </Button>
      )}
    </div>
  );
}
