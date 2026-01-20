/**
 * Chat Types
 * Shared chat and messaging interfaces
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatSession {
  id: number;
  subject: string;
  topic: string;
  created_at: string;
  updated_at?: string;
  user_id: number;
}

export interface UploadedDocument {
  fileName: string;
  uploadedAt: string;
  fileUrl?: string;
}
