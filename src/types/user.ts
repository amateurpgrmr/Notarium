/**
 * User Types
 * Shared user-related interfaces and types
 */

export interface User {
  id: number;
  email: string;
  name: string;
  class: string;
  role: 'student' | 'admin';
  points: number;
  notes_count: number;
  diamonds?: number;
  total_likes?: number;
  total_admin_upvotes?: number;
  description?: string;
  photo_url?: string;
  suspended?: number;
  suspension_end_date?: string;
  suspension_reason?: string;
  warning?: number;
  warning_message?: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
}

export interface ProfileUpdateData {
  name?: string;
  class?: string;
  description?: string;
  photo_url?: string;
}
