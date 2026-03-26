/**
 * Server-only API functions (use in Server Components only).
 * Calls Django directly via INTERNAL_API_URL and forwards cookies
 * from the incoming Next.js request.
 */
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { Note, Category } from "./types";

const BASE = process.env.INTERNAL_API_URL ?? "http://localhost:8000";

async function serverFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      ...init.headers,
    },
    // Don't cache authenticated data by default
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const serverNotesApi = {
  list: cache((params?: { category?: number; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", String(params.category));
    if (params?.search) qs.set("search", params.search);
    return serverFetch<Note[]>(`/notes/${qs.toString() ? `?${qs}` : ""}`);
  }),
};

export const serverCategoriesApi = {
  list: cache(() => serverFetch<Category[]>("/categories/")),
};
