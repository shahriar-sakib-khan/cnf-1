import React, { useState } from 'react';
import { Text, Card, Label, Icon, Button, Spin } from '@gravity-ui/uikit';
import { 
  FileText, Compass, ShieldExclamation, CircleCheck, Lock, Xmark 
} from '@gravity-ui/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../common/lib/api';
import { InlineEditableField } from './InlineEditableField';

interface FileOverviewTabProps {
  file: any;
  onViewHistory: () => void;
  onEdit: () => void;
}

const ASSESSMENT_NODES = [
  'ARO', 'RO', 'AC', 'DC', 'JC1', 'JC2', 'JC3', 'ADC1', 'ADC2', 'COMMISSIONER'
];

export function FileOverviewTab({ file }: FileOverviewTabProps) {
  const queryClient = useQueryClient();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const transferMutation = useMutation({
    mutationFn: (node: string) => 
      api.post(`/files/${file._id}/assessment/transfer`, { node }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file', file._id] });
      setSelectedNode(null);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (node: string) => 
      api.post(`/files/${file._id}/assessment`, { node, status: 'COMPLETED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file', file._id] });
      setSelectedNode(null);
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => api.post(`/files/${file._id}/assessment/reset`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file', file._id] });
      setShowResetConfirm(false);
    },
  });

  const Section = ({ title, icon, children, status }: { title: string, icon: any, children: React.ReactNode, status: 'locked' | 'active' | 'complete' }) => (
    <Card className={`p-4 bg-slate-900/40 border-white/5 shadow-xl transition-all duration-500 relative ${status === 'locked' ? 'grayscale opacity-30 shadow-none' : ''}`}>
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${status === 'complete' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
            <Icon data={status === 'locked' ? Lock : icon} size={16} />
          </div>
          <Text variant="caption-1" className="uppercase tracking-[0.2em] font-black text-white/40 text-[10px]">{title}</Text>
        </div>
        <div>
          {status === 'complete' && <Label theme="success" size="s" className="font-bold tracking-widest text-[9px]"><Icon data={CircleCheck} size={10} className="mr-1" /> COMPLETE</Label>}
          {status === 'active' && <Label theme="info" size="s" className="font-bold tracking-widest text-[9px]">ACTIVE</Label>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8 px-2">
        {children}
      </div>
    </Card>
  );

  const getPhaseStatus = (phase: number) => {
    const statusMap: Record<string, number> = {
      'CREATED': 0,
      'IGM_RECEIVED': 1,
      'BE_FILED': 2,
      'UNDER_ASSESSMENT': 2,
      'ASSESSMENT_COMPLETE': 2,
      'DUTY_PAID': 3,
      'DELIVERED': 3,
      'BILLED': 3
    };
    const currentPhase = statusMap[file.status] || 0;
    if (currentPhase > phase) return 'complete';
    if (currentPhase === phase) return 'active';
    return 'locked';
  };

  return (
    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* 1. DOCUMENTATION & SHIPPING */}
      <Section title="Documentation & Shipping" icon={FileText} status={getPhaseStatus(0)}>
        <InlineEditableField fileId={file._id} fieldName="igmNo" label="IGM Number" value={file.igmNo} placeholder="IGM-XXXX" />
        <InlineEditableField fileId={file._id} fieldName="igmDate" label="IGM Date" value={file.igmDate} type="date" />
        <InlineEditableField fileId={file._id} fieldName="rotationNo" label="Rotation No" value={file.rotationNo} placeholder="ROT-XXXX" />
        <InlineEditableField fileId={file._id} fieldName="vesselName" label="Vessel Name" value={file.vesselName} placeholder="Vessel Name" />
        <InlineEditableField fileId={file._id} fieldName="voyageNo" label="Voyage No" value={file.voyageNo} placeholder="VOY-XXXX" />
        <InlineEditableField fileId={file._id} fieldName="arrivalDate" label="Arrival Date" value={file.arrivalDate} type="date" />
        <InlineEditableField fileId={file._id} fieldName="lcNumber" label="L/C Number" value={file.lcNumber} placeholder="LC-XXXX" />
        <InlineEditableField fileId={file._id} fieldName="lcDate" label="L/C Date" value={file.lcDate} type="date" />
        <InlineEditableField fileId={file._id} fieldName="piNumber" label="PI Number" value={file.piNumber} placeholder="PI-XXXX" />
        <InlineEditableField fileId={file._id} fieldName="countryOfOrigin" label="Origin" value={file.countryOfOrigin} placeholder="Country" />
      </Section>

      {/* 2. CUSTOMS */}
      <Section title="Customs" icon={ShieldExclamation} status={getPhaseStatus(2)}>
        <InlineEditableField fileId={file._id} fieldName="boeNumber" label="B/E Number" value={file.boeNumber} placeholder="BE-XXXX" />
        <InlineEditableField fileId={file._id} fieldName="beDate" label="B/E Date" value={file.beDate} type="date" />
        <InlineEditableField fileId={file._id} fieldName="cNumber" label="C Number" value={file.cNumber} placeholder="C-XXXX" />
        <InlineEditableField fileId={file._id} fieldName="cDate" label="C Date" value={file.cDate} type="date" />
        <InlineEditableField fileId={file._id} fieldName="assessmentValue" label="Assess. Val" value={file.assessmentValue} type="number" isMoney={true} />
        <InlineEditableField 
          fileId={file._id} 
          fieldName="customsLane" 
          label="Customs Lane" 
          value={file.customsLane} 
          type="select" 
          options={[
            { value: 'GREEN', content: 'GREEN' },
            { value: 'YELLOW', content: 'YELLOW' },
            { value: 'RED', content: 'RED' },
          ]}
        />
        
        <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-2 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col gap-0.5">
              <Text variant="caption-1" color="secondary" className="font-black uppercase tracking-widest opacity-40 text-[9px] block">Assessment Workflow</Text>
              <Text variant="caption-1" className="text-[10px] text-white/20 italic">Click a node to transfer or manage state</Text>
            </div>
            <div className="flex items-center gap-2">
              {showResetConfirm ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                  <Text variant="caption-1" className="text-red-400 font-bold text-[10px] uppercase tracking-tighter">Are you sure?</Text>
                  <Button 
                    view="flat-danger" 
                    size="xs" 
                    className="font-black text-[10px]"
                    loading={resetMutation.isPending}
                    onClick={() => resetMutation.mutate()}
                  >
                    CONFIRM RESET
                  </Button>
                  <Button view="flat" size="xs" onClick={() => setShowResetConfirm(false)} className="opacity-40 hover:opacity-100">Cancel</Button>
                </div>
              ) : (
                <Button view="flat" size="xs" className="opacity-40 hover:opacity-100 hover:text-red-400 p-1" onClick={() => setShowResetConfirm(true)}>
                  <Icon data={Xmark} size={16} />
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 mt-4">
            {ASSESSMENT_NODES.map((node, idx) => {
              const nodeData = file.assessment?.nodes.find((n: any) => n.node === node);
              const isCurrent = nodeData?.status === 'ACTIVE' || file.assessment?.currentNode === node;
              const isCompleted = nodeData?.status === 'COMPLETED';
              const isSkipped = nodeData?.status === 'SKIPPED';
              const isFuture = !isCurrent && !isCompleted && !isSkipped;
              const isSelecting = selectedNode === node;
              
              const handleTransfer = (e: React.MouseEvent) => {
                e.stopPropagation();
                transferMutation.mutate(node);
              };
              const handleComplete = (e: React.MouseEvent) => {
                e.stopPropagation();
                completeMutation.mutate(node);
              };
              
              return (
                <div key={node} className="flex items-center relative">
                  <div className="flex flex-col items-center w-24 h-28 justify-center relative">
                    <div 
                      onClick={() => setSelectedNode(isSelecting ? null : node)}
                      className={`
                        relative flex items-center justify-center rounded-full font-black uppercase tracking-widest cursor-pointer transition-all duration-500
                        ${isCurrent ? 'w-16 h-16 bg-amber-400 text-slate-900 border-4 border-amber-200 shadow-[0_0_40px_rgba(251,191,36,0.6)] scale-110 z-10 text-[11px]' : ''}
                        ${isCompleted ? 'w-11 h-11 bg-amber-400/80 text-slate-900 border-2 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.5)] text-[9px]' : ''}
                        ${isSkipped ? 'w-11 h-11 bg-slate-800/60 text-slate-600 border border-white/5 opacity-30 grayscale blur-[0.4px] text-[9px]' : ''}
                        ${isFuture ? 'w-11 h-11 bg-slate-800/40 text-slate-500 border border-white/5 hover:border-amber-500/50 hover:text-amber-200 text-[9px]' : ''}
                      `}
                    >
                      {node}
                      {(transferMutation.isPending || completeMutation.isPending) && isSelecting && (
                        <div className="absolute inset-0 flex items-center justify-center bg-amber-400/50 rounded-full">
                          <Spin size="s" />
                        </div>
                      )}
                    </div>

                    {/* Transfer/Complete Gate Button - Relocated to TOP */}
                    {isSelecting && (
                      <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-1 w-max animate-in fade-in zoom-in-95 duration-200">
                        <Button view="flat-secondary" size="xs" className="self-end p-1 bg-slate-900/80 rounded-full" onClick={(e) => { e.stopPropagation(); setSelectedNode(null); }}>
                          <Icon data={Xmark} size={10} />
                        </Button>
                        {(isFuture || isSkipped) && (
                          <Button view="action" size="s" className="font-black px-4 shadow-2xl border border-white/10" loading={transferMutation.isPending} onClick={handleTransfer}>
                            TRANSFER FILE
                          </Button>
                        )}
                        {isCurrent && (
                          <Button view="outlined-success" size="s" className="font-black px-4 shadow-2xl bg-black border border-green-500/30" loading={completeMutation.isPending} onClick={handleComplete}>
                            MARK COMPLETED
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {idx < ASSESSMENT_NODES.length - 1 && (
                    <div className={`h-[1px] w-2 flex-shrink-0 transition-all duration-700 ${isFuture ? 'bg-white/5' : 'bg-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.1)]'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* 3. CARGO & LOGISTICS */}
      <Section title="Cargo & Logistics" icon={Compass} status={getPhaseStatus(2)}>
        <InlineEditableField fileId={file._id} fieldName="quantity" label="Quantity" value={file.quantity} type="number" />
        <InlineEditableField fileId={file._id} fieldName="weight" label="Weight (KG)" value={file.weight} type="number" />
        <InlineEditableField 
          fileId={file._id} 
          fieldName="containerType" 
          label="Container Type" 
          value={file.containerType} 
          type="select" 
          options={[
            { value: 'FCL', content: 'FCL' },
            { value: 'LCL', content: 'LCL' },
          ]}
        />
        <InlineEditableField 
          fileId={file._id} 
          fieldName="packageType" 
          label="Package Type" 
          value={file.packageType} 
          type="select" 
          options={[
            { value: 'PACKAGE', content: 'PACKAGE' },
            { value: 'PX', content: 'PX' },
            { value: 'ROLL', content: 'ROLL' },
            { value: 'BALE', content: 'BALE' },
            { value: 'CASE', content: 'CASE' },
            { value: 'CARTON', content: 'CARTON' },
            { value: 'DRUM', content: 'DRUM' },
            { value: 'BAG', content: 'BAG' },
            { value: 'OTHER', content: 'OTHER' },
          ]}
        />
        <InlineEditableField fileId={file._id} fieldName="containerNumbers" label="Container IDs" value={file.containerNumbers} placeholder="CNT1, CNT2..." className="lg:col-span-2" />
      </Section>

      {/* 4. CLEARANCE */}
      <Section title="Clearance" icon={CircleCheck} status={getPhaseStatus(3)}>
        <InlineEditableField fileId={file._id} fieldName="deliveryOrderStatus" label="D/O Status" value={file.deliveryOrderStatus} type="boolean" />
        <InlineEditableField fileId={file._id} fieldName="portBillPaid" label="Port BillPaid" value={file.portBillPaid} type="boolean" />
        <InlineEditableField fileId={file._id} fieldName="gatePassNo" label="Gate Pass No" value={file.gatePassNo} placeholder="GP-XXXX" />
        <InlineEditableField fileId={file._id} fieldName="exitDate" label="Exit Date" value={file.exitDate} type="date" />
      </Section>
    </div>
  );
}
