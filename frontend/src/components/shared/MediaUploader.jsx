'use client';
// Pick an image from the computer, preview it, and upload it to the Media Library.
// Calls onUploaded(media) with the saved record when the upload succeeds.
import { useMemo, useEffect, useState } from 'react';
import { uploadMedia, MEDIA_MAX_MB, MEDIA_TYPES } from '@/lib/media';
import { notify, getErrorMessage } from '@/lib/toast';

export default function MediaUploader({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function handlePick(e) {
    const chosen = e.target.files?.[0] ?? null;
    setError('');
    if (!chosen) return setFile(null);
    if (!MEDIA_TYPES.includes(chosen.type)) return setError('Only JPEG, PNG, WEBP or GIF images are allowed.');
    if (chosen.size > MEDIA_MAX_MB * 1024 * 1024) return setError(`Image must be ${MEDIA_MAX_MB} MB or smaller.`);
    setFile(chosen);
  }

  async function handleUpload() {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const media = await uploadMedia(file);
      notify.success('Image uploaded to the Media Library.');
      setFile(null);
      onUploaded?.(media);
    } catch (err) {
      setError(getErrorMessage(err, 'Upload failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-blue-400">
        <span className="text-sm font-bold text-slate-700">Choose an image</span>
        <span className="text-xs text-slate-500">JPEG, PNG, WEBP or GIF · max {MEDIA_MAX_MB} MB</span>
        <input type="file" accept={MEDIA_TYPES.join(',')} onChange={handlePick} className="sr-only" />
      </label>

      {preview && (
        <div className="flex flex-col items-center gap-3">
          <img src={preview} alt="Selected preview" className="max-h-56 rounded-xl border bg-slate-50 object-contain" />
          <p className="max-w-full truncate text-xs text-slate-500">{file.name}</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || busy}
        className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? 'Uploading…' : 'Upload image'}
      </button>
    </div>
  );
}
