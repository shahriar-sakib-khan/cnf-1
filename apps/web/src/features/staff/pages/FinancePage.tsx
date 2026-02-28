import { useState } from 'react';
import {
  useMyFinancials,
  useRequestMoney,
  useAllRequests,
  useApproveRequest,
  useRejectRequest
} from '../hooks/useFinance';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import {
  Text,
  Button,
  Card,
  Icon,
  Label,
  Spin,
  TextInput,
  Table,
  Modal,
  SegmentedRadioGroup,
} from '@gravity-ui/uikit';
import {
  Plus, CircleCheck, CircleXmark, CreditCard
} from '@gravity-ui/icons';

export default function FinancePage() {
  const { user } = useAuthStore();
  const isManager = user?.role === 'OWNER' || user?.role === 'MANAGER';

  const [activeTab, setActiveTab] = useState('my-requests');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');

  // Hooks
  const { data: myData, isLoading: myLoading } = useMyFinancials();
  const { data: allRequests, isLoading: allLoading } = useAllRequests();
  const requestMoney = useRequestMoney();
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();

  const handleRequestSubmit = () => {
    requestMoney.mutate({
      amount: parseInt(amount),
      purpose
    }, {
      onSuccess: () => {
        setRequestModalOpen(false);
        setAmount('');
        setPurpose('');
      }
    });
  };

  const tabs = [
    { id: 'my-requests', title: 'My Requests' },
    ...(isManager ? [{ id: 'all-requests', title: 'Pending Approval' }] : []),
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 w-full">
      <div className="flex justify-between items-center">
        <div>
          <Text variant="display-1" className="font-bold">Finance & Wallet</Text>
          <Text variant="body-2" color="secondary" className="block mt-1">
            Manage your wallet and track money requests.
          </Text>
        </div>
        <Button view="action" size="l" onClick={() => setRequestModalOpen(true)}>
          <Icon data={Plus} className="mr-2" size={16} />
          Request Money
        </Button>
      </div>

      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card view="raised" className="p-6 border-l-4 border-l-indigo-500 bg-indigo-500/5">
          <Text color="secondary" className="block text-xs uppercase font-bold mb-1">My Wallet Balance</Text>
          <div className="flex items-center gap-3">
            <Icon data={CreditCard} size={28} className="text-indigo-400" />
            <Text variant="display-1" className="font-bold">৳ {user?.balanceTaka?.toLocaleString()}</Text>
          </div>
        </Card>

        <Card view="raised" className="p-6">
          <Text color="secondary" className="block text-xs uppercase font-bold mb-1">Pending Requests</Text>
          <Text variant="header-2" className="font-bold">
            {myData?.requests.filter(r => r.status === 'PENDING').length || 0}
          </Text>
        </Card>

        <Card view="raised" className="p-6">
          <Text color="secondary" className="block text-xs uppercase font-bold mb-1">Total Expenses (Month)</Text>
          <Text variant="header-2" className="font-bold">
             ৳ {myData?.expenses.reduce((acc, e) => acc + e.amount, 0).toLocaleString()}
          </Text>
        </Card>
      </div>

      <div className="space-y-4">
        <SegmentedRadioGroup
          value={activeTab}
          options={tabs.map(t => ({ value: t.id, content: t.title }))}
          onUpdate={setActiveTab}
          size="l"
        />

        {activeTab === 'my-requests' && (
          <Card view="raised" className="overflow-hidden">
            {myLoading ? (
               <div className="p-10 flex justify-center"><Spin size="l" /></div>
            ) : (
               <Table
                 data={myData?.requests || []}
                 columns={[
                    { id: 'date', name: 'Date', template: (r) => new Date(r.createdAt).toLocaleDateString() },
                    { id: 'amount', name: 'Amount', template: (r) => `৳ ${r.amount.toLocaleString()}`, align: 'right' },
                    { id: 'purpose', name: 'Purpose' },
                    { id: 'status', name: 'Status', template: (r) => (
                      <Label theme={r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'warning' : 'danger'}>
                        {r.status}
                      </Label>
                    )},
                 ]}
               />
            )}
          </Card>
        )}

        {activeTab === 'all-requests' && (
           <Card view="raised" className="overflow-hidden">
             {allLoading ? (
                <div className="p-10 flex justify-center"><Spin size="l" /></div>
             ) : (
                <Table
                  data={allRequests || []}
                  columns={[
                     { id: 'staff', name: 'Staff', template: (r: any) => r.requesterId?.name || 'Unknown' },
                     { id: 'date', name: 'Date', template: (r) => new Date(r.createdAt).toLocaleDateString() },
                     { id: 'amount', name: 'Amount', template: (r) => `৳ ${r.amount.toLocaleString()}`, align: 'right' },
                     { id: 'purpose', name: 'Purpose' },
                     { id: 'actions', name: '', template: (r) => (
                        <div className="flex gap-2 justify-end">
                           <Button
                             view="outlined-success"
                             size="s"
                             onClick={() => approveRequest.mutate(r._id)}
                             loading={approveRequest.isPending}
                           >
                             <Icon data={CircleCheck} size={14} className="mr-1" /> Approve
                           </Button>
                           <Button
                             view="outlined-danger"
                             size="s"
                             onClick={() => rejectRequest.mutate(r._id)}
                             loading={rejectRequest.isPending}
                           >
                             <Icon data={CircleXmark} size={14} className="mr-1" /> Reject
                           </Button>
                        </div>
                     )}
                  ]}
                />
             )}
           </Card>
        )}
      </div>

      {/* Request Modal */}
      <Modal open={requestModalOpen} onClose={() => setRequestModalOpen(false)}>
        <div className="p-8 flex flex-col gap-6 w-[450px] bg-[var(--g-color-base-background)] rounded-2xl">
          <div>
            <Text variant="display-1" className="block font-bold">Request Money</Text>
            <Text variant="body-2" color="secondary" className="block mt-1">Submit a request to the store manager.</Text>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>Amount (Taka)</Label>
              <TextInput
                 type="number"
                 placeholder="0"
                 size="l"
                 value={amount}
                 onUpdate={setAmount}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Purpose / Description</Label>
              <TextInput
                 placeholder="e.g. Fuel for delivery truck"
                 size="l"
                 value={purpose}
                 onUpdate={setPurpose}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button view="flat" size="l" onClick={() => setRequestModalOpen(false)}>Cancel</Button>
            <Button
              view="action"
              size="l"
              onClick={handleRequestSubmit}
              disabled={!amount || !purpose}
              loading={requestMoney.isPending}
            >
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
