import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import api from '@/lib/api';

/**
 * Authentication hook
 * Manages user authentication state and provides auth methods
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await api.getCurrentUser();
      setUser(response);
      setError(null);
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.login(email, password);

      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        setUser(response.user);
        return { success: true };
      }

      throw new Error('Login failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.email?.endsWith('@notarium.site'),
    login,
    logout,
    updateUser,
    refreshUser: checkAuth,
  };
}
