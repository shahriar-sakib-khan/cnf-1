import { Text, Button, Icon, TextInput, Card } from '@gravity-ui/uikit';
import { Plus, TrashBin, Grip, LayoutColumns, Xmark } from '@gravity-ui/icons';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

interface Props {
  items: { description: string; subDescriptions?: string[]; subWidths?: number[] }[];
  onInsert: (index: number) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, description: string, subDescriptions?: string[], subWidths?: number[]) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
}

export function InvoiceTemplateTable(props: Props) {
    const {
        items = [],
        onInsert,
        onRemove,
        onUpdate,
        onReorder
    } = props;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    onReorder(result.source.index, result.destination.index);
  };

  const handleSplit = (idx: number) => {
    const item = items[idx];
    if (!item) return;

    // Add one split (can have up to 4 sub-descriptions = 3 dividers)
    const currentSubs = item.subDescriptions || [item.description || ''];
    if (currentSubs.length >= 4) return; // Limit reached

    const newSubs = [...currentSubs, ''];
    const equalWidth = 100 / newSubs.length;
    const newWidths = newSubs.map(() => equalWidth);

    onUpdate(idx, item.description, newSubs, newWidths);
  };


  return (
    <Card view="clear" className="overflow-visible border border-orange-700/50 rounded-2xl bg-slate-950/60">
      <div className="px-8 py-5 border-b border-orange-700/30 flex justify-between items-center bg-orange-950/10">
        <div className="flex items-center gap-4">
           <Text variant="header-2" className="block font-black uppercase tracking-tight text-white/90">Base Table Blueprint</Text>
           <div className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-[0.2em] border border-orange-500/20 shadow-inner">
               Master Configuration
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
              <tr className="text-left bg-slate-900 z-20 shadow-lg">
                <th className="w-12 border-b border-orange-700/30 bg-slate-900"></th>
                <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 text-left border-b border-orange-700/30 bg-slate-900">Blueprint Charge Description</th>
                <th className="px-4 py-2 w-16 text-center border-b border-orange-700/30 bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-500">Action</th>
              </tr>
            </thead>
            <Droppable droppableId="template-items">
              {(provided) => (
                <tbody
                  className="bg-transparent"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {(items || []).map((item, idx) => {
                    if (!item) return null;
                    const subDescriptions = item.subDescriptions || [item.description || ''];
                    const subWidths = item.subWidths || subDescriptions.map(() => 100 / subDescriptions.length);

                    return (
                      <Draggable key={(item as any).id} draggableId={(item as any).id} index={idx}>
                        {(provided, snapshot) => (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`group outline-none focus:outline-none select-none ${snapshot.isDragging ? 'bg-orange-500/10 shadow-3xl z-50 ring-2 ring-orange-500/30' : 'bg-transparent'}`}
                            style={{
                                ...provided.draggableProps.style,
                                transition: snapshot.isDragging ? 'none' : provided.draggableProps.style?.transition,
                            }}
                          >
                            <td className="w-12 text-center border-b border-slate-800">
                               <div {...provided.dragHandleProps} className="inline-flex cursor-grab active:cursor-grabbing text-slate-600 opacity-20 group-hover:opacity-100 transition-opacity p-2">
                                  <Icon data={Grip} size={16} />
                               </div>

                                {/* Hover Insert Button */}
                                <div className="absolute -bottom-2.5 left-0 right-0 z-30 flex justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200">
                                    <Button
                                        view="action"
                                        size="xs"
                                        className="rounded-full shadow-2xl pointer-events-auto border-2 border-slate-950 scale-110 hover:scale-125 transition-transform bg-orange-500"
                                        onClick={() => onInsert(idx + 1)}
                                    >
                                        <Icon data={Plus} size={10} />
                                    </Button>
                                </div>
                            </td>
                            <td className="px-4 py-1 border-b border-slate-800 relative">
                               <div className="flex gap-4 items-center">
                                  <div className="flex-1 flex gap-2 overflow-hidden bg-slate-900/50 rounded-lg p-0.5 border border-white/5">
                                      {subDescriptions.map((sub, sIdx) => (
                                          <div key={sIdx} className="flex-1 relative flex items-center min-w-0">
                                              {sIdx > 0 && <div className="w-px h-4 bg-slate-700 mx-1" />}
                                              <TextInput
                                                size="m"
                                                view="clear"
                                                placeholder="Sub..."
                                                value={sub}
                                                onUpdate={(v) => {
                                                    const newSubs = [...subDescriptions];
                                                    newSubs[sIdx] = v;
                                                    onUpdate(idx, newSubs[0], newSubs, subWidths);
                                                }}
                                                className="w-full font-bold text-white/80 group-hover:text-white transition-colors"
                                                controlProps={{
                                                    style: { background: 'transparent', padding: '2px 4px', color: 'inherit', fontSize: '13px', fontWeight: 600 }
                                                }}
                                              />
                                              {subDescriptions.length > 1 && (
                                                  <Button
                                                    view="flat-secondary"
                                                    size="xs"
                                                    className="absolute right-0 opacity-0 group-hover:opacity-100 scale-75"
                                                    onClick={() => {
                                                        const newSubs = subDescriptions.filter((_, i) => i !== sIdx);
                                                        onUpdate(idx, newSubs[0], newSubs, newSubs.map(() => 100 / newSubs.length));
                                                    }}
                                                  >
                                                      <Icon data={Xmark} size={10} />
                                                  </Button>
                                              )}
                                          </div>
                                      ))}
                                  </div>

                                  {subDescriptions.length < 4 && (
                                      <Button
                                        view="outlined"
                                        size="xs"
                                        onClick={() => handleSplit(idx)}
                                        className="opacity-0 group-hover:opacity-100 transition-all text-slate-400 border-white/10 hover:border-orange-500/50 hover:text-orange-400 py-0 px-2 h-6"
                                        title="Split"
                                      >
                                          <Icon data={LayoutColumns} size={14} className="mr-1" />
                                          <span className="text-[10px]">Split</span>
                                      </Button>
                                  )}
                               </div>
                            </td>
                            <td className="px-4 py-1 text-center border-b border-slate-800">
                              <Button
                                view="flat-danger"
                                size="s"
                                onClick={() => onRemove(idx)}
                                disabled={items.length === 1}
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
    </Card>
  );
}
