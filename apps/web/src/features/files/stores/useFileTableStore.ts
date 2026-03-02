import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FileColumn {
  id: string;
  label: string;
  visible: boolean;
  sortable?: boolean;
}

interface FileTableState {
  columns: FileColumn[];
  toggleColumn: (id: string) => void;
  setColumns: (columns: FileColumn[]) => void;
}

const DEFAULT_COLUMNS: FileColumn[] = [
  { id: 'sl', label: 'SL', visible: true },
  { id: 'fileNo', label: 'File No', visible: true },
  { id: 'importer', label: 'Importer', visible: true },
  { id: 'exporter', label: 'Exporter', visible: true },
  { id: 'blNo', label: 'B/L No', visible: true },
  { id: 'status', label: 'Status', visible: true },
  { id: 'dates', label: 'Dates', visible: true },
  { id: 'expenses', label: 'Expenses', visible: true },
  { id: 'docs', label: 'Docs', visible: true },
  { id: 'actions', label: 'Actions', visible: true },
];

export const useFileTableStore = create<FileTableState>()(
  persist(
    (set) => ({
      columns: DEFAULT_COLUMNS,
      toggleColumn: (id) =>
        set((state) => ({
          columns: state.columns.map((col) =>
            col.id === id ? { ...col, visible: !col.visible } : col
          ),
        })),
      setColumns: (columns) => set({ columns }),
    }),
    {
      name: 'file-table-settings',
    }
  )
);
