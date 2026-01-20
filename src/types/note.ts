/**
 * Note Types
 * Shared note-related interfaces and types
 */

export interface Note {
  id: number;
  title: string;
  description: string;
  content?: string;
  author_name: string;
  author_class: string;
  author_photo?: string;
  author_id?: number;
  subject_id: number;
  image?: string;
  tags?: string[];
  likes: number;
  admin_upvotes: number;
  created_at: string;
  liked_by_me?: boolean;
  upvoted_by_me?: boolean;
  parent_note_id?: number | null;
  part_number?: number | null;
  status?: 'draft' | 'published';
}

export interface NotesBySubject {
  subject_id: number;
  subject_name: string;
  notes: Note[];
}

export interface NoteUploadData {
  title: string;
  description: string;
  content?: string;
  subject_id: number;
  image?: string;
  tags?: string[];
  status?: 'draft' | 'published';
}
