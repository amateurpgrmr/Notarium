// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://notarium-backend.notarium-backend.workers.dev'

// Types
export interface User {
  id: number
  email: string
  name: string
  picture?: string
  role: string
  points: number
  notes_count: number
  class?: string
}

export interface Note {
  id: number
  author_id: number
  title: string
  content: string
  subject?: string
  tags?: string
  views: number
  rating_avg: number
  rating_count: number
  is_public: boolean
  created_at: string
  updated_at: string
  author_name?: string
  author_photo?: string
}

export interface Subject {
  id: number
  name: string
  icon: string
  note_count: number
}

export interface AuthResponse {
  success: boolean
  token: string
  user: User
}

// API Client Class
class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.token = localStorage.getItem('notarium_token')
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('notarium_token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('notarium_token')
  }

  getToken(): string | null {
    return this.token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const config: RequestInit = {
      ...options,
      headers,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }))
        throw new Error(error.error || error.message || 'Request failed')
      }

      return await response.json()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  // ==================== AUTH ====================

  async register(email: string, password: string, name: string, role: string = 'student'): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    })
    
    if (response.success && response.token) {
      this.setToken(response.token)
    }
    
    return response
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    
    if (response.success && response.token) {
      this.setToken(response.token)
    }
    
    return response
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me')
  }

  async updateProfile(data: { name: string; class?: string; photo_url?: string }): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  logout() {
    this.clearToken()
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  // ==================== SUBJECTS ====================

  async getSubjects(): Promise<{ subjects: Subject[] }> {
    return this.request<{ subjects: Subject[] }>('/api/subjects')
  }

  // ==================== NOTES ====================

  async getNotes(subject?: string): Promise<{ notes: Note[] }> {
    const query = subject ? `?subject=${encodeURIComponent(subject)}` : ''
    return this.request<{ notes: Note[] }>(`/api/notes${query}`)
  }

  async getNote(id: number): Promise<{ note: Note }> {
    return this.request<{ note: Note }>(`/api/notes/${id}`)
  }

  async createNote(data: {
    title: string
    content: string
    subject?: string
    tags?: string
    is_public?: boolean
  }): Promise<{ success: boolean; noteId: number }> {
    return this.request<{ success: boolean; noteId: number }>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateNote(
    id: number,
    data: {
      title: string
      content: string
      subject?: string
      tags?: string
      is_public?: boolean
    }
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteNote(id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/notes/${id}`, {
      method: 'DELETE',
    })
  }

  // ==================== ADMIN ====================

  async getAllUsers(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('/api/admin/users')
  }

  async suspendUser(userId: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/admin/users/${userId}/suspend`, {
      method: 'POST',
    })
  }

  async unsuspendUser(userId: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/admin/users/${userId}/unsuspend`, {
      method: 'POST',
    })
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL)
export default api