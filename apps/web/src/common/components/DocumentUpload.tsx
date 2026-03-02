import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Text, Icon, Button, Spin, Label } from '@gravity-ui/uikit';
import { CloudArrowUpIn, FileXmark, FileCheck } from '@gravity-ui/icons';
import axios from 'axios';
import api from '../lib/api';

interface DocumentUploadProps {
  onUploadSuccess: (url: string) => void;
  label?: string;
  initialUrl?: string;
}

export default function DocumentUpload({ onUploadSuccess, label, initialUrl }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState(initialUrl || '');
  const [error, setError] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      // 1. Get signature from backend
      const { data: sigRes } = await api.get('/upload/signature');
      const { signature, timestamp, apiKey, cloudName, folder } = sigRes.data;

      // 2. Upload to Cloudinary directly
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);
      formData.append('folder', folder);

      const uploadRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        formData
      );

      const url = uploadRes.data.secure_url;
      setFileUrl(url);
      onUploadSuccess(url);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
    }
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileUrl('');
    onUploadSuccess('');
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <Text variant="body-2" className="font-semibold">{label}</Text>}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-3
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-[var(--g-color-line-generic)] hover:border-indigo-500/50 hover:bg-indigo-500/5'}
          ${fileUrl ? 'border-emerald-500/50 bg-emerald-500/5' : ''}
        `}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Spin size="m" />
            <Text color="secondary">Uploading...</Text>
          </div>
        ) : fileUrl ? (
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex items-center gap-2 text-emerald-500">
               <Icon data={FileCheck} size={24} />
               <Text className="font-bold">File Uploaded</Text>
            </div>
            <div className="flex items-center gap-2 mt-1">
               <Label theme="success" size="m" className="max-w-[200px] truncate">
                  {fileUrl.split('/').pop()}
               </Label>
               <Button view="flat-danger" size="s" onClick={clearFile} title="Remove file">
                  <Icon data={FileXmark} size={16} />
               </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Icon data={CloudArrowUpIn} size={32} className="text-[var(--g-color-text-secondary)] opacity-50" />
            <div className="text-center">
              <Text variant="body-1" className="block font-medium">
                {isDragActive ? 'Drop it here' : 'Click or drag receipt'}
              </Text>
              <Text variant="caption-1" color="secondary">PDF, JPG, PNG up to 10MB</Text>
            </div>
          </div>
        )}
      </div>

      {error && <Text color="danger" variant="caption-1" className="px-1">{error}</Text>}
    </div>
  );
}
