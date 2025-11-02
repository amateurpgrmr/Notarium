const baseURL = import.meta.env.MODE === 'development'
  ? 'http://localhost:56533'
  : 'https://notarium-backend.notarium-backend.workers.dev';

export interface User {
  id: number;
  email: string;
  name: string;
  class: string;
  role: 'student' | 'admin';
  points: number;
  notes_count: number;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

let token: string | null = null;

// Initialize token from localStorage
if (typeof window !== 'undefined') {
  token = localStorage.getItem('token');
}

export const api = {
  async request(endpoint: string, options: any = {}) {
    const url = `${baseURL}${endpoint}`;

    console.log('API Request:', url);

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
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
        throw new Error(data.error || `API request failed: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  isAuthenticated: () => !!token,

  clearToken: () => {
    token = null;
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
  },

  // Legacy auth methods for compatibility
  register: async (email: string, password: string, name: string, role: string, classValue: string) => {
    const response = await api.auth.signup({ email, password, name, class: classValue });
    if (response.token) {
      token = response.token;
      localStorage.setItem('token', response.token);
    }
    return { success: true, user: response.user, token: response.token };
  },

  login: async (email: string, password: string) => {
    const response = await api.auth.login({ email, password });
    if (response.token) {
      token = response.token;
      localStorage.setItem('token', response.token);
    }
    return { success: true, user: response.user, token: response.token };
  },

  getCurrentUser: async () => {
    const response = await api.request('/api/auth/me', {
      method: 'GET'
    });
    return response;
  },

  updateProfile: async (data: any) => {
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

  getSubjects: () => api.request('/api/subjects'),
};

export default api;
