import { useState } from 'react';
import { Button, Text, Spin, Icon, Card, TextInput } from '@gravity-ui/uikit';
import { Plus, Person, Persons, ChartBar, Xmark } from '@gravity-ui/icons';
import { useClients, useDeleteClient, useClientStats } from '../hooks/useClients';
import type { Client } from '../hooks/useClients';
import CreateClientModal from '../components/CreateClientModal';
import EditClientModal from '../components/EditClientModal';
import ClientFilesModal from '../components/ClientFilesModal';

import ClientRow from '../components/ClientRow';

export default function ClientListPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalClient, setEditModalClient] = useState<Client | null>(null);
  const [filesModalClient, setFilesModalClient] = useState<Client | null>(null);

  const [page] = useState(1);
  const [addressSearch, setAddressSearch] = useState('');
  const { data, isLoading, isError } = useClients(page, 50);
  const { data: stats, isLoading: statsLoading } = useClientStats();
  const deleteClient = useDeleteClient();

  const allClients: Client[] = data?.data || [];

  // Client-side filtering for address
  const clients = allClients.filter(c =>
    !addressSearch || (c.address && c.address.toLowerCase().includes(addressSearch.toLowerCase()))
  );

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClient.mutate(id);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-start px-6 pt-6">
        <div>
          <Text variant="display-2" className="block font-bold leading-tight">Client Directory</Text>
          <Text variant="body-2" color="secondary" className="block mt-1">
            Maintain your importer and exporter relationships and track their operational footprint.
          </Text>
        </div>
        <Button view="action" size="l" onClick={() => setCreateModalOpen(true)}>
          <Button.Icon><Plus /></Button.Icon>
          Add Client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6">
          <Card view="raised" className="p-5 bg-indigo-500/5 border-indigo-500/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                  <Icon data={Persons} size={24} className="text-indigo-400" />
              </div>
              <div>
                  <Text variant="caption-2" color="secondary" className="block uppercase font-bold tracking-wider mb-0.5">Total Clients</Text>
                  {statsLoading ? <Spin size="xs" /> : <Text variant="header-2" className="font-bold">{stats?.total || 0}</Text>}
              </div>
          </Card>
          <Card view="raised" className="p-5 bg-emerald-500/5 border-emerald-500/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Icon data={ChartBar} size={24} className="text-emerald-500" />
              </div>
              <div>
                  <Text variant="caption-2" color="secondary" className="block uppercase font-bold tracking-wider mb-0.5">New This Month</Text>
                  {statsLoading ? <Spin size="xs" /> : <Text variant="header-2" className="font-bold text-emerald-500">+{stats?.newThisMonth || 0}</Text>}
              </div>
          </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 px-6 pb-2">
        <div className="w-full md:w-80">
          <TextInput
            placeholder="Filter by business address..."
            size="l"
            value={addressSearch}
            onUpdate={setAddressSearch}
            hasClear
          />
        </div>
      </div>

      {/* State rendering */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spin size="xl" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Text variant="body-2" color="danger">Failed to load clients.</Text>
          <Button view="normal" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 border border-dashed border-[var(--g-color-line-generic)] rounded-3xl mx-6">
          <div className="w-16 h-16 rounded-2xl bg-[var(--g-color-base-generic)] flex items-center justify-center">
            <Icon data={Person} size={28} className="text-[var(--g-color-text-secondary)]" />
          </div>
          <div className="text-center">
            <Text variant="subheader-2" className="block font-bold">No clients yet</Text>
            <Text variant="body-2" color="secondary" className="block mt-1">
              Add your first importer or exporter to get started
            </Text>
          </div>
          <Button view="action" onClick={() => setCreateModalOpen(true)}>
            <Button.Icon><Plus /></Button.Icon>
            Add Client
          </Button>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 mx-6 mb-6 bg-[var(--g-color-base-float)] rounded-2xl border border-[var(--g-color-line-generic)] overflow-hidden">
          {/* Header Row */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 lg:px-12 py-4 bg-[var(--g-color-base-generic)] border-b border-[var(--g-color-line-generic)] text-xs font-bold text-[var(--g-color-text-secondary)] tracking-wider uppercase items-center">
              <div className="col-span-1">SL</div>
              <div className="col-span-2">Client Name</div>
              <div className="col-span-3">Contact Details</div>
              <div className="col-span-2">Files (Ops)</div>
              <div className="col-span-3 flex items-center gap-2">
                Business Address
                {addressSearch && (
                  <Button
                    view="flat-danger"
                    size="s"
                    onClick={() => setAddressSearch('')}
                    className="h-6 w-6 p-0 rounded-full"
                  >
                    <Icon data={Xmark} size={14} />
                  </Button>
                )}
              </div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

          <div className="flex flex-col overflow-y-auto custom-scrollbar pb-4 max-h-[70vh]">
            {clients.map((client, idx) => (
                <ClientRow
                  key={client._id}
                  index={idx}
                  client={client}
                  onDelete={handleDelete}
                  onEdit={setEditModalClient}
                  onViewFiles={setFilesModalClient}
                  onAddressClick={(addr) => setAddressSearch((prev) => (prev === addr ? '' : addr))}
                  activeAddressFilter={addressSearch}
                />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateClientModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <EditClientModal
        client={editModalClient}
        open={Boolean(editModalClient)}
        onClose={() => setEditModalClient(null)}
      />

      <ClientFilesModal
        client={filesModalClient}
        open={Boolean(filesModalClient)}
        onClose={() => setFilesModalClient(null)}
      />
    </div>
  );
}
