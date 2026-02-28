import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Button, Text, TabProvider, TabList, Tab, Card, Label, Icon, Spin, Breadcrumbs
} from '@gravity-ui/uikit';
import { ArrowLeft, Magnet, Archive, Check } from '@gravity-ui/icons';
import axios from 'axios';

// Move to a separate file later if needed
const fetchFile = async (id: string) => {
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/files/${id}`, { withCredentials: true });
  return res.data;
};

export default function FileDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: fileRes, isLoading, isError } = useQuery({
    queryKey: ['file', id],
    queryFn: () => fetchFile(id!),
    enabled: !!id,
  });

  const file = fileRes?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="xl" />
      </div>
    );
  }

  if (isError || !file) {
    return (
      <div className="p-8 text-center">
        <Text variant="body-2" color="danger">Failed to load file details.</Text>
        <Button className="mt-4" onClick={() => navigate('/files')}>Back to Files</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8 max-w-[1400px] mx-auto w-full animate-in fade-in duration-300">
      {/* Breadcrumbs & Simple Header */}
      <div className="flex items-center gap-4">
        <Button view="flat" size="l" onClick={() => navigate('/files')}>
          <Icon data={ArrowLeft} size={18} />
        </Button>
        <Breadcrumbs>
          <Breadcrumbs.Item onClick={() => navigate('/files')}>Files</Breadcrumbs.Item>
          <Breadcrumbs.Item>{file.fileNoFull}</Breadcrumbs.Item>
        </Breadcrumbs>
      </div>

      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <Text variant="display-2" className="font-bold">{file.fileNoFull}</Text>
            <Label theme="info" size="m">{file.status.replace('_', ' ')}</Label>
          </div>
          <Text variant="body-2" color="secondary">{file.description || 'No description provided'}</Text>
        </div>
        <div className="flex gap-3">
          <Button view="normal" size="l">Edit Details</Button>
          <Button view="action" size="l">Process Stage</Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-1">
            <TabProvider value={activeTab} onUpdate={(val) => setActiveTab(val)}>
              <TabList>
                <Tab value="overview">Overview</Tab>
                <Tab value="logistics">Logistics</Tab>
                <Tab value="financials">Financials</Tab>
                <Tab value="documents">Documents</Tab>
                <Tab value="history">History</Tab>
              </TabList>
            </TabProvider>
          </Card>

          <Card className="p-8 min-h-[400px]">
             {activeTab === 'overview' && (
               <div className="flex flex-col gap-8">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="flex flex-col gap-2">
                       <Text variant="subheader-2" className="text-indigo-400 border-b pb-2">Client Details</Text>
                       <div className="flex items-center gap-3 mt-2">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                             <Icon data={Magnet} className="text-indigo-400" />
                          </div>
                          <div>
                             <Text variant="body-2" className="font-bold block">{file.clientId?.name}</Text>
                             <Text variant="caption-2" color="secondary">{file.clientId?.email}</Text>
                          </div>
                       </div>
                    </div>
                    <div className="flex flex-col gap-2">
                       <Text variant="subheader-2" className="text-indigo-400 border-b pb-2">Shipment Info</Text>
                       <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                             <Text variant="caption-1" color="secondary">B/L Number</Text>
                             <Text variant="body-2" className="font-mono mt-0.5">{file.blNo}</Text>
                          </div>
                          <div>
                             <Text variant="caption-1" color="secondary">B/L Date</Text>
                             <Text variant="body-2" className="mt-0.5">
                                {new Date(file.blDate).toLocaleDateString()}
                             </Text>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col gap-4">
                    <Text variant="subheader-2" className="text-indigo-400 border-b pb-2">Current Processing Status</Text>
                    <div className="flex items-center justify-between p-4 bg-[var(--g-color-base-generic-hover)] rounded-xl border border-[var(--g-color-line-generic)]">
                       <div className="flex items-center gap-4">
                          <Icon data={Check} size={24} className="text-green-400" />
                          <div>
                             <Text variant="body-2" className="font-bold block">File Created</Text>
                             <Text variant="caption-1" color="secondary">Initiated by {file.createdBy?.name || 'System'}</Text>
                          </div>
                       </div>
                       <Button size="s" view="flat-info">View Log</Button>
                    </div>
                 </div>
               </div>
             )}

             {activeTab === 'logistics' && (
               <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                 <Icon data={Archive} size={48} className="text-[var(--g-color-text-secondary)] opacity-20" />
                 <Text variant="subheader-2" color="secondary">Logistics details are not yet added.</Text>
                 <Button view="action">Edit Ship Information</Button>
               </div>
             )}

             {activeTab === 'financials' && (
               <div className="flex items-center justify-center py-20 text-center">
                 <Text variant="subheader-2" color="secondary">Financial assessment in progress.</Text>
               </div>
             )}

             {/* Add more tab content as needed */}
          </Card>
        </div>

        {/* Right Col: Side Info */}
        <div className="flex flex-col gap-6">
           <Card className="p-6 flex flex-col gap-6">
              <Text variant="header-2">Quick Summary</Text>

              <div className="flex flex-col gap-4">
                 <div className="flex justify-between items-center">
                    <Text variant="body-2" color="secondary">Total Value</Text>
                    <Text variant="subheader-2" className="font-bold">
                       {file.invoiceValue.toLocaleString()} {file.currency}
                    </Text>
                 </div>
                 <div className="flex justify-between items-center">
                    <Text variant="body-2" color="secondary">HS Code</Text>
                    <Text variant="body-2">{file.hsCode || '—'}</Text>
                 </div>
                 <div className="flex justify-between items-center">
                    <Text variant="body-2" color="secondary">Created On</Text>
                    <Text variant="body-2">
                       {new Date(file.createdAt).toLocaleDateString()}
                    </Text>
                 </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                 <Label theme="success" className="w-full justify-center py-1">ACID Verified</Label>
              </div>
           </Card>

           <Card className="p-6">
              <Text variant="header-1" className="mb-4">Internal Notes</Text>
              <div className="p-4 bg-[var(--g-color-base-info-lightest)] rounded-lg text-sm italic text-[var(--g-color-text-info)]">
                 No internal notes for this file.
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
