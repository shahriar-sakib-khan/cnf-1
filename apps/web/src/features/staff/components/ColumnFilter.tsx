import { useState, useRef } from 'react';
import { Popup, TextInput, Icon, Button } from '@gravity-ui/uikit';
import { Funnel, Xmark, CaretDown, Calendar } from '@gravity-ui/icons';

export interface FilterOption {
  value: string;
  label: string;
}

interface ColumnFilterProps {
  label: string;
  options?: FilterOption[];
  activeValue: string | null;
  onSelect: (value: string | null) => void;
  /** Second section — renders side-by-side when provided */
  label2?: string;
  options2?: FilterOption[];
  activeValue2?: string | null;
  onSelect2?: (value: string | null) => void;
  /** When true, shows a calendar date-picker + list instead of just a list */
  isDatePicker?: boolean;
  /** When true in label2, shows a calendar for the second section */
  isDatePicker2?: boolean;
  className?: string;
}

// Helper: convert "03 Mar 2026" → "2026-03-03" for input[type=date]
function toInputDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const months: Record<string, string> = {
    Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',
    Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'
  };
  // Pattern: "03 Mar 2026"
  const m = dateStr.trim().match(/^(\d{1,2})\s+(\w{3})\s+(\d{4})$/);
  if (m) return `${m[3]}-${months[m[2]] || '01'}-${m[1].padStart(2, '0')}`;
  // Fallback: try Date parse
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

