import { serverNotesApi, serverCategoriesApi } from "@/lib/server-api";
import type { Note, Category } from "@/lib/types";
import Dashboard from "@/components/notes/Dashboard";
import { redirect } from "next/navigation";

export default async function HomePage() {
  let notes: Note[] = [];
  let categories: Category[] = [];

  try {
    [notes, categories] = await Promise.all([
      serverNotesApi.list(),
      serverCategoriesApi.list(),
    ]);
  } catch {
    redirect("/login");
  }

  return <Dashboard initialNotes={notes} categories={categories} />;
}
