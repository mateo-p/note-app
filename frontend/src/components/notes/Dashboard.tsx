"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Note, Category } from "@/lib/types";
import { notesApi, authApi } from "@/lib/api";
import { colors } from "@/lib/theme";
import CategorySidebar from "./CategorySidebar";
import CategoryDropdown from "./CategoryDropdown";
import NoteCard from "./NoteCard";
import dynamic from "next/dynamic";
const NoteEditor = dynamic(() => import("./NoteEditor"));
import EmptyState from "./EmptyState";

type Props = {
  initialNotes: Note[];
  categories: Category[];
}

const closeCategoryIcon = (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const plusIcon = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default function Dashboard({ initialNotes, categories }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  function refresh() {
    startTransition(() => router.refresh());
    notesApi.list().then((fresh) => setNotes(fresh as Note[])).catch(() => { });
  }

  const filtered = selectedCategory
    ? notes.filter((n) => n.category?.id === selectedCategory.id)
    : notes;

  const sorted = [...filtered].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  async function handleNewNote(category: Category) {
    const note = (await notesApi.create({ category_id: category.id, title: "", content: "" })) as Note;
    setNotes((prev) => [note, ...prev]);
    setActiveNote(note);
  }

  async function handleLogout() {
    await authApi.logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.bg }}>
      <CategorySidebar
        notes={notes}
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <div className="flex-1 flex flex-col min-w-0 pt-4 pr-6 pb-6 pl-4">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-6 pl-2">
          {selectedCategory ? (
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
              style={{ color: colors.text }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedCategory.color }} />
              {selectedCategory.name}
              {closeCategoryIcon}
            </button>
          ) : <div />}

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="text-xs underline transition-opacity hover:opacity-70"
              style={{ color: colors.textMuted }}
            >
              Log out
            </button>

            <CategoryDropdown
              categories={categories}
              onSelect={selectedCategory ? () => handleNewNote(selectedCategory) : handleNewNote}
              align="right"
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ border: `1.5px solid ${colors.border}`, color: colors.text }}
                >
                  {plusIcon}
                  New Note
                </button>
              }
            />
          </div>
        </div>

        {sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {sorted.map((note) => (
              <div key={note.id} className="break-inside-avoid mb-4">
                <NoteCard {...note} onClick={() => setActiveNote(note)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {activeNote ? (
        <NoteEditor
          note={activeNote}
          categories={categories}
          onClose={() => { setActiveNote(null); refresh(); }}
          onDelete={() => { setNotes((p) => p.filter((n) => n.id !== activeNote.id)); setActiveNote(null); }}
        />
      ) : null}
    </div>
  );
}
