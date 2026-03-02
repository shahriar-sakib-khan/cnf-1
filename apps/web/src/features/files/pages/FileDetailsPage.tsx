import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Button, Text, Card, Label, Icon, Spin, Breadcrumbs
} from '@gravity-ui/uikit';
import { ArrowLeft, LayoutSideContent, ChevronRight } from '@gravity-ui/icons';
import api from '../../../common/lib/api';
import { useAuthStore } from '../../auth/stores/useAuthStore';

// Sub-components
import { InlineEditableField } from '../components/InlineEditableField';
import { FileOverviewTab } from '../components/FileOverviewTab';
import { FileFinancialsTab } from '../components/FileFinancialsTab';
import { FileLogisticsTab } from '../components/FileLogisticsTab';
import { FileHistoryTab } from '../components/FileHistoryTab';
import { FileEditModal } from '../components/FileEditModal';
import { FileStageModal } from '../components/FileStageModal';
import FileDocumentsTab from '../components/FileDocumentsTab';
import { AssessmentTracker } from '../components/AssessmentTracker';

const fetchFile = async (id: string) => {
  const res = await api.get(`/files/${id}`);
  return res.data;
};

export default function FileDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [showEdit, setShowEdit] = useState(false);
  const [showStage, setShowStage] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const { data: fileRes, isLoading, isError } = useQuery({
    queryKey: ['file', id],
    queryFn: () => fetchFile(id!),
    enabled: !!id,
  });

  const file = fileRes?.data;

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Spin size="xl" /></div>;
  if (isError || !file) return <div className="p-8 text-center text-red-500">Error loading file details.</div>;

  const isManager = user?.userType === 'ADMIN' || user?.role === 'OWNER' || user?.role === 'MANAGER';

  const tabs = [
    {id: 'overview', label: 'Overview'},
    {id: 'assessment', label: 'Assessment'},
    {id: 'logistics', label: 'Logistics'},
    {id: 'financials', label: 'Financials'},
    {id: 'documents', label: 'Documents'},
    {id: 'history', label: 'Audit Log'},
  ];

  return (
    <div className="flex flex-col gap-6 p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-300 min-h-screen">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-3">
          <Breadcrumbs>
             <Breadcrumbs.Item onClick={() => navigate('/files')}>Files</Breadcrumbs.Item>
             <Breadcrumbs.Item>{file.fileNoFull}</Breadcrumbs.Item>
          </Breadcrumbs>
          <div className="flex items-center gap-4">
             <Button view="flat" size="l" onClick={() => navigate('/files')}>
               <Icon data={ArrowLeft} size={20} />
             </Button>
             <div className="flex flex-col">
                <Text variant="display-2" className="font-extrabold tracking-tighter uppercase italic">{file.fileNoFull}</Text>
                <div className="flex items-center gap-2">
                   <Label theme="info" size="m">{file.status.replace(/_/g, ' ')}</Label>
                   <Text color="secondary" className="opacity-50 text-[10px] uppercase font-bold tracking-widest leading-none">
                     Mission ID: {file._id}
                   </Text>
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/40 p-2 rounded-2xl border border-white/5">
           <Button view="flat-secondary" size="l" onClick={() => setShowSidebar(!showSidebar)}>
             <Icon data={LayoutSideContent} size={18} />
           </Button>
           <Button view="flat-secondary" size="l" onClick={() => setShowEdit(true)}>Edit Details</Button>
           <Button view="action" size="l" onClick={() => setShowStage(true)}>Process Stage</Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-2 border-b border-white/5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative ${
              activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            )}
          </button>
        ))}
      </div>

      {/* Main Layout Grid */}
      <div className={`grid grid-cols-1 ${showSidebar ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-8`}>
        {/* Main Content Area */}
        <div className={showSidebar ? 'lg:col-span-3 space-y-8' : 'space-y-8'}>
          {activeTab === 'overview' && (
            <FileOverviewTab 
              file={file} 
              onViewHistory={() => setActiveTab('history')}
              onEdit={() => setShowEdit(true)}
            />
          )}
          {activeTab === 'assessment' && (
            <AssessmentTracker 
              fileId={id!} 
              assessment={file.assessment || { nodes: [] }} 
            />
          )}
          {activeTab === 'logistics' && <FileLogisticsTab file={file} />}
          {activeTab === 'financials' && (
            <FileFinancialsTab 
              fileId={file._id} 
              isManager={isManager} 
            />
          )}
          {activeTab === 'documents' && (
            <FileDocumentsTab 
              file={file} 
              fileId={id!} 
            />
          )}
          {activeTab === 'history' && (
            <FileHistoryTab 
              history={file.statusHistory || []} 
            />
          )}
        </div>

        {/* Right Sidebar */}
        {showSidebar && (
          <div className="flex flex-col gap-4 self-start sticky top-8">
            <Card className="p-4 flex flex-col gap-4 bg-slate-900/40 rounded-xl border-white/5 shadow-xl">
              <Text variant="header-2" className="uppercase tracking-widest opacity-50 text-[9px] font-black">Mission Meta</Text>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                  <Text variant="caption-1" color="secondary" className="opacity-40 text-[9px] mb-0.5 uppercase tracking-widest">Importer</Text>
                  <Text variant="body-2" className="font-bold text-indigo-300 text-sm whitespace-nowrap overflow-hidden text-ellipsis">{file.clientId?.name}</Text>
                </div>

                <InlineEditableField 
                  fileId={file._id} 
                  fieldName="exporterName" 
                  label="Exporter" 
                  value={file.exporterName} 
                  placeholder="Exporter Name"
                />

                <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                  <InlineEditableField 
                    fileId={file._id} 
                    fieldName="blNo" 
                    label="B/L Number" 
                    value={file.blNo} 
                    placeholder="BL-XXXX"
                  />
                  <InlineEditableField 
                    fileId={file._id} 
                    fieldName="blDate" 
                    label="B/L Date" 
                    value={file.blDate} 
                    type="date"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                  <InlineEditableField 
                    fileId={file._id} 
                    fieldName="hsCode" 
                    label="HS Code" 
                    value={file.hsCode} 
                    placeholder="XXXX.XX.XX"
                  />
                  <InlineEditableField 
                    fileId={file._id} 
                    fieldName="countryOfOrigin" 
                    label="Origin" 
                    value={file.countryOfOrigin} 
                    placeholder="Country"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4 flex flex-col gap-4 bg-slate-900/40 rounded-xl border-white/5 shadow-xl">
              <Text variant="header-2" className="uppercase tracking-widest opacity-50 text-[9px] font-black">Quick Summary</Text>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <InlineEditableField 
                    fileId={file._id} 
                    fieldName="invoiceValue" 
                    label="Value" 
                    value={file.invoiceValue} 
                    type="number"
                  />
                  <InlineEditableField 
                    fileId={file._id} 
                    fieldName="currency" 
                    label="Currency" 
                    value={file.currency} 
                    placeholder="USD"
                  />
                </div>

                <div className="flex justify-between items-center cursor-pointer hover:bg-white/5 border-t border-white/5 pt-3 mt-1" onClick={() => setActiveTab('financials')}>
                  <Text variant="caption-1" color="secondary" className="opacity-40 text-[9px] uppercase tracking-widest">Total Expense</Text>
                  <Text variant="body-1" className="font-bold text-red-100/60 text-xs">
                    {file.totalExpenses ? file.totalExpenses.toLocaleString() : '0'} BDT
                  </Text>
                </div>
                
                <div className="flex justify-between items-center border-t border-white/5 pt-3">
                  <Text variant="caption-1" color="secondary" className="opacity-40 text-[9px] uppercase tracking-widest">Status</Text>
                  <Label theme="info" size="s" className="font-black text-[9px] tracking-tighter uppercase">{file.status.replace(/_/g, ' ')}</Label>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-slate-900/40 rounded-xl border-white/5 shadow-xl group">
              <div className="flex justify-between items-center mb-2">
                <Text variant="header-2" className="uppercase tracking-widest opacity-50 text-[9px] font-black">Notes</Text>
                <Icon data={ChevronRight} size={12} className="opacity-0 group-hover:opacity-20 transition-opacity" />
              </div>
              <div className="p-3 bg-indigo-500/5 rounded-lg text-[11px] italic text-indigo-200/40 border border-indigo-500/10 line-clamp-4">
                {file.description || 'No notes archived.'}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Modals */}
      <FileEditModal open={showEdit} onClose={() => setShowEdit(false)} file={file} />
      <FileStageModal open={showStage} onClose={() => setShowStage(false)} file={file} />
    </div>
  );
}
