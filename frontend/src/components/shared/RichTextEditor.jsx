'use client';
// Lightweight WYSIWYG (TipTap) used for payment-method description / instructions.
// Output is HTML; it is sanitised again when rendered (see SafeHtml).
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

const btn = (active) =>
  `px-2 py-1 rounded-md text-xs font-bold border ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`;

export default function RichTextEditor({ value, onChange, placeholder = 'Write here…' }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false, autolink: true } })],
    content: value || '',
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'min-h-[140px] px-3 py-2 outline-none text-sm prose-maaza', 'data-placeholder': placeholder },
    },
    onUpdate: ({ editor: ed }) => onChange?.(ed.getHTML() === '<p></p>' ? '' : ed.getHTML()),
  });

  // keep the editor in sync when the parent resets/loads a different value
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML() && !(value === '' && editor.getText() === '')) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) return <div className="h-[180px] rounded-xl border bg-slate-50 animate-pulse" />;

  const setLink = () => {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Link URL (https://…)', prev);
    if (url === null) return;
    if (url === '') return editor.chain().focus().extendMarkRange('link').unsetLink().run();
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank', rel: 'noopener noreferrer' }).run();
  };

  return (
    <div className="rounded-xl border border-slate-300 focus-within:border-blue-500 bg-white overflow-hidden">
      <div className="flex flex-wrap gap-1 border-b bg-slate-50 p-2">
        <button type="button" className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
        <button type="button" className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></button>
        <button type="button" className={btn(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline?.().run()}><u>U</u></button>
        <button type="button" className={btn(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <button type="button" className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
        <button type="button" className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
        <button type="button" className={btn(editor.isActive('link'))} onClick={setLink}>🔗 Link</button>
        <button type="button" className={btn(false)} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>Clear</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
