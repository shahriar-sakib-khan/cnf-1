import { Text, Button, Icon, Label } from '@gravity-ui/uikit';
import { Check, Lock } from '@gravity-ui/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../common/lib/api';

interface FileLifecycleTabProps {
  file: any;
}

const MILESTONES = [
  { id: 'CREATED', label: 'File Registered', fields: ['description'] },
  { id: 'DOCS_RECEIVED', label: 'Documents Collected', fields: ['copyDocsReceived', 'originalDocsReceived'] },
  { id: 'IGM_RECEIVED', label: 'IGM Received', fields: ['igmNo', 'igmDate'] },
  { id: 'ARRIVAL_CONFIRMED', label: 'Arrival Confirmed', fields: ['arrivalDate', 'vesselName'] },
  { id: 'BE_FILED', label: 'B/E Filed', fields: ['boeNumber', 'beDate'] },
  { id: 'UNDER_ASSESSMENT', label: 'Assessment Started', fields: ['hsCode'] },
  { id: 'ASSESSMENT_COMPLETE', label: 'Value Finalized', fields: ['assessmentValue', 'customsLane'] },
  { id: 'DUTY_PAID', label: 'Duty Paid', fields: ['currency'] },
  { id: 'PORT_BILL_PAID', label: 'Port Bill Settled', fields: ['gatePassNo'] },
  { id: 'DELIVERED', label: 'Released & Delivered', fields: ['deliveryOrderStatus'] },
  { id: 'BILLED', label: 'Final Billing', fields: [] },
  { id: 'ARCHIVED', label: 'Archived', fields: [] }
];

const STATUS_ORDER = MILESTONES.map(m => m.id);

export default function FileLifecycleTab({ file }: FileLifecycleTabProps) {
  const queryClient = useQueryClient();
  const currentStatusIndex = STATUS_ORDER.indexOf(file.status || 'CREATED');


  const mutation = useMutation({
    mutationFn: (data: { status: string }) => api.put(`/files/${file._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file', file._id] });
    }
  });

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500 max-w-4xl mx-auto py-8">
      <div className="flex flex-col gap-2 mb-4">
        <Text variant="display-1" className="font-bold tracking-tight text-white/90 uppercase italic">Timeline</Text>
        <Text variant="body-2" color="secondary" className="max-w-xl opacity-60">
          Chronological progress of <span className="text-white font-bold">{file.fileNoFull}</span>. 
          Actions are logged in audit history.
        </Text>
      </div>

      <div className="relative flex flex-col gap-0">
        {/* Continuous Vertical Line */}
        <div className="absolute left-[15px] top-4 bottom-4 w-px bg-white/10" />

        {MILESTONES.map((m, idx) => {
          const isDone = currentStatusIndex >= idx;
          const isActive = currentStatusIndex === idx;
          const isNext = currentStatusIndex === idx - 1;
          const isLocked = idx > currentStatusIndex + 1;
          
          return (
            <div key={m.id} className={`relative flex gap-8 pb-12 last:pb-0 group transition-all duration-300 ${isLocked ? 'opacity-30' : 'opacity-100'}`}>
              {/* Timeline Marker */}
              <div className="relative flex flex-col items-center">
                <div className={`z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                  isDone ? 'bg-green-500/20 border-green-500 text-green-400' :
                  isActive ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' :
                  'bg-slate-950 border-white/20 text-white/20'
                }`}>
                   {isDone ? <Icon data={Check} size={14} /> : (idx + 1)}
                </div>
              </div>

              {/* Content Card */}
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Text variant="subheader-2" className={`font-black uppercase tracking-widest ${isActive ? 'text-indigo-400' : isDone ? 'text-green-400' : 'text-white/40'}`}>
                      {m.label}
                    </Text>
                    {isActive && <Label theme="info" size="s" className="animate-pulse">Active Stage</Label>}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isDone && (
                      <Text variant="caption-2" color="secondary" className="opacity-50 italic">
                        Logged
                      </Text>
                    )}
                    {!isDone && !isLocked && (
                      <Button 
                        size="s" 
                        view={isNext ? 'action' : 'flat'}
                        loading={mutation.isPending && mutation.variables?.status === m.id}
                        disabled={mutation.isPending}
                        onClick={() => mutation.mutate({ status: m.id })}
                        className="font-bold uppercase tracking-tighter text-[9px]"
                      >
                         {isNext ? 'Start This Stage' : <Icon data={Lock} size={12} />}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Milestone Fields Preview */}
                {(isDone || isActive) && m.fields.length > 0 && (
                  <div className="bg-slate-900/40 rounded-xl p-4 border border-white/5 grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                     {m.fields.map(field => (
                        <div key={field} className="flex flex-col gap-1">
                           <Text variant="caption-1" color="secondary" className="uppercase font-bold tracking-tighter opacity-40 text-[9px]">{field.replace(/([A-Z])/g, ' $1')}</Text>
                           <Text variant="body-1" className={file[field] ? "text-white/80 font-mono text-xs" : "text-white/20 italic text-xs"}>
                              {file[field] !== undefined ? String(file[field]) : '—'}
                           </Text>
                        </div>
                     ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
