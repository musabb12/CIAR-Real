'use client';

import { useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

export async function uploadAdminImage(file: File, folder?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) formData.append('folder', folder);
  const response = await fetch('/api/admin/uploads', { method: 'POST', body: formData });
  const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !payload.url) {
    throw new Error(payload.error || 'Upload failed');
  }
  return String(payload.url);
}

type ImageUrlInputProps = {
  isAr: boolean;
  value: string;
  onChange: (url: string) => void;
  /** When set, upload adds to gallery directly instead of only filling the URL field */
  onUploadSuccess?: (url: string) => void;
  placeholder?: string;
  disabled?: boolean;
  folder?: string;
  inputClassName?: string;
  uploadLabel?: string;
  uploadClassName?: string;
};

export function ImageUrlInput({
  isAr,
  value,
  onChange,
  onUploadSuccess,
  placeholder,
  disabled,
  folder,
  inputClassName = 'admin-input',
  uploadLabel,
  uploadClassName = 'admin-icon-btn !w-auto px-3 gap-1.5 text-xs shrink-0 cursor-pointer',
}: ImageUrlInputProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadAdminImage(file, folder);
      if (onUploadSuccess) {
        onUploadSuccess(url);
      } else {
        onChange(url);
        toast.success(tx(isAr, 'تم رفع الصورة', 'Image uploaded'));
      }
    } catch (error) {
      toast.error((error as Error)?.message || tx(isAr, 'فشل رفع الصورة', 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex gap-2 min-w-0">
      <input
        className={`${inputClassName} flex-1 min-w-0`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'https://...'}
        disabled={disabled || uploading}
      />
      <label
        className={`${uploadClassName} ${
          disabled || uploading ? 'opacity-50 pointer-events-none' : ''
        }`}
        title={tx(isAr, 'رفع من الجهاز', 'Upload from device')}
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{uploadLabel ?? tx(isAr, 'رفع', 'Upload')}</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void handleUpload(file);
          }}
        />
      </label>
    </div>
  );
}
