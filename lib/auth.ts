import Cookies from 'js-cookie';

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

export class AuthService {
  private static readonly AUTH_KEY = 'fba_auth_token';
  private static readonly USER_KEY = 'fba_user_data';

  static async login(username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      // Store auth token and user data in cookies
      Cookies.set(this.AUTH_KEY, 'mongodb_token_123', { expires: 7 }); // Expires in 7 days
      Cookies.set(this.USER_KEY, JSON.stringify(data.user), { expires: 7 });
      
      return { success: true, user: data.user };

    } catch (err) {
      console.error('Login service error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  static async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Failed to logout from server:', error);
    }

    // Always clear client-side data and redirect
    Cookies.remove(this.AUTH_KEY);
    Cookies.remove(this.USER_KEY);
    window.location.href = '/login';
  }

  static isAuthenticated(): boolean {
    return !!Cookies.get(this.AUTH_KEY);
  }

  static getCurrentUser(): User | null {
    const userData = Cookies.get(this.USER_KEY);
    try {
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      return null;
    }
  }

  static getAuthToken(): string | null {
    return Cookies.get(this.AUTH_KEY) || null;
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