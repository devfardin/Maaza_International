// src/lib/news.js
// Shared rules for News & Updates posts (list, detail page and admin form).

// Notice types an admin can choose (the backend stores them in the `tag` field)
export const NOTICE_TYPES = ['ANNOUNCEMENT', 'SECURITY', 'EDUCATION', 'UPDATE'];

// Colour per notice type
export const NOTICE_STYLE = {
  ANNOUNCEMENT: 'bg-harvest-50 text-harvest-700',
  SECURITY: 'bg-sky-50 text-sky-700',
  EDUCATION: 'bg-violet-50 text-violet-700',
  UPDATE: 'bg-lime-50 text-lime-800',
};

// 'text' = editor post (image, short + long description)
// 'html' = HTML + CSS design post (only the design is shown)
// Posts made before formats existed have no `format`: they are detected by their content.
export const postFormat = (post) => post?.format ?? (post?.htmlContent || post?.cssContent ? 'html' : 'text');

export const formatNewsDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-BD', { dateStyle: 'medium' }) : '';

// YYYY-MM-DD for <input type="date">, from a stored date
export const toDateInput = (value) => {
  const d = value ? new Date(value) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
