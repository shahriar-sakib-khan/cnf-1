import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button, Text, Icon, Spin
} from '@gravity-ui/uikit';
import { Plus, TrashBin, File as FileIcon, ArrowDownToLine, TriangleExclamation, Xmark } from '@gravity-ui/icons';
import api from '../../../common/lib/api';
import axios from 'axios';

interface FileDocumentsTabProps {
  file: any;
  fileId: string;
}

export default function FileDocumentsTab({ file, fileId }: FileDocumentsTabProps) {
  const queryClient = useQueryClient();
  const [uploadingCategory, setUploadingCategory] = useState<'COPY' | 'ORIGINAL' | null>(null);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; type: string } | null>(null);
  
  const copyInputRef = useRef<HTMLInputElement>(null);
  const originalInputRef = useRef<HTMLInputElement>(null);

  const documents = file.documents || [];
  const copyDocs = documents.filter((d: any) => d.category === 'COPY');
  const originalDocs = documents.filter((d: any) => d.category === 'ORIGINAL');

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => api.delete(`/files/${fileId}/documents/${docId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file', fileId] });
      setDocToDelete(null);
    }
  });

  const confirmDelete = () => {
    if (docToDelete) {
      deleteMutation.mutate(docToDelete);
    }
  };

  const statusMutation = useMutation({
    mutationFn: (data: { copyDocsReceived?: boolean; originalDocsReceived?: boolean }) => 
      api.patch(`/files/${fileId}/doc-status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file', fileId] });
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, category }: { file: File; category: 'COPY' | 'ORIGINAL' }) => {
      // 1. Get Signature
      const sigRes = await api.get('/upload/signature');
      const { signature, timestamp, apiKey, cloudName, folder } = sigRes.data.data;

      // 2. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);

      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        formData
      );

      // 3. Register with Backend
      return api.post(`/files/${fileId}/documents`, {
        name: file.name,
        url: cloudinaryRes.data.secure_url,
        type: file.type.split('/')[1]?.toUpperCase() || 'OTHER',
        category,
        size: file.size
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file', fileId] });
      setUploadingCategory(null);
    },
    onError: () => {
      setUploadingCategory(null);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, category: 'COPY' | 'ORIGINAL') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCategory(category);
    uploadMutation.mutate({ file, category });
    
    // Reset input
    e.target.value = '';
  };

  const handleDownloadAll = async () => {
    try {
      const res = await api.get(`/files/${fileId}/documents/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${file.fileNoFull}_documents.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const renderDocList = (docs: any[], title: string, category: 'COPY' | 'ORIGINAL', inputRef: React.RefObject<HTMLInputElement | null>) => (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-[var(--g-color-line-generic)] pb-2">
        <div className="flex items-center gap-2">
           <Text variant="subheader-2" className="font-bold">{title}</Text>
           {uploadingCategory === category && <Spin size="xs" />}
        </div>
        <Button 
          view="flat-secondary" 
          size="s" 
          onClick={() => inputRef.current?.click()}
          disabled={!!uploadingCategory}
        >
          <Icon data={Plus} size={14} className="mr-1" />
          Add {title.split(' ')[0]}
        </Button>
        <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          onChange={(e) => handleFileChange(e, category)}
        />
      </div>
      {docs.length === 0 ? (
        <div className="py-10 bg-[var(--g-color-base-generic-hover)] rounded-xl border border-dashed border-[var(--g-color-line-generic)] flex flex-col items-center justify-center gap-2">
          <Icon data={FileIcon} size={32} className="text-[var(--g-color-text-secondary)] opacity-10" />
          <Text color="secondary" variant="caption-1">No {title.toLowerCase()} uploaded.</Text>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {docs.map((doc) => (
            <div key={doc._id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--g-color-base-background)] border border-[var(--g-color-line-generic)] hover:border-indigo-500/30 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <Icon data={FileIcon} size={14} className="text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <Text variant="body-1" className="font-bold truncate block">{doc.name}</Text>
                  <Text variant="caption-1" color="secondary" className="truncate block opacity-60">
                    {new Date(doc.createdAt).toLocaleDateString()} · {doc.uploadedBy?.name}
                  </Text>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button view="flat-info" size="s" onClick={() => setPreviewDoc({ url: doc.url, name: doc.name, type: doc.type })}>View</Button>
                <Button view="flat-danger" size="s" onClick={() => setDocToDelete(doc._id)}>
                  <Icon data={TrashBin} size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Header with Download & Global Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--g-color-base-generic-hover)] p-4 rounded-xl border border-[var(--g-color-line-generic)]">
        <div className="flex gap-6">
           <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="tab-copyDocs"
                checked={file.copyDocsReceived}
                onChange={(e) => statusMutation.mutate({ copyDocsReceived: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="tab-copyDocs" className="text-sm font-medium">Copy Received</label>
           </div>
           <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="tab-origDocs"
                checked={file.originalDocsReceived}
                onChange={(e) => statusMutation.mutate({ originalDocsReceived: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="tab-origDocs" className="text-sm font-medium">Original Received</label>
           </div>
        </div>
        <Button view="action" size="m" onClick={handleDownloadAll} disabled={documents.length === 0}>
          <Icon data={ArrowDownToLine} size={16} className="mr-2" />
          Download All (.zip)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {renderDocList(copyDocs, "Copy Documents", 'COPY', copyInputRef)}
        {renderDocList(originalDocs, "Original Documents", 'ORIGINAL', originalInputRef)}
      </div>

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDocToDelete(null)}>
           <div className="bg-[var(--g-color-base-background)] border border-[var(--g-color-line-generic)] rounded-2xl p-6 w-[400px] shadow-2xl flex flex-col gap-6 scale-in-center overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon data={TriangleExclamation} className="text-red-500" size={24} />
                 </div>
                 <div>
                    <Text variant="header-2" className="block">Delete Document?</Text>
                    <Text variant="body-1" color="secondary">This action cannot be undone. The file will be permanently removed.</Text>
                 </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                 <Button view="flat" size="l" onClick={() => setDocToDelete(null)}>Cancel</Button>
                 <Button view="outlined-danger" size="l" onClick={confirmDelete} loading={deleteMutation.isPending}>
                    Delete
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* Document Preview Overlay */}
      {previewDoc && (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setPreviewDoc(null)}
        >
          <div className="absolute top-6 right-6 flex items-center gap-4 z-[1001]">
            <div className="bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
              <Text variant="subheader-2" className="text-white font-bold">{previewDoc.name}</Text>
            </div>
            <Button view="raised" size="l" onClick={() => setPreviewDoc(null)} className="rounded-full">
              <Icon data={Xmark} size={20} />
            </Button>
          </div>
          
          <div 
            className="w-[95vw] h-[95vh] flex items-center justify-center relative scale-in-center"
            onClick={e => e.stopPropagation()}
          >
            {['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF'].includes(previewDoc.type?.toUpperCase()) ? (
              <img 
                src={previewDoc.url} 
                alt={previewDoc.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-black/50"
              />
            ) : (
              <div className="w-full h-full bg-white rounded-xl overflow-hidden shadow-22xl shadow-black/50">
                <iframe 
                  src={previewDoc.url} 
                  className="w-full h-full border-0"
                  title={previewDoc.name}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
