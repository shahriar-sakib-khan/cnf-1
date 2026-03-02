import { Text, Button, Icon, SegmentedRadioGroup } from '@gravity-ui/uikit';
import {
  ChevronLeft,
  Check
} from '@gravity-ui/icons';
import { useNavigate } from 'react-router-dom';

type EditorMode = 'NORMAL' | 'TEMPLATE';

interface Props {
  type: string;
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  onSaveNormal: () => void;
  onSaveTemplate: () => void;
  isSaving: boolean;
}

export function InvoiceHeader({
    type,
    mode,
    setMode,
    onSaveNormal,
    onSaveTemplate,
    isSaving
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 select-none animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Button view="flat-secondary" size="l" onClick={() => navigate('/reports')} className="rounded-full w-12 h-12 flex items-center justify-center border border-white/5 hover:border-white/20 transition-all">
              <Icon data={ChevronLeft} size={24} />
            </Button>

            <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                    <div className={`px-3 py-1 rounded-md text-[10px] font-black tracking-[0.2em] uppercase shadow-lg ${type === 'PDA' ? 'bg-indigo-500 text-white' : 'bg-blue-500 text-white'}`}>
                        {type} EDITOR
                    </div>
                </div>
                <Text variant="display-1" className="font-black uppercase text-white tracking-tight">
                    {type} Editor
                </Text>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <SegmentedRadioGroup
              size="l"
              value={mode}
              onUpdate={(v) => setMode(v as EditorMode)}
              options={[
                { value: 'NORMAL', content: 'Live Entry Mode' },
                { value: 'TEMPLATE', content: 'Edit Base Table' },
              ]}
              className="bg-slate-800/50 p-1 rounded-xl border border-white/5"
            />

            <Button
              view="action"
              size="l"
              loading={isSaving}
              onClick={mode === 'NORMAL' ? onSaveNormal : onSaveTemplate}
              className="rounded-xl px-8 font-black shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <Icon data={Check} size={18} className="mr-2" />
              {mode === 'NORMAL' ? 'Finalize Report' : 'Save as Base Table'}
            </Button>
          </div>
        </div>
    </div>
  );
}
