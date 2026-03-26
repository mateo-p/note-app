export type User = {
  id: string;
  email: string;
  created_at: string;
}

export type Category = {
  id: number;
  name: string;
  color: string;
}

export type Note = {
  id: string;
  title: string;
  content: string;
  category: Category | null;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type NotePayload = {
  title?: string;
  content?: string;
  category_id?: number | null;
  is_pinned?: boolean;
  is_archived?: boolean;
}

export type ApiError = {
  detail?: string;
  [key: string]: unknown;
}
