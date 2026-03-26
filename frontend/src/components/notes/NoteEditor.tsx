"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Note, Category } from "@/lib/types";
import { notesApi } from "@/lib/api";
import { colors } from "@/lib/theme";
import { formatLastEdited } from "@/lib/utils";
import CategoryDropdown from "./CategoryDropdown";

type Props = {
  note: Note;
  categories: Category[];
  onClose: () => void;
  onDelete: () => void;
}

const closeIcon = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function NoteEditor({ note, categories, onClose, onDelete }: Props) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [category, setCategory] = useState<Category | null>(note.category);
  const [lastEdited, setLastEdited] = useState(note.updated_at);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);

  const save = useCallback(
    async (t: string, c: string, cat: Category | null) => {
      await notesApi.update(note.id, { title: t, content: c, category_id: cat?.id ?? null });
      setLastEdited(new Date().toISOString());
    },
    [note.id]
  );

  useEffect(() => {
    if (!isDirty.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(title, content, category), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [title, content, category, save]);

  const handleClose = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (!isDirty.current) {
      if (!title.trim() && !content.trim()) {
        notesApi.delete(note.id).catch(() => { });
        onDelete();
      } else {
        onClose();
      }
      return;
    }
    save(title, content, category).then(() => {
      if (!title.trim() && !content.trim()) {
        notesApi.delete(note.id).catch(() => { });
        onDelete();
      } else {
        onClose();
      }
    });
  }, [save, title, content, category, note.id, onDelete, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleClose]);

  async function handleDelete() {
    await notesApi.delete(note.id);
    onDelete();
  }

  const bg = category?.color ?? colors.bgNote;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: colors.bgOverlay, backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="w-full max-w-3xl rounded-3xl flex flex-col" style={{ minHeight: "520px", maxHeight: "85vh" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <CategoryDropdown
            categories={categories}
            selected={category}
            onSelect={(cat) => { isDirty.current = true; setCategory(cat); }}
          />
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center hover:opacity-70" style={{ color: colors.text }}>
            {closeIcon}
          </button>
        </div>

        {/* Card */}
        <div className="note-card mx-5 mb-2 rounded-2xl flex-1 flex flex-col p-8 overflow-auto" style={{ backgroundColor: bg, minHeight: "400px" }}>
          <p className="text-right text-xs mb-6 opacity-70" style={{ color: colors.textDark }}>
            Last Edited: {formatLastEdited(lastEdited)}
          </p>
          <input
            type="text"
            value={title}
            onChange={(e) => { isDirty.current = true; setTitle(e.target.value); }}
            placeholder="Note Title"
            className="w-full text-2xl font-bold mb-4 font-serif"
            style={{ color: colors.textDark, fontFamily: "'Playfair Display', serif" }}
          />
          <textarea
            value={content}
            onChange={(e) => { isDirty.current = true; setContent(e.target.value); }}
            placeholder="Pour your heart out..."
            className="flex-1 w-full resize-none text-sm leading-relaxed"
            style={{ color: colors.textDeep, minHeight: "280px" }}
          />
        </div>

        <div className="flex justify-end px-5 pb-3">
          <button onClick={handleDelete} className="hover:opacity-70 transition-opacity" style={{ color: colors.textMuted }} title="Delete note">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
