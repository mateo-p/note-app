/**
 * Client-safe API functions.
 * All calls go to /api/* — proxied to Django by next.config rewrites.
 * The browser automatically includes httpOnly cookies.
 */

import type { Note, Category, NotePayload } from "./types";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
    ...init,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const authApi = {
  signup: (email: string, password: string) =>
    request("/auth/signup/", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request("/auth/login/", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request("/auth/logout/", { method: "POST" }),
  refresh: () => request("/auth/refresh/", { method: "POST" }),
  me: () => request<{ id: string; email: string }>("/auth/me/"),
};

export const categoriesApi = {
  list: () => request<Category[]>("/categories/"),
};

export const notesApi = {
  list: (params?: { category?: number; search?: string; archived?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", String(params.category));
    if (params?.search) qs.set("search", params.search);
    if (params?.archived !== undefined) qs.set("archived", String(params.archived));
    return request<Note[]>(`/notes/${qs.toString() ? `?${qs}` : ""}`);
  },
  create: (data: NotePayload) =>
    request<Note>("/notes/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: NotePayload) =>
    request<Note>(`/notes/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/notes/${id}/`, { method: "DELETE" }),
};
