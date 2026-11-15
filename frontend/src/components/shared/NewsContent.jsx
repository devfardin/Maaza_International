'use client';
// ─────────────────────────────────────────────────────────────────────────────
// NewsContent — renders an admin-written news body (HTML + CSS).
//
// The body runs inside its own <iframe srcDoc> with sandbox="allow-same-origin"
// and NO allow-scripts, so:
//   • the post's CSS cannot leak into the website, and the site's CSS cannot break the post;
//   • no script in the post can run;
//   • the frame gets a viewport meta tag and responsive base styles, so it works on phones,
//     tablets and desktops;
//   • the frame height follows its content (re-measured when images load or the width changes).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';

const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: transparent; color: #1e293b;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Bengali", sans-serif;
    font-size: 16px; line-height: 1.7; overflow-wrap: anywhere; word-break: break-word; }
  img, video, iframe, svg { max-width: 100%; height: auto; }
  img { display: block; }
  table { max-width: 100%; border-collapse: collapse; }
  a { color: #4d7c0f; }
  h1, h2, h3 { line-height: 1.25; }
  @media (max-width: 640px) { html, body { font-size: 15px; } }
`;

// Full document for the frame. Exported so the admin preview builds the same thing.
export function buildNewsDocument(html = '', css = '') {
  return `<!doctype html><html><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<base target="_blank"><style>${BASE_CSS}</style><style>${css}</style></head>` +
    `<body>${html}</body></html>`;
}

export default function NewsContent({ html = '', css = '', minHeight = 160, className = '' }) {
  const frameRef = useRef(null);
  const [height, setHeight] = useState(minHeight);
  const srcDoc = buildNewsDocument(html, css);

  // Keep the frame tall enough for its content, whenever the content reflows
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    let observer = null;

    const measure = () => {
      const doc = frame.contentDocument;
      if (doc?.documentElement) setHeight(Math.max(minHeight, doc.documentElement.scrollHeight));
    };

    const attach = () => {
      const doc = frame.contentDocument;
      if (!doc?.body) return;
      measure();
      const RO = doc.defaultView?.ResizeObserver;
      if (RO) {
        observer?.disconnect();
        observer = new RO(measure);
        observer.observe(doc.body);
      }
    };

    frame.addEventListener('load', attach);
    attach();
    const onResize = () => measure();
    window.addEventListener('resize', onResize);

    return () => {
      frame.removeEventListener('load', attach);
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
    };
  }, [srcDoc, minHeight]);

  return (
    <iframe
      ref={frameRef}
      title="News content"
      srcDoc={srcDoc}
      sandbox="allow-same-origin"
      loading="lazy"
      className={`block w-full border-0 bg-transparent ${className}`}
      style={{ height }}
    />
  );
}
