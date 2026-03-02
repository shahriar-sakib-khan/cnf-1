import { Text, TextInput, Card, Icon, Button } from '@gravity-ui/uikit';
import { FileText, Pencil, CircleCheck, TrashBin, Plus, Grip } from '@gravity-ui/icons';
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

interface Props {
  file: any;
  type: string;
  details: any;
  setDetails: (details: any) => void;
}

interface MetadataField {
    id: string;
    label: string;
    value: string;
    key?: string; // For standard fields
    isStandard?: boolean;
}

const STANDARD_FIELD_KEYS = [
    'refNo', 'date', 'vesselName', 'voyage', 'eta', 'grt', 'nrt', 'cargo', 'berthing', 'departure', 'quantity', 'bankingDetails'
];

const STANDARD_LABELS: Record<string, string> = {
    refNo: 'Ref No',
    date: 'Date',
    vesselName: 'Vessel Name',
    voyage: 'Voyage',
    eta: 'ETA',
    grt: 'GRT',
    nrt: 'NRT',
    cargo: 'Cargo',
    berthing: 'Berthing',
    departure: 'Departure',
    quantity: 'Quantity',
    bankingDetails: 'Bank Details'
};

export function InvoiceDetailsForm({ file, type, details, setDetails }: Props) {
  const [isManaging, setIsManaging] = useState(false);
  const [fields, setFields] = useState<MetadataField[]>([]);

  // Initialize fields from details
  useEffect(() => {
    // If we already have an order or fields in details, use them.
    // Otherwise, construct from standard keys + additionalFields.
    const initialFields: MetadataField[] = [];

    // 1. Add standard fields that have values (or all if new)
    STANDARD_FIELD_KEYS.forEach(key => {
        if (details[key] !== undefined || initialFields.length < STANDARD_FIELD_KEYS.length) {
            initialFields.push({
                id: `std-${key}`,
                label: STANDARD_LABELS[key] || key,
                value: details[key] || '',
                key,
                isStandard: true
            });
        }
    });

    // 2. Add additional fields
    (details.additionalFields || []).forEach((extra: any, idx: number) => {
        initialFields.push({
            id: `ext-${idx}-${Date.now()}`,
            label: extra.label,
            value: extra.value,
            isStandard: false
        });
    });

    // If we have an order stored elsewhere, we'd apply it here.
    // For now, if details has a specific "uiOrder", we use it?
    // Let's assume we don't have uiOrder yet.
    setFields(initialFields);
  }, [details._id]); // Only re-init when invoice changes

  const syncToParent = (updatedFields: MetadataField[]) => {
      const newDetails: any = { ...details };
      const additionalFields: any[] = [];

      // Clear standard keys first to handle "deletions"
      STANDARD_FIELD_KEYS.forEach(k => delete newDetails[k]);

      updatedFields.forEach(f => {
          if (f.isStandard && f.key) {
              newDetails[f.key] = f.value;
          } else {
              additionalFields.push({ label: f.label, value: f.value });
          }
      });

      newDetails.additionalFields = additionalFields;
      // We could store the overall order here if we wanted to persist it exactly
      setDetails(newDetails);
  };

  const updateFieldValue = (id: string, value: string) => {
    const updated = fields.map(f => f.id === id ? { ...f, value } : f);
    setFields(updated);
    syncToParent(updated);
  };

  const updateFieldLabel = (id: string, label: string) => {
    const updated = fields.map(f => f.id === id ? { ...f, label } : f);
    setFields(updated);
    syncToParent(updated);
  };

  const addField = () => {
    const newFields = [...fields, { id: `ext-${Date.now()}`, label: 'New Field', value: '', isStandard: false }];
    setFields(newFields);
    syncToParent(newFields);
  };

  const removeField = (id: string) => {
    const updated = fields.filter(f => f.id !== id);
    setFields(updated);
    syncToParent(updated);
  };

  const onDragEnd = (result: DropResult) => {
      if (!result.destination) return;
      const reordered = [...fields];
      const [removed] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, removed);
      setFields(reordered);
      syncToParent(reordered);
  };

  return (
    <Card view="clear" className="overflow-visible border border-slate-700/50 rounded-2xl px-6 py-4 mb-6 bg-slate-900/60">
      {/* File Identifier Section */}
      <div className="flex justify-between items-start mb-6 border-b border-slate-700/10 pb-4">
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-xl border border-white/5 ${type === 'PDA' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-blue-500/20 text-blue-400'}`}>
                <Icon data={FileText} size={24} />
            </div>
            <div>
                <div className="flex items-center gap-2 mb-0.5">
                    <Text variant="caption-2" className="uppercase tracking-[0.2em] font-black text-slate-500 text-[9px]">
                        File Asset
                    </Text>
                    <div className="h-px w-4 bg-slate-700/50"></div>
                </div>
                <Text variant="header-2" className="block font-black leading-none text-white tracking-tighter">
                    {file?.fileNoFull}
                </Text>
            </div>
        </div>
        <Button
            view={isManaging ? "action" : "outlined"}
            size="m"
            onClick={() => setIsManaging(!isManaging)}
            className="rounded-lg font-black px-4 shadow-xl transition-all active:scale-95 border-white/5 hover:border-white/10"
        >
            <Icon data={isManaging ? CircleCheck : Pencil} size={14} className="mr-2" />
            {isManaging ? 'Finish Setup' : 'Manage Metadata'}
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="metadata-fields" direction="vertical">
              {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-0 px-0"
                  >
                      {fields.map((field, index) => (
                          <Draggable key={field.id} draggableId={field.id} index={index} isDragDisabled={!isManaging}>
                              {(dragProvided) => (
                                  <div
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      className={`${field.key === 'bankingDetails' ? 'lg:col-span-3' : ''}`}
                                  >
                                      <DetailRow
                                          label={field.label}
                                          value={field.value}
                                          isManaging={isManaging}
                                          isLabelEditable={isManaging}
                                          onUpdate={(v) => updateFieldValue(field.id, v)}
                                          onLabelUpdate={(v) => updateFieldLabel(field.id, v)}
                                          onDelete={() => removeField(field.id)}
                                          dragHandleProps={dragProvided.dragHandleProps}
                                      />
                                  </div>
                              )}
                          </Draggable>
                      ))}
                      {provided.placeholder}
                  </div>
              )}
          </Droppable>
      </DragDropContext>

      {isManaging && (
          <div className="mt-14 flex justify-center border-t border-dashed border-slate-700/50 pt-10">
              <Button view="outlined-info" size="xl" onClick={addField} className="rounded-full px-12 font-black border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20 shadow-xl transition-all hover:scale-105 active:scale-95">
                  <Icon data={Plus} size={20} className="mr-3" />
                  Add Custom Metadata Field
              </Button>
          </div>
      )}
    </Card>
  );
}

