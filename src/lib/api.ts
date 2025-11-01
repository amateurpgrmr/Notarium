const baseURL = 'https://notarium-backend.notarium-backend.workers.dev';

export interface User {
  id: number;
  email: string;
  name: string;
  grade: string;
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

export const api = {
  async request(endpoint: string, options: any = {}) {
    const url = `${baseURL}${endpoint}`;
    
    console.log('API Request:', url);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
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

  // Auth endpoints
  auth: {
    login: (credentials: LoginCredentials): Promise<LoginResponse> => 
      api.request('/api/auth/login', {
        method: 'POST',
        body: credentials
      }),
  },

  // Notes endpoints  
  notes: {
    getAll: () => api.request('/api/notes'),
    create: (note: any) => api.request('/api/notes', {
      method: 'POST',
      body: note
    }),
  },

  // Subjects endpoints
  subjects: {
    getAll: () => api.request('/api/subjects'),
  },
};

export default api;
