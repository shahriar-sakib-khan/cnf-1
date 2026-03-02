import { useReports } from '../hooks/useReports';
import { Text, Spin, Icon } from '@gravity-ui/uikit';
import { ChartBar } from '@gravity-ui/icons';
import ReportRow from '../components/ReportRow';

export default function ReportsPage() {
  const { data: files = [], isLoading } = useReports();

  if (isLoading) {
    return <div className="p-12 flex justify-center h-full items-center"><Spin size="xl" /></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 w-full">
      {/* Header */}
      <div className="flex justify-between items-center bg-[var(--g-color-base-generic)] p-6 rounded-2xl border border-[var(--g-color-line-generic)] shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
               <Icon data={ChartBar} size={18} className="text-indigo-400" />
             </div>
             <Text variant="display-1" className="font-bold">Business Reports</Text>
          </div>
          <Text variant="body-2" color="secondary" className="block pl-11">
            Manage Initial Invoices and Final Bills for all operation files.
          </Text>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <Text variant="subheader-3" className="mb-4 block font-bold text-[var(--g-color-text-secondary)] uppercase tracking-wider pl-2">
            File List & Invoicing Status {files.length > 0 && `(${files.length})`}
          </Text>

          <div className="flex flex-col flex-1 min-h-0 bg-[var(--g-color-base-float)] rounded-2xl border border-[var(--g-color-line-generic)] overflow-hidden shadow-sm">
            {files.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center gap-4 bg-[var(--g-color-base-generic)]">
                 <Text color="secondary" className="text-lg">No operation files found.</Text>
              </div>
            ) : (
              <>
                {/* Header Row */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-6 lg:px-12 py-5 bg-[var(--g-color-base-generic)] border-b border-[var(--g-color-line-generic)] text-[11px] font-bold text-[var(--g-color-text-secondary)] tracking-widest items-center uppercase">
                  <div className="col-span-1">SL</div>
                  <div className="col-span-3">File & Client</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Creation Date</div>
                  <div className="col-span-2 text-center">PDA</div>
                  <div className="col-span-2 text-right">FDA</div>
                </div>

                <div className="flex flex-col overflow-y-auto pb-4 custom-scrollbar max-h-[70vh]">
                  {files.map((file: any, idx: number) => (
                    <ReportRow
                       key={file._id}
                       index={idx}
                       file={file}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
