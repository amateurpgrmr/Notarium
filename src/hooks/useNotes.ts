import { useState, useCallback } from 'react';
import { Note } from '@/types';
import api from '@/lib/api';

/**
 * Notes management hook
 * Handles fetching, creating, updating, and deleting notes
 */
export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async (filters?: { subject?: number; status?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.notes.getAll(filters);
      setNotes(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch notes';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getNoteById = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.notes.getById(id);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch note';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createNote = useCallback(async (noteData: Partial<Note>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.notes.create(noteData);
      setNotes(prev => [response, ...prev]);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create note';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateNote = useCallback(async (id: number, noteData: Partial<Note>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.notes.update(id, noteData);
      setNotes(prev => prev.map(note => (note.id === id ? { ...note, ...response } : note)));
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update note';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteNote = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await api.notes.delete(id);
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete note';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const likeNote = useCallback(async (id: number) => {
    try {
      await api.notes.like(id);
      setNotes(prev =>
        prev.map(note =>
          note.id === id
            ? { ...note, likes: note.likes + 1, liked_by_me: true }
            : note
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to like note';
      setError(message);
      throw err;
    }
  }, []);

  const unlikeNote = useCallback(async (id: number) => {
    try {
      await api.notes.unlike(id);
      setNotes(prev =>
        prev.map(note =>
          note.id === id
            ? { ...note, likes: note.likes - 1, liked_by_me: false }
            : note
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unlike note';
      setError(message);
      throw err;
    }
  }, []);

  return {
    notes,
    loading,
    error,
    fetchNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
    likeNote,
    unlikeNote,
  };
}
