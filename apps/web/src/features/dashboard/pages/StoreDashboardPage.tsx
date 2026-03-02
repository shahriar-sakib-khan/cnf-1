import { Text, Card, Icon, Spin, Label } from '@gravity-ui/uikit';
import { Rocket, ShieldCheck, FileText, ArrowRight } from '@gravity-ui/icons';
import { useDashboardStats } from '../../staff/hooks/useFinance';
import { useFiles } from '../../files/hooks/useFiles';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function StoreDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activeFilesData, isLoading: filesLoading } = useFiles({ status: 'ACTIVE', limit: 10 });

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (statsLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spin size="xl" />
      </div>
    );
  }

  // Fallbacks if stats fail to load
  const activeFilesCount = stats?.filesActive || 0;
  const clearedFiles = stats?.filesCleared || 0;
  const totalFiles = stats?.filesTotal || 0;
  const recentRequests = stats?.recentRequests || [];
  const activeFilesList = activeFilesData?.data || [];

  const formattedDate = now.toLocaleDateString('en-BD', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 w-full">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <Text variant="display-1" className="mb-2 font-bold tracking-tight">Overview</Text>
          <Text variant="body-2" color="secondary" className="block mt-2">Welcome back. Here's what's happening today.</Text>
        </div>
        <div className="text-right">
           <Text variant="subheader-3" className="block font-bold text-indigo-400">{formattedTime}</Text>
           <Text variant="body-1" color="secondary" className="block">{formattedDate}</Text>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {/* Metric Card 1 */}
        <Card view="raised" className="p-6 flex flex-col gap-4 shadow-sm border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 rounded-2xl">
          <div className="flex justify-between items-start">
            <Text variant="subheader-2" color="secondary">Total Files</Text>
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
              <Icon data={FileText} size={20} />
            </div>
          </div>
          <Text variant="display-2" className="font-bold">{totalFiles}</Text>
          <div className="text-sm">
            <span className="text-gray-400">All-time</span>
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
          <Text variant="display-2" className="font-bold">{activeFilesCount}</Text>
          <div className="text-sm">
            <span className="text-gray-400">Currently processing</span>
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
          <Text variant="display-2" className="font-bold">{clearedFiles}</Text>
          <div className="text-sm">
            <span className="text-gray-400">Delivered/Billed/Archived</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card view="raised" className="p-6 h-[400px] border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <Text variant="subheader-2" className="mb-4 block">Active Files</Text>

            <div className="flex-1 overflow-y-auto pr-2">
              {filesLoading ? (
                <div className="flex justify-center py-10"><Spin size="l" /></div>
              ) : activeFilesList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Text color="secondary">No active files processing right now.</Text>
                  <Link to="/files" className="mt-4 text-indigo-400 hover:text-indigo-500 text-sm font-medium">View all files</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeFilesList.map((file: any) => (
                    <Link to={`/files/${file._id}`} key={file._id} className="block group">
                      <div className="flex justify-between items-center p-4 rounded-xl bg-[var(--g-color-base-generic-hover)] hover:bg-[var(--g-color-base-generic-hover)] border border-transparent hover:border-indigo-500/20 transition-all">
                        <div>
                          <Text variant="body-2" className="block font-bold text-indigo-300 group-hover:text-indigo-400 font-mono transition-colors">
                            {file.fileNoFull}
                          </Text>
                          <Text variant="caption-1" color="secondary" className="block mt-0.5">
                            {file.clientId?.name || 'Unknown Client'}
                          </Text>
                        </div>
                        <div className="flex items-center gap-4">
                          <Label theme="info" size="s">{file.status}</Label>
                          <Icon data={ArrowRight} size={14} className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card view="raised" className="p-6 h-[400px] border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 rounded-2xl shadow-sm overflow-y-auto">
            <Text variant="subheader-2" className="mb-4 block">Recent Money Requests</Text>
            {recentRequests.length === 0 ? (
              <Text color="secondary" className="text-sm">No recent requests.</Text>
            ) : (
              <div className="space-y-4">
                 {recentRequests.map((req: any) => (
                   <div key={req._id} className="flex flex-col gap-1 pb-3 border-b border-[var(--g-color-line-generic)] last:border-0">
                     <div className="flex justify-between items-start">
                       <Text variant="body-2" className="font-bold text-sm truncate pr-2" title={req.purpose}>{req.purpose}</Text>
                       <Label theme={req.status === 'APPROVED' ? 'success' : req.status === 'PENDING' ? 'warning' : 'danger'} size="s">
                         {req.status}
                       </Label>
                     </div>
                     <div className="flex justify-between items-center text-xs">
                       <Text color="secondary">{req.staffId?.name}</Text>
                       <Text className="font-bold font-mono">৳ {req.amount.toLocaleString()}</Text>
                     </div>
                     <Text color="secondary" className="text-xs">{new Date(req.createdAt).toLocaleDateString()}</Text>
                   </div>
                 ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
