export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDraft {
  title: string;
  content: string;
}

export type MutationResult =
  { ok: true } | { ok: false; message: string; blocked: boolean };

export type CreateResult = MutationResult;

export type EditResult =
  | { ok: true; changed: boolean }
  | { ok: false; message: string; blocked: boolean };
