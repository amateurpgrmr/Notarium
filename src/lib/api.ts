const baseURL = import.meta.env.MODE === 'development'
  ? 'http://localhost:8787'
  : (import.meta.env.VITE_API_URL || 'https://notarium-backend.notarium-backend.workers.dev');

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

export interface LoginCredentials {
  email: string;
  password: string;
  class?: string;
}

let cachedToken: string | null = null;

// Initialize token from localStorage
if (typeof window !== 'undefined') {
  cachedToken = localStorage.getItem('token');
}

// Helper to get current token from localStorage
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return cachedToken;
};

export const api = {
  async request(endpoint: string, options: any = {}) {
    const url = `${baseURL}${endpoint}`;

    const currentToken = getToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || `API request failed: ${response.status}`;
        console.error(`API Error (${response.status}):`, {
          url,
          status: response.status,
          error: errorMsg,
          fullResponse: data,
          hasToken: !!currentToken,
          tokenLength: currentToken?.length || 0
        });
        throw new Error(errorMsg);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  isAuthenticated: () => !!getToken(),

  clearToken: () => {
    cachedToken = null;
    localStorage.removeItem('token');
  },

  logout: () => {
    api.clearToken();
  },

  // Auth endpoints
  auth: {
    signup: (data: any) =>
      api.request('/api/auth/signup', {
        method: 'POST',
        body: data
      }),
    login: (credentials: LoginCredentials): Promise<LoginResponse> =>
      api.request('/api/auth/login', {
        method: 'POST',
        body: credentials
      }),
    adminLogin: (credentials: LoginCredentials): Promise<LoginResponse> =>
      api.request('/api/auth/admin-login', {
        method: 'POST',
        body: credentials
      }),
  },

  // Legacy auth methods for compatibility
  register: async (email: string, password: string, name: string, role: string, classValue: string) => {
    const response = await api.auth.signup({ email, password, name, class: classValue });
    if (response.token) {
      cachedToken = response.token;
      localStorage.setItem('token', response.token);
    }
    return { success: true, user: response.user, token: response.token };
  },

  login: async (email: string, password: string) => {
    const response = await api.auth.login({ email, password });
    if (response.token) {
      cachedToken = response.token;
      localStorage.setItem('token', response.token);
    }
    return { success: true, user: response.user, token: response.token };
  },

  getCurrentUser: async () => {
    const token = getToken();
    const response = await api.request('/api/auth/me', {
      method: 'GET'
    });
    return response;
  },

  updateProfile: async (data: any) => {
    const token = getToken();
    const response = await api.request('/api/auth/profile', {
      method: 'PUT',
      body: data
    });
    return response;
  },

  // Notes endpoints
  notes: {
    getAll: () => api.request('/api/notes'),
    create: (note: any) => api.request('/api/notes', {
      method: 'POST',
      body: note
    }),
  },

  getNotes: () => api.request('/api/notes'),

  // Subjects endpoints
  subjects: {
    getAll: () => api.request('/api/subjects'),
  },

  getSubjects: async () => {
    try {
      const response = await api.request('/api/subjects');
      return {
        subjects: response.subjects || response.data || response || []
      };
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      return { subjects: [] };
    }
  },

  getSubjectNotes: async (subjectId: number) => {
    try {
      const response = await api.request(`/api/subjects/${subjectId}/notes`);
      return {
        notes: response.notes || response.data || response || []
      };
    } catch (error) {
      console.error('Failed to fetch subject notes:', error);
      return { notes: [] };
    }
  },

  getLeaderboard: async () => {
    try {
      const response = await api.request('/api/leaderboard');
      return {
        leaderboard: response.leaderboard || response.data || response || []
      };
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return { leaderboard: [] };
    }
  },

  // Search notes
  searchNotes: async (query: string) => {
    try {
      const response = await api.request(`/api/notes/search?q=${encodeURIComponent(query)}`);
      return {
        notes: response.notes || response.data || []
      };
    } catch (error) {
      console.error('Failed to search notes:', error);
      return { notes: [] };
    }
  },

  // Note interactions
  likeNote: async (noteId: number) => {
    try {
      const response = await api.request(`/api/notes/${noteId}/like`, {
        method: 'POST'
      });
      return { success: true, note: response.note };
    } catch (error) {
      console.error('Failed to like note:', error);
      return { success: false };
    }
  },

  upvoteNote: async (noteId: number) => {
    try {
      const response = await api.request(`/api/notes/${noteId}/upvote`, {
        method: 'POST'
      });
      return { success: true, note: response.note };
    } catch (error) {
      console.error('Failed to upvote note:', error);
      return { success: false };
    }
  },

  // Chat endpoints
  chat: {
    createSession: async (subject: string, topic: string) => {
      try {
        const response = await api.request('/api/chat/sessions', {
          method: 'POST',
          body: { subject, topic }
        });
        return { session: response.session };
      } catch (error: any) {
        console.error('Failed to create chat session:', error);
        throw error;
      }
    },
    getSessions: async () => {
      try {
        const response = await api.request('/api/chat/sessions', {
          method: 'GET'
        });
        return { sessions: response.sessions || [] };
      } catch (error) {
        console.error('Failed to fetch chat sessions:', error);
        return { sessions: [] };
      }
    },
    getMessages: async (sessionId: number) => {
      try {
        const response = await api.request(`/api/chat/sessions/${sessionId}/messages`, {
          method: 'GET'
        });
        return { messages: response.messages || [] };
      } catch (error) {
        console.error('Failed to fetch chat messages:', error);
        return { messages: [] };
      }
    },
    addMessage: async (sessionId: number, role: string, content: string) => {
      try {
        const response = await api.request(`/api/chat/sessions/${sessionId}/messages`, {
          method: 'POST',
          body: { role, content }
        });
        return { message: response.message };
      } catch (error: any) {
        console.error('Failed to add message:', error);
        throw error;
      }
    },
    getAIResponse: async (message: string, subject: string) => {
      try {
        const response = await api.request('/api/chat/ai-response', {
          method: 'POST',
          body: { message, subject }
        });
        return { response: response.response || '' };
      } catch (error: any) {
        console.error('Failed to get AI response:', error);
        throw error;
      }
    },
    uploadDocument: async (documentBase64: string, fileName: string, sessionId: number) => {
      try {
        const response = await api.request('/api/chat/upload-document', {
          method: 'POST',
          body: { documentBase64, fileName, sessionId }
        });
        return { success: true, document: response.document || { fileName }, message: response.message || '' };
      } catch (error: any) {
        console.error('Failed to upload document:', error);
        throw error;
      }
    },
    analyzeNotes: async (subject: string, topic?: string) => {
      try {
        const response = await api.request('/api/chat/analyze-notes', {
          method: 'POST',
          body: { subject, topic }
        });
        return { analysis: response.analysis || '', keyConcepts: response.keyConcepts || [] };
      } catch (error: any) {
        console.error('Failed to analyze notes:', error);
        throw error;
      }
    }
  },

  // AI Features
  ai: {
    generateSummary: async (noteId: number, content: string) => {
      try {
        const response = await api.request(`/api/notes/${noteId}/summary`, {
          method: 'POST',
          body: { content }
        });
        return { summary: response.summary || '' };
      } catch (error: any) {
        console.error('Failed to generate summary:', error);
        throw error;
      }
    },
    generateQuiz: async (noteId: number, content: string) => {
      try {
        const response = await api.request(`/api/notes/${noteId}/quiz`, {
          method: 'POST',
          body: { content }
        });
        return { quiz: response.quiz || { questions: [] } };
      } catch (error: any) {
        console.error('Failed to generate quiz:', error);
        throw error;
      }
    },
    generateStudyPlan: async (subject: string, topic: string) => {
      try {
        const response = await api.request('/api/study-plan', {
          method: 'POST',
          body: { subject, topic }
        });
        return { plan: response.plan || '' };
      } catch (error: any) {
        console.error('Failed to generate study plan:', error);
        throw error;
      }
    },
    explainConcept: async (concept: string) => {
      try {
        const response = await api.request('/api/concept-explain', {
          method: 'POST',
          body: { concept }
        });
        return { explanation: response.explanation || '' };
      } catch (error: any) {
        console.error('Failed to explain concept:', error);
        throw error;
      }
    },
    performOCR: async (imageBase64: string, mimeType: string = 'image/jpeg') => {
      try {
        const response = await api.request('/api/gemini/ocr', {
          method: 'POST',
          body: { imageBase64, mimeType }
        });
        return { text: response.text || '', success: response.success || false };
      } catch (error: any) {
        console.error('Failed to perform OCR:', error);
        throw error;
      }
    }
  },

  // Debug endpoints
  debug: {
    testUpdate: async (userId: number, name: string) => {
      try {
        const response = await api.request('/api/debug/verify-update', {
          method: 'POST',
          body: { userId, name }
        });
        return response;
      } catch (error: any) {
        console.error('Debug test failed:', error);
        throw error;
      }
    }
  },

  // Admin endpoints
  admin: {
    verify: async (email: string, password: string) => {
      try {
        const response = await api.request('/api/admin/verify', {
          method: 'POST',
          body: { email, password }
        });
        return { success: response.success || false };
      } catch (error: any) {
        console.error('Failed to verify admin:', error);
        return { success: false };
      }
    },
    getUsers: async () => {
      try {
        const response = await api.request('/api/admin/users', {
          method: 'GET'
        });
        return { users: response.users || [] };
      } catch (error) {
        console.error('Failed to fetch admin users:', error);
        return { users: [] };
      }
    },
    getNotes: async () => {
      try {
        const response = await api.request('/api/admin/notes', {
          method: 'GET'
        });
        return { notes: response.notes || [] };
      } catch (error) {
        console.error('Failed to fetch admin notes:', error);
        return { notes: [] };
      }
    },
    deleteUser: async (userId: number) => {
      try {
        const response = await api.request(`/api/admin/user/${userId}`, {
          method: 'DELETE'
        });
        return { success: true };
      } catch (error: any) {
        console.error('Failed to delete user:', error);
        throw error;
      }
    },
    suspendUser: async (userId: number, days: number, reason: string) => {
      try {
        const response = await api.request(`/api/admin/suspend/${userId}`, {
          method: 'POST',
          body: { days, reason }
        });
        return { success: true, ...response };
      } catch (error: any) {
        console.error('Failed to suspend user:', error);
        throw error;
      }
    },
    warnUser: async (userId: number, message: string) => {
      try {
        const response = await api.request(`/api/admin/warn/${userId}`, {
          method: 'POST',
          body: { message }
        });
        return { success: true, ...response };
      } catch (error: any) {
        console.error('Failed to warn user:', error);
        throw error;
      }
    },
    unsuspendUser: async (userId: number) => {
      try {
        const response = await api.request(`/api/admin/unsuspend/${userId}`, {
          method: 'POST'
        });
        return { success: true, ...response };
      } catch (error: any) {
        console.error('Failed to unsuspend user:', error);
        throw error;
      }
    },
    likeNote: async (noteId: number) => {
      try {
        const response = await api.request(`/api/admin/notes/${noteId}/like`, {
          method: 'POST'
        });
        return { liked: response.liked };
      } catch (error: any) {
        console.error('Failed to toggle admin like:', error);
        throw error;
      }
    },
    deleteNote: async (noteId: number) => {
      try {
        const response = await api.request(`/api/admin/notes/${noteId}`, {
          method: 'DELETE'
        });
        return { success: response.success };
      } catch (error: any) {
        console.error('Failed to delete note:', error);
        throw error;
      }
    }
  }
};

export default api;
