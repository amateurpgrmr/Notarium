/**
 * Subject Types
 * Shared subject-related interfaces and types
 */

export interface Subject {
  id: number;
  name: string;
  icon: string;
  color: string;
  noteCount?: number;
}
