import { useState, useEffect } from 'react';
import { Text, TextInput, Spin, Checkbox, Select, Label } from '@gravity-ui/uikit';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../common/lib/api';

interface InlineEditableFieldProps {
  fileId: string;
  fieldName: string;
  value: any;
  label: string;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'select';
  isMoney?: boolean;
  options?: { value: string; content: string }[];
  placeholder?: string;
  className?: string;
}

export function InlineEditableField({
  fileId,
  fieldName,
  value,
  label,
  type = 'text',
  isMoney = false,
  options,
  placeholder,
  className = '',
}: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState<any>(value ?? '');
  const queryClient = useQueryClient();

  useEffect(() => {
    let initialValue = value ?? '';
    if (isMoney && typeof value === 'number') {
      initialValue = value / 100;
    }
    setTempValue(initialValue);
  }, [value, isMoney]);

  const mutation = useMutation({
    mutationFn: (newValue: any) => 
      api.put(`/files/${fileId}`, { [fieldName]: newValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file', fileId] });
      setIsEditing(false);
    },
    onError: () => {
      setTempValue(value || '');
      setIsEditing(false);
    }
  });

  const handleSave = (valOverride?: any) => {
    const valToSave = valOverride !== undefined ? valOverride : tempValue;
    
    // If value hasn't changed, just exit edit mode
    if (String(valToSave) === String(value || '')) {
      setIsEditing(false);
      return;
    }
    
    let finalValue: any = valToSave;
    if (type === 'number') {
      finalValue = Number(valToSave);
      if (isMoney) finalValue = Math.round(finalValue * 100);
    }
    if (type === 'boolean') finalValue = Boolean(valToSave);

    mutation.mutate(finalValue);
  };

  const handleCancel = () => {
    setTempValue(value || '');
    setIsEditing(false);
  };

  const displayValue = () => {
    if (type === 'boolean') {
      return value ? <Label theme="success" size="s">YES</Label> : <Label theme="normal" size="s">NO</Label>;
    }
    if (type === 'select' && options) {
      return options.find((o: any) => String(o.value) === String(value))?.content || String(value || '—');
    }
    if (type === 'date' && value) {
      return new Date(value).toLocaleDateString();
    }
    if (isMoney && typeof value === 'number') {
      return (value / 100).toLocaleString();
    }
    return String(value || '—');
  };

  return (
    <div 
      className={`flex flex-col gap-0.5 min-h-[48px] group transition-all duration-200 ${className}`}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      <Text variant="caption-1" className="text-[12px] font-bold text-white/40 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
        {label}
      </Text>
      
      <div className="relative flex items-center min-h-[28px]">
        {isEditing ? (
          <div className="w-full animate-in fade-in duration-200">
            {type === 'boolean' ? (
              <div className="flex items-center gap-4 py-1">
                <Checkbox 
                  size="l" 
                  checked={Boolean(tempValue)} 
                  onUpdate={(checked) => {
                    setTempValue(checked);
                    handleSave(checked);
                  }}
                />
                <Text variant="body-1" className="text-xs opacity-60 uppercase font-bold"> Toggle Status</Text>
              </div>
            ) : type === 'select' ? (
              <Select
                size="m"
                value={[String(tempValue)]}
                onUpdate={(vals) => {
                  setTempValue(vals[0]);
                  handleSave(vals[0]);
                }}
                onClose={() => setIsEditing(false)}
                className="w-full"
                placeholder={placeholder}
              >
                {options?.map((opt: { value: string; content: string }) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.content}
                  </Select.Option>
                ))}
              </Select>
            ) : type === 'date' ? (
              <input 
                type="date"
                autoFocus
                value={tempValue ? new Date(tempValue).toISOString().split('T')[0] : ''}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => handleSave()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                className="bg-transparent border-b-2 border-indigo-500 text-[16px] font-bold text-white outline-none w-full py-0.5"
              />
            ) : (
              <TextInput
                size="l"
                view="clear"
                value={String(tempValue)}
                onUpdate={(v) => setTempValue(v)}
                placeholder={placeholder}
                autoFocus
                onBlur={() => handleSave()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                className="text-[16px] font-bold !bg-transparent"
                controlProps={{
                  className: "font-bold text-white border-b-2 border-indigo-500 !rounded-none !px-0"
                }}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Text variant="body-2" className={`text-[17px] font-black tracking-tight leading-tight ${value ? 'text-white/90' : 'text-white/20'}`}>
              {displayValue()}
            </Text>
            {mutation.isPending && <Spin size="xs" className="opacity-50" />}
          </div>
        )}
      </div>
    </div>
  );
}
