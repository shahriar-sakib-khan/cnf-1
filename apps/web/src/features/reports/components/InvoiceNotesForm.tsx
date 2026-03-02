import { Text, Card, TextArea } from '@gravity-ui/uikit';

interface Props {
  notes: string;
  setNotes: (val: string) => void;
}

export function InvoiceNotesForm({ notes, setNotes }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2 mt-2 px-0">
      <Card view="clear" className="p-2 rounded-xl border border-slate-700/20 bg-slate-900/40 shadow-sm">
        <Text variant="header-2" className="block font-black mb-1 text-slate-500 uppercase tracking-widest text-[9px]">Internal Notes</Text>
        <TextArea
          rows={2}
          size="s"
          placeholder="Add internal remarks..."
          value={notes}
          onUpdate={setNotes}
          className="w-full font-bold opacity-80"
          controlProps={{
              style: { fontSize: '12px', padding: '4px', background: 'transparent' }
          }}
        />
      </Card>
    </div>
  );
}
