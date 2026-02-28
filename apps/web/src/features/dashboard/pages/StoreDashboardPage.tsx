import { Text, Card, Icon } from '@gravity-ui/uikit';
import { LayoutHeader, Person, Rocket, ShieldCheck } from '@gravity-ui/icons';

export default function StoreDashboardPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Text variant="display-1" className="mb-2 font-bold tracking-tight">Overview</Text>
          <Text variant="body-2" color="secondary">Welcome back. Here's what's happening today.</Text>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {/* Metric Card 1 */}
        <Card view="raised" className="p-6 flex flex-col gap-4 shadow-sm border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 rounded-2xl">
          <div className="flex justify-between items-start">
            <Text variant="subheader-2" color="secondary">Total Clients</Text>
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
              <Icon data={Person} size={20} />
            </div>
          </div>
          <Text variant="display-2" className="font-bold">42</Text>
          <div className="text-sm">
            <span className="text-emerald-500 font-medium">+5%</span> <span className="text-gray-400">from last month</span>
          </div>
        </Card>

        {/* Metric Card 2 */}
        <Card view="raised" className="p-6 flex flex-col gap-4 shadow-sm border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 rounded-2xl">
          <div className="flex justify-between items-start">
            <Text variant="subheader-2" color="secondary">Active Files</Text>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Icon data={Rocket} size={20} />
            </div>
          </div>
          <Text variant="display-2" className="font-bold">18</Text>
          <div className="text-sm">
            <span className="text-emerald-500 font-medium">+12%</span> <span className="text-gray-400">from last month</span>
          </div>
        </Card>

        {/* Metric Card 3 */}
        <Card view="raised" className="p-6 flex flex-col gap-4 shadow-sm border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 rounded-2xl">
          <div className="flex justify-between items-start">
            <Text variant="subheader-2" color="secondary">Cleared Files</Text>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Icon data={ShieldCheck} size={20} />
            </div>
          </div>
          <Text variant="display-2" className="font-bold">124</Text>
          <div className="text-sm">
            <span className="text-emerald-500 font-medium">+2%</span> <span className="text-gray-400">from last month</span>
          </div>
        </Card>

        {/* Metric Card 4 */}
        <Card view="raised" className="p-6 flex flex-col gap-4 shadow-sm border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 rounded-2xl">
          <div className="flex justify-between items-start">
            <Text variant="subheader-2" color="secondary">Monthly Revenue</Text>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <Icon data={LayoutHeader} size={20} />
            </div>
          </div>
          <Text variant="display-2" className="font-bold">৳8.2M</Text>
          <div className="text-sm">
            <span className="text-red-500 font-medium">-1%</span> <span className="text-gray-400">from last month</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card view="raised" className="p-6 h-[400px] border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 rounded-2xl shadow-sm flex items-center justify-center">
            <Text color="secondary">Revenue Chart coming soon...</Text>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card view="raised" className="p-6 h-[400px] border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 rounded-2xl shadow-sm">
            <Text variant="subheader-2" className="mb-4 block">Recent Activity</Text>
            <div className="space-y-4">
               {[1, 2, 3, 4, 5].map((i) => (
                 <div key={i} className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                   <div className="flex-1">
                     <Text variant="body-1" className="block text-sm">File #IMP-00{i} cleared.</Text>
                     <Text variant="caption-2" color="secondary" className="block text-xs">2 hours ago</Text>
                   </div>
                 </div>
               ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
