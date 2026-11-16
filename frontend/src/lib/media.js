// src/lib/media.js
// ─────────────────────────────────────────────────────────────────────────────
// API helpers for the Media Library (backend: /media).
//
//   import { fetchMedia, uploadMedia, deleteMedia, copyText } from '@/lib/media';
// ─────────────────────────────────────────────────────────────────────────────
import api from '@/lib/api';

export const MEDIA_MAX_MB = 5;
export const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Readable names for the places an image can be used
export const USAGE_LABELS = {
  Product: 'Product',
  NewsPost: 'News post',
  PaymentMethod: 'Payment method',
  Category: 'Category',
  Task: 'Task',
  CommunityPost: 'Community post',
  VipLevel: 'VIP level',
  User: 'User profile',
  PaymentAccount: 'Payment account',
};

export const usageLabel = (model) => USAGE_LABELS[model] ?? model;

// usage: 'all' | 'used' | 'unused'
// Returns { data: [media...], meta: { page, limit, total, totalPage } }
// Each item has usageCount and usage: [{ model, id, title, field }]
export async function fetchMedia({ page = 1, limit = 24, search = '', usage = 'all' } = {}) {
  const { data } = await api.get('/media', { params: { page, limit, search, usage } });
  return data;
}

// Adds images already used in the database (products, news...) to the library
export async function importExistingMedia() {
  const { data } = await api.post('/media/import-existing');
  return data.data;
}

// Uploads one image and returns the saved media record { _id, url, publicId, ... }
export async function uploadMedia(file) {
  const form = new FormData();
  form.append('file', file);
  // The shared client sends JSON by default, and axios would turn the FormData into JSON
  // (dropping the file). Send the FormData as-is and let the browser set the multipart header.
  const { data } = await api.post('/media/upload', form, {
    transformRequest: [
      (body, headers) => {
        if (body instanceof FormData) headers.delete('Content-Type');
        return body;
      },
    ],
  });
  return data.data;
}

// Permanently deletes an image (super admin only on the server)
export async function deleteMedia(id) {
  await api.delete(`/media/${id}`);
}

// Copies text to the clipboard. Falls back for non-secure (http) contexts.
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement('textarea');
    field.value = text;
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(field);
    return ok;
  }
}
