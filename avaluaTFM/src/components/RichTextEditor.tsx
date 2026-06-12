/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Link2 } from 'lucide-react';

interface RichTextEditorProps {
  id: string;
  value: string; // HTML string
  onChange: (newValue: string) => void;
  placeholder?: string;
  label?: string;
}

export default function RichTextEditor({
  id,
  value,
  onChange,
  placeholder = 'Comença a escriure les teves notes...',
  label,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync state to DOM only if they differ to avoid cursor jumping
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const promptLink = () => {
    const url = prompt('Introdueix la URL:', 'https://');
    if (url) {
      execCommand('createLink', url);
    }
  };

  return (
    <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all duration-200">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 pt-3 select-none">
          {label}
        </label>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 bg-slate-50/75 p-2 gap-1 select-none">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            id={`${id}-btn-bold`}
            onClick={() => execCommand('bold')}
            className="p-1.5 rounded-md hover:bg-slate-200/80 text-slate-700 hover:text-slate-950 transition-colors duration-150"
            title="Negreta"
          >
            <Bold size={16} className="stroke-[2.5]" />
          </button>
          
          <button
            type="button"
            id={`${id}-btn-italic`}
            onClick={() => execCommand('italic')}
            className="p-1.5 rounded-md hover:bg-slate-200/80 text-slate-700 hover:text-slate-950 transition-colors duration-150"
            title="Cursiva"
          >
            <Italic size={16} className="stroke-[2.5]" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <button
            type="button"
            id={`${id}-btn-bullet`}
            onClick={() => execCommand('insertUnorderedList')}
            className="p-1.5 rounded-md hover:bg-slate-200/80 text-slate-700 hover:text-slate-950 transition-colors duration-150"
            title="Llista de punts"
          >
            <List size={16} />
          </button>

          <button
            type="button"
            id={`${id}-btn-number`}
            onClick={() => execCommand('insertOrderedList')}
            className="p-1.5 rounded-md hover:bg-slate-200/80 text-slate-700 hover:text-slate-950 transition-colors duration-150"
            title="Llista numerada"
          >
            <ListOrdered size={16} />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <button
            type="button"
            id={`${id}-btn-link`}
            onClick={promptLink}
            className="p-1.5 rounded-md hover:bg-slate-200/80 text-slate-700 hover:text-slate-950 transition-colors duration-150"
            title="Afegeix enllaç"
          >
            <Link2 size={16} />
          </button>
        </div>
      </div>

      {/* Editor Space */}
      <div className="relative p-4 min-h-[160px] bg-white">
        <div
          id={id}
          ref={editorRef}
          className="outline-hidden prose prose-slate max-w-none text-sm text-slate-800 min-h-[140px] focus:outline-hidden selection:bg-indigo-200 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-indigo-600 [&_a]:underline"
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          style={{ minHeight: '140px' }}
        />
        {!value && (
          <div className="absolute top-4 left-4 text-sm text-slate-400 pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>

      <div className="bg-slate-50/50 px-4 py-1.5 border-t border-slate-100 flex justify-end text-[10px] text-slate-400 tracking-wide select-none">
         Desat automàtic actiu
      </div>
    </div>
  );
}
