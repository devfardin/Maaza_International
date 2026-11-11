// Escapes user-provided text before it is placed inside an HTML email body
export const escapeHtml = (value: string) =>
    String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
