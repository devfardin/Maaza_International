'use client';
// Form field that stores an image URL. Drop it into any form (products, blogs, banners):
//
//   <MediaField label="Banner image" value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
//
// Opens the MediaPicker, so the image can come from the Media Library or a new upload.
import { useState } from 'react';
import MediaPicker from '@/components/shared/MediaPicker';

export default function MediaField({ label, value, onChange, hint }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {label && <span className="mb-1 block text-xs font-bold text-slate-600">{label}</span>}
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="" className="h-16 w-24 shrink-0 rounded-xl border bg-slate-50 object-contain" />
        ) : (
          <div className="grid h-16 w-24 shrink-0 place-items-center rounded-xl border border-dashed text-xs text-slate-400">No image</div>
        )}
        <div className="flex flex-col items-start gap-2">
          <button type="button" onClick={() => setOpen(true)} className="rounded-xl border px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            {value ? 'Change image' : 'Choose image'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange?.('')} className="text-xs font-bold text-red-600">
              Remove
            </button>
          )}
        </div>
      </div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}

      <MediaPicker open={open} onClose={() => setOpen(false)} onSelect={(media) => onChange?.(media.url)} />
    </div>
  );
}
