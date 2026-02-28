import { useState } from 'react';
import { Button, Text, Spin, Icon, Label } from '@gravity-ui/uikit';
import { Plus, Person, Smartphone, At, MapPin, TrashBin } from '@gravity-ui/icons';
import { useClients, useDeleteClient } from '../hooks/useClients';
import type { Client } from '../hooks/useClients';
import CreateClientModal from '../components/CreateClientModal';

const TYPE_COLORS = {
  IMPORTER: 'info',
  EXPORTER: 'success',
  BOTH: 'warning',
} as const;

function ClientCard({ client, onDelete }: { client: Client; onDelete: (id: string) => void }) {
  return (
    <div className="bg-[var(--g-color-base-float)] border border-[var(--g-color-line-generic)] rounded-2xl p-5 flex flex-col gap-4 hover:border-[var(--g-color-line-brand)] transition-all duration-200 hover:shadow-lg group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Icon data={Person} size={18} className="text-indigo-400" />
          </div>
          <div className="min-w-0">
            <Text variant="subheader-2" className="block truncate font-semibold">{client.name}</Text>
            <Label theme={TYPE_COLORS[client.type]} size="xs" className="mt-1">
              {client.type}
            </Label>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button view="flat" size="s" title="Delete" onClick={() => onDelete(client._id)}>
            <Icon data={TrashBin} size={14} />
          </Button>
        </div>
      </div>

      {/* Contact Details */}
      <div className="flex flex-col gap-2">
        {client.phone && (
          <div className="flex items-center gap-2">
            <Icon data={Smartphone} size={14} className="text-[var(--g-color-text-secondary)] flex-shrink-0" />
            <Text variant="body-2" color="secondary" className="truncate">{client.phone}</Text>
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-2">
            <Icon data={At} size={14} className="text-[var(--g-color-text-secondary)] flex-shrink-0" />
            <Text variant="body-2" color="secondary" className="truncate">{client.email}</Text>
          </div>
        )}
        {client.address && (
          <div className="flex items-center gap-2">
            <Icon data={MapPin} size={14} className="text-[var(--g-color-text-secondary)] flex-shrink-0" />
            <Text variant="body-2" color="secondary" className="truncate">{client.address}</Text>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientListPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [page] = useState(1);
  const { data, isLoading, isError } = useClients(page, 50);
  const deleteClient = useDeleteClient();

  const clients: Client[] = data?.data || [];

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClient.mutate(id);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Text variant="display-2" className="block font-bold">Clients</Text>
          <Text variant="body-2" color="secondary" className="block mt-1">
            {clients.length > 0
              ? `${clients.length} client${clients.length !== 1 ? 's' : ''}`
              : 'Manage your importers and exporters'}
          </Text>
        </div>
        <Button view="action" size="l" onClick={() => setModalOpen(true)}>
          <Button.Icon><Plus /></Button.Icon>
          Add Client
        </Button>
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
        <div className="flex flex-col items-center justify-center h-64 gap-4 border border-dashed border-[var(--g-color-line-generic)] rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[var(--g-color-base-generic)] flex items-center justify-center">
            <Icon data={Person} size={28} className="text-[var(--g-color-text-secondary)]" />
          </div>
          <div className="text-center">
            <Text variant="subheader-2" className="block">No clients yet</Text>
            <Text variant="body-2" color="secondary" className="block mt-1">
              Add your first importer or exporter to get started
            </Text>
          </div>
          <Button view="action" onClick={() => setModalOpen(true)}>
            <Button.Icon><Plus /></Button.Icon>
            Add Client
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clients.map((client) => (
            <ClientCard key={client._id} client={client} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <CreateClientModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