// Helper: "2026-03-03" → "03 Mar 2026"
function fromInputDate(val: string): string {
  if (!val) return '';
  const d = new Date(val + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** A reusable date-picker section used inside ColumnFilter */
function DatePickerSection({
  activeValue,
  options,
  onApply,
}: {
  activeValue: string | null;
  options: FilterOption[];
  onApply: (v: string | null) => void;
}) {
  const [staged, setStaged] = useState(toInputDate(activeValue));

  return (
    <div className="p-3 flex flex-col gap-2">
      {/* Calendar input */}
      <div className="flex gap-2 items-center">
        <Icon data={Calendar} size={16} className="text-[var(--g-color-text-hint)] flex-shrink-0" />
        <input
          type="date"
          className="flex-1 rounded-lg px-2 py-1.5 text-base border border-[var(--g-color-line-generic)] bg-[var(--g-color-base-background)] text-[var(--g-color-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={staged}
          onChange={e => setStaged(e.target.value)}
          onKeyDown={e => e.stopPropagation()}
        />
        <Button
          size="s"
          view="action"
          onClick={() => onApply(staged ? fromInputDate(staged) : null)}
          disabled={!staged}
        >
          Apply
        </Button>
      </div>

      {/* Existing dates as quick-select list */}
      {options.length > 0 && (
        <>
          <div className="border-t border-[var(--g-color-line-generic)] pt-1">
            <p className="text-[12px] font-bold uppercase tracking-widest text-[var(--g-color-text-hint)] mb-1">Quick select</p>
            <div className="max-h-44 overflow-y-auto rounded-lg border border-[var(--g-color-line-generic)]">
              {options.map(opt => (
                <div
                  key={opt.value}
                  className={`px-3 py-1.5 cursor-pointer flex items-center justify-between text-base transition-colors ${activeValue === opt.value ? 'bg-indigo-500/15 text-indigo-300 font-semibold' : 'hover:bg-[var(--g-color-base-generic-hover)]'}`}
                  onClick={() => { onApply(activeValue === opt.value ? null : opt.value); setStaged(toInputDate(opt.value)); }}
                >
                  {opt.label}
                  {activeValue === opt.value && <Icon data={Xmark} size={14} className="ml-2 text-indigo-400" />}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ColumnFilter({
  label,
  options = [],
  activeValue,
  onSelect,
  label2,
  options2 = [],
  activeValue2,
  onSelect2,
  isDatePicker = false,
  isDatePicker2 = false,
  className = '',
}: ColumnFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const anchorRef = useRef<HTMLDivElement>(null);

  const isActive = !!activeValue || !!activeValue2;
  const hasDualSection = !!label2;

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );
  const filteredOptions2 = options2.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect1 = (value: string) => {
    onSelect(activeValue === value ? null : value);
    if (activeValue2 && onSelect2) onSelect2(null);
    setOpen(false); setSearch('');
  };

  const handleSelect2 = (value: string) => {
    if (onSelect2) onSelect2(activeValue2 === value ? null : value);
    onSelect(null);
    setOpen(false); setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    if (onSelect2) onSelect2(null);
  };

  return (
    <div className={`flex items-center gap-1 select-none ${className}`}>
      <div
        ref={anchorRef}
        className={`flex items-center gap-1.5 cursor-pointer group/header transition-colors ${isActive ? 'text-indigo-400' : 'text-[var(--g-color-text-secondary)] hover:text-[var(--g-color-text-primary)]'}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="uppercase text-sm font-bold tracking-wider whitespace-nowrap">{label}</span>
        {isActive ? (
          <Icon data={Funnel} size={12} className="text-indigo-400 flex-shrink-0" />
        ) : (
          <Icon data={CaretDown} size={12} className="opacity-40 group-hover/header:opacity-100 transition-opacity flex-shrink-0" />
        )}
      </div>

      {isActive && (
        <button
          className="rounded-full w-4 h-4 flex items-center justify-center bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 transition-colors flex-shrink-0"
          onClick={handleClear}
          title="Clear filter"
        >
          <Icon data={Xmark} size={10} />
        </button>
      )}

      <Popup
        anchorRef={anchorRef}
        open={open}
        onClose={() => { setOpen(false); setSearch(''); }}
        placement="bottom-start"
      >
        <div
          className={`bg-[var(--g-color-base-float)] border border-[var(--g-color-line-generic)] rounded-xl shadow-2xl overflow-hidden ${hasDualSection ? 'flex' : 'min-w-[220px] max-w-[280px]'}`}
          style={hasDualSection ? { minWidth: 420 } : {}}
        >
          {/* ── Primary section ─────────────────────── */}
          <div className={hasDualSection ? 'flex-1 border-r border-[var(--g-color-line-generic)]' : ''}>
            <div className="px-3 pt-2.5 pb-1.5 border-b border-[var(--g-color-line-generic)] bg-[var(--g-color-base-generic)] flex items-center gap-2">
              <span className="text-[13px] font-bold uppercase tracking-widest text-[var(--g-color-text-secondary)] flex-1">{label}</span>
              {activeValue && (
                <button className="text-[12px] text-indigo-400 hover:text-indigo-300 font-semibold" onClick={() => onSelect(null)}>✕ clear</button>
              )}
            </div>

            {isDatePicker ? (
              <DatePickerSection
                activeValue={activeValue}
                options={options}
                onApply={v => { onSelect(v); if (v) setOpen(false); }}
              />
            ) : (
              <>
                {!hasDualSection && (
                  <div className="p-2 border-b border-[var(--g-color-line-generic)]">
                    <TextInput size="m" placeholder="Search…" value={search} onUpdate={setSearch} autoFocus />
                  </div>
                )}
                <div className="max-h-64 overflow-y-auto">
                  {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                    <div
                      key={opt.value}
                      className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors text-base ${activeValue === opt.value ? 'bg-indigo-500/15 text-indigo-300 font-semibold' : 'hover:bg-[var(--g-color-base-generic-hover)]'}`}
                      onClick={() => handleSelect1(opt.value)}
                    >
                      <span className="truncate">{opt.label}</span>
                      {activeValue === opt.value && <Icon data={Xmark} size={14} className="flex-shrink-0 ml-2 text-indigo-400" />}
                    </div>
                  )) : (
                    <div className="px-3 py-4 text-[var(--g-color-text-hint)] text-xs text-center italic">No results</div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Secondary section (side-by-side) ──── */}
          {hasDualSection && (
            <div className="flex-1">
              <div className="px-3 pt-2.5 pb-1.5 border-b border-[var(--g-color-line-generic)] bg-[var(--g-color-base-generic)] flex items-center gap-2">
                <span className="text-[13px] font-bold uppercase tracking-widest text-[var(--g-color-text-secondary)] flex-1">{label2}</span>
                {activeValue2 && (
                  <button className="text-[12px] text-indigo-400 hover:text-indigo-300 font-semibold" onClick={() => { if (onSelect2) onSelect2(null); }}>✕ clear</button>
                )}
              </div>

              {isDatePicker2 ? (
                <DatePickerSection
                  activeValue={activeValue2 ?? null}
                  options={options2}
                  onApply={v => { if (onSelect2) onSelect2(v); if (v) setOpen(false); }}
                />
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {filteredOptions2.length > 0 ? filteredOptions2.map(opt => (
                    <div
                      key={opt.value}
                      className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors text-base ${activeValue2 === opt.value ? 'bg-indigo-500/15 text-indigo-300 font-semibold' : 'hover:bg-[var(--g-color-base-generic-hover)]'}`}
                      onClick={() => handleSelect2(opt.value)}
                    >
                      <span className="truncate">{opt.label}</span>
                      {activeValue2 === opt.value && <Icon data={Xmark} size={14} className="flex-shrink-0 ml-2 text-indigo-400" />}
                    </div>
                  )) : (
                    <div className="px-3 py-4 text-[var(--g-color-text-hint)] text-xs text-center italic">No results</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Popup>
    </div>
  );
}
