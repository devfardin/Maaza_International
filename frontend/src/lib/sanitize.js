// src/lib/sanitize.js
// Every HTML string that comes from the admin editor (payment instructions,
// descriptions) is sanitised with DOMPurify before it is rendered.
import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h1', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li', 'blockquote', 'a', 'span', 'div', 'hr', 'code', 'pre',
];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

export function sanitizeHtml(html) {
  if (!html) return '';
  return DOMPurify.sanitize(String(html), { ALLOWED_TAGS, ALLOWED_ATTR });
}