interface RowProps {
    label: string;
    value: string;
    onUpdate: (v: string) => void;
    isManaging?: boolean;
    isLabelEditable?: boolean;
    onLabelUpdate?: (v: string) => void;
    onDelete?: () => void;
    dragHandleProps?: any;
}

function DetailRow({ label, value, onUpdate, isManaging, isLabelEditable, onLabelUpdate, onDelete, dragHandleProps }: RowProps) {
    return (
        <div className="group flex items-center gap-0 border-b border-white/5 py-0.5">
            {isManaging && (
                <div {...dragHandleProps} className="text-slate-700 hover:text-white cursor-grab active:cursor-grabbing transition-colors px-1">
                    <Icon data={Grip} size={14} />
                </div>
            )}

            <div className="flex-1 flex items-center bg-transparent">
                <div className="min-w-[80px] max-w-[80px]">
                   {isLabelEditable ? (
                       <TextInput
                           value={label}
                           onUpdate={onLabelUpdate}
                           size="s"
                           view="clear"
                           className="font-black uppercase tracking-tighter text-indigo-400/70 w-full"
                           controlProps={{ style: { padding: 0, fontWeight: 900, fontSize: '9px', textAlign: 'left' } }}
                       />
                   ) : (
                       <Text variant="caption-2" className="block text-left font-black uppercase tracking-tighter text-slate-600 group-hover:text-slate-400 transition-colors truncate text-[9px]">
                           {label}
                       </Text>
                   )}
                </div>

                <TextInput
                    value={value}
                    onUpdate={onUpdate}
                    view="clear"
                    placeholder=""
                    autoComplete="off"
                    className="flex-1 font-bold !bg-transparent text-white ml-2"
                    controlProps={{
                        style: { background: 'transparent', color: 'white', fontSize: '13px', padding: '2px 0', fontWeight: 600 }
                    }}
                />
            </div>

            {isManaging && (
                <Button
                    view="flat-danger"
                    size="s"
                    onClick={onDelete}
                    className="opacity-0 group-hover:opacity-100 transition-all rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-500/20"
                >
                    <Icon data={TrashBin} size={14} />
                </Button>
            )}
        </div>
    );
}
