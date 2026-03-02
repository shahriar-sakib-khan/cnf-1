import { Text, Button, Icon, TextInput, Card } from '@gravity-ui/uikit';
import { Plus, TrashBin, Grip } from '@gravity-ui/icons';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import type { InvoiceItem } from '@repo/shared';

interface Props {
  type: string;
  items: InvoiceItem[];
  subtotal: number;
  onInsert: (index: number) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof InvoiceItem, value: any) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
}

export function InvoiceLineItemsTable(props: Props) {
    const {
        type,
        items = [],
        subtotal = 0,
        onInsert,
        onRemove,
        onUpdate,
        onReorder
    } = props;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    onReorder(result.source.index, result.destination.index);
  };


  return (
    <Card view="clear" className="overflow-visible border border-slate-700/50 rounded-2xl bg-slate-900/60">
      <div className="px-8 py-5 border-b border-slate-700/30 flex justify-between items-center bg-slate-800/20">
        <div className="flex items-center gap-4">
           <Text variant="header-2" className="block font-black uppercase tracking-tight text-white/90">{type} Financial Statement</Text>
           <div className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-500/20 shadow-inner">
               Live Entry
           </div>
        </div>
      </div>

      <div className="p-0 w-full overflow-visible">
        <DragDropContext onDragEnd={handleDragEnd}>
          <table
            className="w-full border-separate border-spacing-0"
            style={{
                minWidth: '800px'
            }}
          >
            <thead>
              <tr className="text-left bg-slate-950 z-20 shadow-lg">
                <th className="w-12 border-b border-slate-700/50 bg-slate-950"></th>
                <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 text-left border-b border-r border-slate-700/30 bg-slate-950">Description Charges</th>
                <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right w-[15%] border-b border-r border-slate-700/30 bg-slate-950">Amount ({type === 'PDA' ? 'USD' : 'BDT'})</th>
                <th className="px-4 py-2 w-16 text-center border-b border-slate-700/50 bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-500">Action</th>
              </tr>
            </thead>
            <Droppable droppableId="invoice-items">
              {(provided) => (
                <tbody
                  className="bg-transparent"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {(items || []).map((item, idx) => {
                    if (!item) return null;
                    return (
                      <Draggable key={item.id} draggableId={item.id} index={idx}>
                        {(provided, snapshot) => (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`group outline-none focus:outline-none select-none ${snapshot.isDragging ? 'bg-indigo-500/10 shadow-3xl z-50 ring-2 ring-indigo-500/30' : 'bg-transparent'}`}
                            style={{
                                ...provided.draggableProps.style,
                                // Prevent jitter by disabling transitions during drag if any remain
                                transition: snapshot.isDragging ? 'none' : provided.draggableProps.style?.transition,
                            }}
                          >
                            <td className="w-16 text-center border-b border-slate-700/30">
                               <div {...provided.dragHandleProps} className="inline-flex cursor-grab active:cursor-grabbing text-slate-600 opacity-20 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/5 rounded-lg">
                                  <Icon data={Grip} size={20} />
                               </div>

                                {/* Hover Insert Button */}
                                <div className="absolute -bottom-3 left-0 right-0 z-30 flex justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200">
                                    <Button
                                        view="action"
                                        size="s"
                                        className="rounded-full shadow-2xl pointer-events-auto border-[3px] border-slate-900 scale-125 hover:scale-150 active:scale-110 transition-transform bg-indigo-500"
                                        onClick={() => onInsert(idx + 1)}
                                    >
                                        <Icon data={Plus} size={12} />
                                    </Button>
                                </div>
                            </td>
                            <td className="px-4 py-1 border-b border-r border-slate-700/30 relative">
                                <div className="flex items-center gap-4">
                                   {item.isPermanent && (
                                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                                   )}
                                   <TextInput
                                    size="m"
                                    view="clear"
                                    placeholder="Type charge description..."
                                    value={item.description || ''}
                                    onUpdate={(v) => onUpdate(idx, 'description', v)}
                                    className="flex-1 font-bold text-white/90 !bg-transparent text-lg group-hover:text-white transition-colors"
                                    controlProps={{
                                        style: { background: 'transparent', padding: 0, color: 'inherit', fontSize: '14px', fontWeight: 700 }
                                    }}
                                   />
                                </div>
                                {item.subDescriptions && item.subDescriptions.length > 0 && (
                                    <div className="mt-2 flex gap-2 overflow-hidden">
                                        {item.subDescriptions.map((sub, sIdx) => (
                                            <div
                                                key={sIdx}
                                                className="bg-slate-900/40 border border-white/5 rounded-lg px-2 py-1 flex-1"
                                            >
                                                <Text variant="caption-1" className="text-slate-400 font-medium italic block min-h-[1rem] break-words text-[10px]">
                                                    {sub || '...'}
                                                </Text>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </td>
                            <td className="px-4 py-1 border-b border-r border-slate-700/30 bg-slate-800/5">
                              <div className="flex items-center justify-end group/amt">
                                  <span className="mr-2 text-slate-500 font-black text-sm group-focus-within/amt:text-indigo-400 transition-colors tabular-nums">{type === 'PDA' ? '$' : '৳'}</span>
                                  <TextInput
                                      type="text"
                                      size="s"
                                      view="clear"
                                      placeholder=""
                                      value={!item.amount || isNaN(item.amount) ? '' : (item.amount / 100).toString()}
                                      onUpdate={(v) => {
                                          const num = parseFloat(v.replace(/[^0-9.]/g, ''));
                                          onUpdate(idx, 'amount', isNaN(num) ? 0 : Math.round(num * 100));
                                      }}
                                      className="font-mono font-black text-right w-full max-w-[120px] text-white"
                                      controlProps={{
                                          style: { background: 'transparent', textAlign: 'right', padding: 0, color: 'white', fontSize: '13px', fontWeight: 900 }
                                      }}
                                  />
                              </div>
                            </td>
                            <td className="px-2 py-1 text-center border-b border-slate-700/30">
                              <Button
                                view="flat-danger"
                                size="s"
                                onClick={() => onRemove(idx)}
                                disabled={item.isPermanent}
                                className="rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 active:scale-90 p-2"
                              >
                                <Icon data={TrashBin} size={16} />
                              </Button>
                            </td>
                          </tr>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </table>
        </DragDropContext>
      </div>

      <div className="px-12 py-8 bg-slate-950/20 border-t border-slate-700/50 flex justify-end items-center gap-16">
          <div className="text-right group cursor-default">
              <Text className="uppercase text-[10px] font-black tracking-[0.3em] mb-2 text-slate-500 group-hover:text-indigo-400 transition-colors">Total {type} Charges</Text>
              <div className="flex items-center justify-end gap-3 translate-x-2">
                 <Text variant="display-1" className="font-black text-slate-700 opacity-50">{type === 'PDA' ? '$' : '৳'}</Text>
                 <Text variant="display-1" className="font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500 py-1">{isNaN(subtotal) ? '0' : (subtotal / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </div>
          </div>
      </div>
    </Card>
  );
}
