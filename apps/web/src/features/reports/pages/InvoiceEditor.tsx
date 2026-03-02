import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin } from '@gravity-ui/uikit';
import { useInvoice, useUpsertInvoice, useReportTemplate, useUpsertReportTemplate } from '../hooks/useReports';
import { useFiles } from '../../files/hooks/useFiles';
import type { InvoiceType, InvoiceItem } from '@repo/shared';

import { InvoiceHeader } from '../components/InvoiceHeader';
import { InvoiceDetailsForm } from '../components/InvoiceDetailsForm';
import { InvoiceLineItemsTable } from '../components/InvoiceLineItemsTable';
import { InvoiceTemplateTable } from '../components/InvoiceTemplateTable';
import { InvoiceNotesForm } from '../components/InvoiceNotesForm';

type EditorMode = 'NORMAL' | 'TEMPLATE';

export default function InvoiceEditor() {
  const { fileId, type } = useParams<{ fileId: string; type: string }>();
  const navigate = useNavigate();
  const invoiceType = type as InvoiceType;

  const [mode, setMode] = useState<EditorMode>('NORMAL');

  // Queries
  const { data: invoice, isLoading: isInvoiceLoading } = useInvoice(fileId, invoiceType);
  const { data: template, isLoading: isTemplateLoading } = useReportTemplate(invoiceType);

  // Mutations
  const { mutate: upsertInvoice, isPending: isSavingInvoice } = useUpsertInvoice();
  const { mutate: upsertTemplate, isPending: isSavingTemplate } = useUpsertReportTemplate();

  // Need file details for the header
  const { data: filesData } = useFiles({ limit: 100 });
  const file = filesData?.files.find((f: any) => f._id === fileId);

  // States for Normal Mode (Invoice)
  const [details, setDetails] = useState<any>({});
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState('');

  // States for Template Mode
  const [templateItems, setTemplateItems] = useState<{description: string}[]>([]);

  // Sync Normal Mode
  useEffect(() => {
    if (invoice) {
        setInvoiceItems((Array.isArray(invoice.items) ? invoice.items : []).map((item: any) => ({
            ...item,
            id: (item as any).id || (item as any)._id || crypto.randomUUID()
        })));
        setDetails(invoice.details || {});
        setNotes(invoice.notes || '');
    } else if (template?.items?.length) {
        // Pre-fill from template
        setInvoiceItems(template.items.map((t: any) => ({
            id: crypto.randomUUID(),
            description: t.description,
            amount: 0,
            isPermanent: true,
            subDescriptions: t.subDescriptions,
            subWidths: t.subWidths
        })));
        setDetails({});
        setNotes('');
    } else {
        setInvoiceItems([]);
        setDetails({});
        setNotes('');
    }
  }, [invoice, template]);

  // Sync Template Mode
  useEffect(() => {
    if (template?.items) {
        setTemplateItems(template.items.map((t: any) => ({
            ...t,
            id: (t as any).id || (t as any)._id || crypto.randomUUID()
        })));
    } else {
        setTemplateItems([{ id: crypto.randomUUID(), description: '' } as any]);
    }
  }, [template]);


  if (isInvoiceLoading || isTemplateLoading) {
    return <div className="p-12 flex justify-center h-full items-center"><Spin size="xl" /></div>;
  }


  // --- Normal Mode Handlers ---
  const handleInsertNormalItem = (index: number) => {
    const newItems = [...invoiceItems];
    newItems.splice(index, 0, { id: crypto.randomUUID(), description: '', amount: 0, isPermanent: false });
    setInvoiceItems(newItems);
  };
  const handleRemoveNormalItem = (index: number) => setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  const handleUpdateNormalItem = (index: number, field: keyof InvoiceItem | 'subDescriptions' | 'subWidths', value: any) => {
    setInvoiceItems(prev => {
        const newItems = [...prev];
        if (!newItems[index]) return prev;
        newItems[index] = { ...newItems[index], [field]: value };
        return newItems;
    });
  };
  const handleReorderNormalItems = (startIndex: number, endIndex: number) => {
    const newItems = [...invoiceItems];
    const [removed] = newItems.splice(startIndex, 1);
    newItems.splice(endIndex, 0, removed);
    setInvoiceItems(newItems);
  };

  const safeInvoiceItems = Array.isArray(invoiceItems) ? invoiceItems : [];
  const subtotal = safeInvoiceItems.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);

  const handleSaveNormal = () => {
    if (!fileId || !invoiceType) return;
    upsertInvoice({
      fileId,
      type: invoiceType,
      details,
      items: invoiceItems.filter(i => i.description),
      notes,
      isPaid: invoice?.isPaid || false,
    }, {
      onSuccess: () => navigate('/reports')
    });
  };

  // --- Template Mode Handlers ---
  const handleInsertTemplateItem = (index: number) => {
    const newItems = [...templateItems];
    newItems.splice(index, 0, { id: crypto.randomUUID(), description: '' } as any);
    setTemplateItems(newItems);
  };
  const handleRemoveTemplateItem = (index: number) => setTemplateItems(templateItems.filter((_, i) => i !== index));
  const handleReorderTemplateItems = (startIndex: number, endIndex: number) => {
    const newItems = [...templateItems];
    const [removed] = newItems.splice(startIndex, 1);
    newItems.splice(endIndex, 0, removed);
    setTemplateItems(newItems);
  };

  const handleSaveTemplate = () => {
    if (!invoiceType) return;
    upsertTemplate({
        type: invoiceType,
        items: templateItems.filter(i => i.description)
    }, {
        onSuccess: () => {
            setMode('NORMAL');
        }
    });
  };

  const isSaving = isSavingInvoice || isSavingTemplate;

  return (
    <div className="p-4 space-y-2 pb-32 max-w-[1600px]">
      <InvoiceHeader
        type={type!}
        mode={mode}
        setMode={setMode}
        onSaveNormal={handleSaveNormal}
        onSaveTemplate={handleSaveTemplate}
        isSaving={isSaving}
      />

      {mode === 'NORMAL' && (
        <>
          <InvoiceDetailsForm file={file} type={type!} details={details} setDetails={setDetails} />

          <InvoiceLineItemsTable
            type={type!}
            items={invoiceItems}
            subtotal={subtotal}
            onInsert={handleInsertNormalItem}
            onRemove={handleRemoveNormalItem}
            onUpdate={handleUpdateNormalItem}
            onReorder={handleReorderNormalItems}
          />

          <InvoiceNotesForm notes={notes} setNotes={setNotes} />
        </>
      )}

      {mode === 'TEMPLATE' && (
        <InvoiceTemplateTable
          items={templateItems}
          onInsert={handleInsertTemplateItem}
          onRemove={handleRemoveTemplateItem}
          onUpdate={(index, desc, subs, widths) => {
              const newItems = [...templateItems];
              newItems[index] = {
                  description: desc,
                  subDescriptions: subs,
                  subWidths: widths
              } as any;
              setTemplateItems(newItems);
          }}
          onReorder={handleReorderTemplateItems}
        />
      )}
    </div>
  );
}
