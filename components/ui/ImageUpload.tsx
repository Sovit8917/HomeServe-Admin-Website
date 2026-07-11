'use client';
import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2, ImageOff } from 'lucide-react';
import { uploadApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  folder: string; // e.g. 'categories', 'services'
  aspect?: 'square' | 'video'; // 1:1 or 16:9 preview box
}

const MAX_SIZE_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUpload({ label = 'Image', value, onChange, folder, aspect = 'video' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [broken, setBroken] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_SIZE_MB}MB`);
      return;
    }
    setUploading(true);
    setBroken(false);
    try {
      const res = await uploadApi.single(file, folder);
      const url = res.data?.data?.url;
      if (!url) throw new Error('No URL returned');
      onChange(url);
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden group',
          'hover:border-blue-300 hover:bg-blue-50/40 transition-colors cursor-pointer',
          aspect === 'square' ? 'aspect-square w-28' : 'aspect-video w-full'
        )}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-xs">Uploading…</span>
          </div>
        ) : value && !broken ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setBroken(true)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="text-white text-xs font-medium">Click to replace</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-400">
            {broken ? <ImageOff className="w-5 h-5" /> : <ImagePlus className="w-5 h-5" />}
            <span className="text-xs text-center px-2">
              {broken ? 'Image failed to load' : 'Click or drop an image'}
            </span>
          </div>
        )}
      </div>
      <p className="text-[11px] text-slate-400">JPG, PNG or WebP · up to {MAX_SIZE_MB}MB</p>
    </div>
  );
}
