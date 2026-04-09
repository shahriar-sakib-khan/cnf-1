import { useState, useMemo } from 'react';
import {
  useMyFinancials,
  useAllRequests,
  useApproveRequest,
  useRejectRequest,
  useArchiveRequest,
  useUnarchiveRequest,
  useAllExpenses,
  useExpenseCategories
} from '../hooks/useFinance';
import { useFiles } from '../../files/hooks/useFiles';
import { useStaff } from '../hooks/useStaff';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { Text, Button, Card, Icon, Spin } from '@gravity-ui/uikit';
import { Plus, CreditCard, Archive } from '@gravity-ui/icons';

import FinanceRequestRow from '../components/FinanceRequestRow';
import ExpenseRow from '../components/ExpenseRow';
import ColumnFilter from '../components/ColumnFilter';
import RequestMoneyModal from '../components/RequestMoneyModal';
import GlobalAddExpenseModal from '../components/GlobalAddExpenseModal';
import StaffFinancialsModal from '../components/StaffFinancialsModal';
import FileFinancialsModal from '../../file/components/FileFinancialsModal';
import ReceiptViewModal from '../components/ReceiptViewModal';
import { formatMoney } from '../../../common/utils/money';

export default function FinancePage() {
  const { user } = useAuthStore();
  const isManager = user?.role === 'OWNER' || user?.role === 'MANAGER';

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState<'requisitions' | 'expenses'>('requisitions');

  // Filter states
  const [filterFile, setFilterFile] = useState<string | null>(null);
  const [filterRequester, setFilterRequester] = useState<string | null>(null);
  const [filterApprover, setFilterApprover] = useState<string | null>(null);
  const [filterReqDate, setFilterReqDate] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState<string | null>(null);
  const [filterAccDate, setFilterAccDate] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Toggle handlers
  const handleFilterFile = (v: string) => setFilterFile(p => p === v ? null : v);
  const handleFilterRequester = (v: string) => setFilterRequester(p => p === v ? null : v);
  const handleFilterApprover = (v: string) => setFilterApprover(p => p === v ? null : v);
  const handleFilterReqDate = (v: string) => setFilterReqDate(p => p === v ? null : v);
  const handleFilterClient = (v: string) => setFilterClient(p => p === v ? null : v);
  const handleFilterAccDate = (v: string) => setFilterAccDate(p => p === v ? null : v);
  const handleFilterCategory = (v: string) => setFilterCategory(p => p === v ? null : v);

  // Ledger states
  const [ledgerStaffUser, setLedgerStaffUser] = useState<any>(null);
  const [ledgerFileItem, setLedgerFileItem] = useState<any>(null);

  // Hooks
  const { data: myData, isLoading: myLoading } = useMyFinancials();
  const { data: allRequests, isLoading: allLoading } = useAllRequests(undefined, showArchived);
  const { data: allExpenses, isLoading: expensesLoading } = useAllExpenses();
  const { data: filesData } = useFiles({ limit: 100 });
  const { data: allStaff } = useStaff();
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const archiveRequest = useArchiveRequest();
  const unarchiveRequest = useUnarchiveRequest();

  const fileOptions = (filesData?.files || []).map((f: any) => ({
    value: f._id,
    content: `${f.fileNoFull} — ${f.clientId?.name ?? ''}`,
  }));

  const requestsList = isManager ? (allRequests || []) : (myData?.requests || []);
  const reqListLoading = isManager ? allLoading : myLoading;

  const expensesList = isManager ? (allExpenses || []) : (myData?.expenses || []);
  const expListLoading = isManager ? expensesLoading : myLoading;

  const currentListLoading = activeTab === 'requisitions' ? reqListLoading : expListLoading;

  // Filter Active View
  let displayData: any[] = activeTab === 'requisitions'
    ? (isManager ? requestsList : requestsList.filter((r: any) => r.isArchived === showArchived))
    : expensesList;

  if (filterFile) {
    if (filterFile === 'GENERAL') {
      displayData = displayData.filter((r: any) => !r.fileId);
    } else {
      displayData = displayData.filter((r: any) => r.fileId?._id === filterFile);
    }
  }
  if (filterRequester) {
    displayData = displayData.filter((r: any) => r.staffId?._id === filterRequester);
  }
  if (filterClient) {
    displayData = displayData.filter((r: any) => r.fileId?.clientId?._id === filterClient);
  }
  if (filterReqDate) {
    displayData = displayData.filter((r: any) => {
      const dateStr = new Date(r.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
      return dateStr === filterReqDate;
    });
  }
  if (activeTab === 'expenses' && filterCategory) {
    displayData = displayData.filter((r: any) => r.category?._id === filterCategory);
  }
  if (activeTab === 'requisitions') {
    if (filterApprover) {
      displayData = displayData.filter((r: any) => r.approvedBy?._id === filterApprover);
    }
    if (filterAccDate) {
      displayData = displayData.filter((r: any) => {
        if (!r.approvedAt) return false;
        const dateStr = new Date(r.approvedAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
        return dateStr === filterAccDate;
      });
    }
  }

  // Sort: PENDING first (if requests), then by date desc
  const sortedData = [...displayData].sort((a: any, b: any) => {
    if (activeTab === 'requisitions') {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calculate pending counts for all staff to show "!" indicators
  const pendingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (allRequests || []).forEach((r: any) => {
      if (r.status === 'PENDING' && r.staffId?._id) {
        counts[r.staffId._id] = (counts[r.staffId._id] || 0) + 1;
      }
    });
    return counts;
  }, [allRequests]);

  // ── Derive unique filter options from data ─────────────────
  const sourceData = activeTab === 'requisitions' ? requestsList : expensesList;

  const { data: categories = [] } = useExpenseCategories();

  const fileFilterOptions = useMemo(() => {
    const seen = new Map<string, string>();
    seen.set('GENERAL', 'General Expense');
    for (const r of sourceData as any[]) {
      if (r.fileId?._id && r.fileId?.fileNoFull) {
        seen.set(r.fileId._id, r.fileId.fileNoFull);
      }
    }
    return Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
  }, [sourceData]);

  const clientFilterOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of sourceData as any[]) {
      const c = r.fileId?.clientId;
      if (c?._id && c?.name) seen.set(c._id, c.name);
    }
    return Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
  }, [sourceData]);

  const requesterFilterOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of sourceData as any[]) {
      if (r.staffId?._id) seen.set(r.staffId._id, r.staffId.name || r.staffId.email || 'Unknown');
    }
    return Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
  }, [sourceData]);

  // Approved By: all managers & owners from staff list (not just those in data)
  const approverFilterOptions = useMemo(() => {
    return (allStaff || [])
      .filter((s: any) => s.role === 'MANAGER' || s.role === 'OWNER')
      .map((s: any) => ({ value: s._id, label: `${s.name || s.email || 'Unknown'} (${s.role})` }));
  }, [allStaff]);

  const categoryFilterOptions = useMemo(() =>
    categories.map(c => ({ label: c.name, value: c._id })),
  [categories]);

  const reqDateFilterOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const r of sourceData as any[]) {
      seen.add(new Date(r.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' }));
    }
    return Array.from(seen).map(d => ({ value: d, label: d }));
  }, [sourceData]);

  const accDateFilterOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const r of requestsList as any[]) {
      if (r.approvedAt) seen.add(new Date(r.approvedAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' }));
    }
    return Array.from(seen).map(d => ({ value: d, label: d }));
  }, [requestsList]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-8 pb-6">
        <div>
          <Text variant="display-2" className="block font-bold leading-tight">Financials</Text>
          <Text variant="body-2" color="secondary" className="block mt-1">
            Manage your wallet and track money requests or expenses.
          </Text>
        </div>
        <div className="flex items-center gap-3">
          {isManager && activeTab === 'requisitions' && (
            <Button view={showArchived ? "outlined-action" : "flat"} size="l" onClick={() => setShowArchived(!showArchived)}>
              <Icon data={Archive} className="mr-2" size={16} />
              {showArchived ? "Viewing Archived" : "View Archived"}
            </Button>
          )}
          <Button view="action" size="l" onClick={() => activeTab === 'requisitions' ? setRequestModalOpen(true) : setExpenseModalOpen(true)} className="flex-shrink-0">
            <Icon data={Plus} className="mr-2" size={16} />
            {activeTab === 'requisitions' ? 'Request Money' : 'Add Expense'}
          </Button>
        </div>
      </div>

      {/* Wallet Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 pb-4">
        <Card theme="info" view="filled" className="p-6 border-none shadow-sm rounded-xl">
          <Text className="block text-sm uppercase font-bold tracking-wider mb-2 text-indigo-100">My Wallet Balance</Text>
          <div className="flex items-center gap-3">
            <Icon data={CreditCard} size={24} className="text-white" />
            <Text variant="display-1" className="font-bold text-white">{formatMoney(myData?.balance ?? 0)}</Text>
          </div>
        </Card>

        <Card view="raised" className="p-6 border-l-4 border-l-amber-500 bg-amber-500/5">
          <Text color="secondary" className="block text-sm uppercase font-bold tracking-wider mb-2">Pending Requests</Text>
          <Text variant="display-1" className="font-bold">
            {myData?.requests.filter((r: any) => r.status === 'PENDING').length ?? 0}
          </Text>
        </Card>

        <Card view="raised" className="p-6">
          <Text color="secondary" className="block text-sm uppercase font-bold tracking-wider mb-2">Total Expenses (Month)</Text>
          <Text variant="display-1" className="font-bold">
            {formatMoney((myData?.expenses ?? []).reduce((acc: number, e: any) => acc + e.amount, 0))}
          </Text>
        </Card>
      </div>

      {/* ── Mode Toggle (between cards and table) ── */}
      <div className="flex items-center gap-0 px-6 mb-3">
        <div className="flex items-stretch bg-[var(--g-color-base-generic)] rounded-xl border border-[var(--g-color-line-generic)] overflow-hidden">
          <button
            className={`min-w-[140px] px-5 py-2.5 text-base font-semibold transition-colors ${activeTab === 'requisitions' ? 'bg-indigo-600 text-white' : 'text-[var(--g-color-text-secondary)] hover:bg-[var(--g-color-base-generic-hover)]'}`}
            onClick={() => setActiveTab('requisitions')}
          >
            Requisitions
          </button>
          <div className="w-px bg-[var(--g-color-line-generic)]" />
          <button
            className={`min-w-[140px] px-5 py-2.5 text-base font-semibold transition-colors ${activeTab === 'expenses' ? 'bg-indigo-600 text-white' : 'text-[var(--g-color-text-secondary)] hover:bg-[var(--g-color-base-generic-hover)]'}`}
            onClick={() => setActiveTab('expenses')}
          >
            Expenses
          </button>
        </div>
      </div>

      <div className={`flex flex-col flex-1 min-h-0 mx-6 mb-6 rounded-2xl border border-[var(--g-color-line-generic)] overflow-hidden transition-colors ${activeTab === 'expenses' ? 'bg-red-500/[0.03] border-red-500/20' : 'bg-[var(--g-color-base-float)]'} ${showArchived ? 'opacity-70 border-dashed' : ''}`}>
        {/* Table Headers with ColumnFilter */}
        <div
          className={`hidden lg:grid gap-x-3 px-6 lg:px-8 py-3 border-b border-[var(--g-color-line-generic)] items-center transition-colors ${activeTab === 'expenses' ? 'bg-red-500/10' : 'bg-[var(--g-color-base-generic)]'}`}
          style={{
            gridTemplateColumns: activeTab === 'requisitions'
              ? '40px 1.8fr 2fr 1.5fr 1.6fr 100px 140px 140px'
              : '40px 2fr 2fr 1.5fr 1.8fr minmax(130px,1.4fr) minmax(145px,1.4fr)'
          }}
        >
          {/* Col 0: SL */}
          <div className="flex justify-center">
            <span className="text-[14px] font-bold uppercase tracking-wider text-[var(--g-color-text-secondary)]">SL</span>
          </div>

          {/* Col 1: File + Client */}
          <div>
            <ColumnFilter
              label="File"
              options={fileFilterOptions}
              activeValue={filterFile}
              onSelect={v => setFilterFile(v)}
              label2="Client"
              options2={clientFilterOptions}
              activeValue2={filterClient}
              onSelect2={v => setFilterClient(v)}
            />
          </div>

          {/* Col 2: Date */}
          <div>
            <ColumnFilter
              label="Date"
              options={reqDateFilterOptions}
              activeValue={filterReqDate}
              onSelect={v => setFilterReqDate(v)}
              isDatePicker={true}
            />
          </div>

          {/* Col 3: Purpose / Category */}
          <div className="pl-2">
             {activeTab === 'requisitions' ? (
                <span className="text-[14px] font-bold uppercase tracking-wider text-[var(--g-color-text-secondary)]">Purpose</span>
             ) : (
                <ColumnFilter
                  label="Category"
                  options={categoryFilterOptions}
                  activeValue={filterCategory}
                  onSelect={v => setFilterCategory(v)}
                />
             )}
          </div>

          {/* Col 4: Staff / Approved By */}
          <div>
            {activeTab === 'requisitions' ? (
              <ColumnFilter
                label="Approved By"
                options={approverFilterOptions}
                activeValue={filterApprover}
                onSelect={v => setFilterApprover(v)}
                label2="Approved Date"
                options2={accDateFilterOptions}
                activeValue2={filterAccDate}
                onSelect2={v => setFilterAccDate(v)}
                isDatePicker2={true}
              />
            ) : (
              <ColumnFilter
                label="Staff"
                options={requesterFilterOptions}
                activeValue={filterRequester}
                onSelect={v => setFilterRequester(v)}
              />
            )}
          </div>

          {/* Col 5: Requested / Empty */}
          {activeTab === 'requisitions' && (
            <div className="text-right">
              <span className="text-[14px] font-bold uppercase tracking-wider text-[var(--g-color-text-secondary)]">Requested</span>
            </div>
          )}

          {/* Col 6: Granted / Amount */}
          <div className="text-right">
            <span className="text-[14px] font-bold uppercase tracking-wider text-[var(--g-color-text-secondary)]">
              {activeTab === 'requisitions' ? 'Granted' : 'Amount'}
            </span>
          </div>

          {/* Col 7: Status / Actions / Receipt */}
          <div className="text-right">
            <span className="text-[14px] font-bold uppercase tracking-wider text-[var(--g-color-text-secondary)]">
              {activeTab === 'requisitions' ? 'Status / Actions' : 'Receipt / Actions'}
            </span>
          </div>
        </div>

        {/* List area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {currentListLoading ? (
            <div className="p-12 flex justify-center"><Spin size="l" /></div>
          ) : sortedData.length === 0 ? (
            <div className="p-12 flex flex-col items-center gap-3">
              <Text color="secondary">No records found.</Text>
            </div>
          ) : (
            <div>
              {sortedData.map((r: any, idx: number) => (
                activeTab === 'requisitions' ? (
                  <FinanceRequestRow
                    key={r._id}
                    r={r}
                    index={idx}
                    isManager={isManager}
                    onApprove={(id: string, grantedAmount: number) => approveRequest.mutate({ id, grantedAmount } as any)}
                    onReject={(id: string) => rejectRequest.mutate(id)}
                    onArchive={(id: string) => archiveRequest.mutate(id)}
                    onUnarchive={(id: string) => unarchiveRequest.mutate(id)}
                    onFilterFile={handleFilterFile}
                    onFilterRequester={handleFilterRequester}
                    onFilterApprover={handleFilterApprover}
                    onFilterReqDate={handleFilterReqDate}
                    onFilterClient={handleFilterClient}
                    onFilterAccDate={handleFilterAccDate}
                    onViewStaffLedger={setLedgerStaffUser}
                    onViewFileLedger={setLedgerFileItem}
                    approving={approveRequest.isPending}
                    rejecting={rejectRequest.isPending}
                    archiving={archiveRequest.isPending}
                    unarchiving={unarchiveRequest.isPending}
                    hasPendingAlert={pendingCounts[r.staffId?._id] > 0}
                    activeFilters={{
                      file: filterFile,
                      requester: filterRequester,
                      approver: filterApprover,
                      reqDate: filterReqDate,
                      client: filterClient,
                      accDate: filterAccDate
                    }}
                  />
                ) : (
                   <ExpenseRow
                    key={r._id}
                    expense={r}
                    index={idx}
                    onViewFileLedger={setLedgerFileItem}
                    onViewStaffLedger={setLedgerStaffUser}
                    onFilterFile={handleFilterFile}
                    onFilterClient={handleFilterClient}
                    onFilterReqDate={handleFilterReqDate}
                    onFilterStaff={handleFilterRequester}
                    onFilterCategory={handleFilterCategory}
                    onViewReceipt={setReceiptUrl}
                    activeFilters={{
                      file: filterFile,
                      client: filterClient,
                      reqDate: filterReqDate,
                      requester: filterRequester,
                      category: filterCategory
                    }}
                  />
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <RequestMoneyModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        fileOptions={fileOptions}
      />

      <GlobalAddExpenseModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        fileOptions={fileOptions}
      />

      <StaffFinancialsModal
        staff={ledgerStaffUser}
        open={!!ledgerStaffUser}
        onClose={() => setLedgerStaffUser(null)}
      />

      <FileFinancialsModal
        fileItem={ledgerFileItem}
        open={!!ledgerFileItem}
        onClose={() => setLedgerFileItem(null)}
        context={activeTab}
      />

      <ReceiptViewModal
        url={receiptUrl}
        onClose={() => setReceiptUrl(null)}
      />
    </div>
  );
}
