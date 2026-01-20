declare module './lib/api' {
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

  export const api: {
    request(endpoint: string, options?: any): Promise<any>;
    auth: {
      login(credentials: LoginCredentials): Promise<LoginResponse>;
    };
    notes: {
      getAll(): Promise<any>;
      create(note: any): Promise<any>;
    };
    subjects: {
      getAll(): Promise<any>;
    };
  };

  export default api;
}
