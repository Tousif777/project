// Placeholder auth utilities for development
// This will be replaced with real authentication in Phase 2

export interface User {
  id: string;
  username: string;
  email: string;
  role?: 'super-admin' | 'sub-admin' | 'viewer';
  permissions?: {
    canRunCalculations: boolean;
    canViewReports: boolean;
    canManageSettings: boolean;
    canExportData: boolean;
    canManageSubAdmins: boolean;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

// Simulated user for development
const DEMO_USER: User = {
  id: '1',
  username: 'admin',
  email: 'admin@fba-dashboard.com',
  role: 'super-admin',
  permissions: {
    canRunCalculations: true,
    canViewReports: true,
    canManageSettings: true,
    canExportData: true,
    canManageSubAdmins: true
  }
};

// Demo credentials
const DEMO_CREDENTIALS = {
  username: 'admin',
  password: 'password123'
};

export class AuthService {
  private static readonly AUTH_KEY = 'fba_auth_token';
  private static readonly USER_KEY = 'fba_user_data';

  static async login(username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
      // Store auth token and user data
      localStorage.setItem(this.AUTH_KEY, 'demo_token_123');
      localStorage.setItem(this.USER_KEY, JSON.stringify(DEMO_USER));
      
      return { success: true, user: DEMO_USER };
    }

    return { success: false, error: 'Invalid username or password' };
  }

  static logout(): void {
    localStorage.removeItem(this.AUTH_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.href = '/login';
  }

  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(this.AUTH_KEY) !== null;
  }

  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  static getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.AUTH_KEY);
  }

  static hasPermission(permission: keyof User['permissions']): boolean {
    const user = this.getCurrentUser();
    return user?.permissions?.[permission] || false;
  }

  static isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'super-admin';
  }

  static isSubAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'sub-admin';
  }

  static isViewer(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'viewer';
  }
}