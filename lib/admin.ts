// Admin management utilities for sub-admin functionality

export interface SubAdmin {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'sub-admin' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  permissions: {
    canRunCalculations: boolean;
    canViewReports: boolean;
    canManageSettings: boolean;
    canExportData: boolean;
  };
  createdAt: string;
  lastLogin?: string;
  createdBy: string;
}

export interface CreateSubAdminRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: 'sub-admin' | 'viewer';
  permissions: {
    canRunCalculations: boolean;
    canViewReports: boolean;
    canManageSettings: boolean;
    canExportData: boolean;
  };
  notes?: string;
}

export class AdminService {
  private static readonly ADMINS_KEY = 'fba_sub_admins';

  static async createSubAdmin(data: CreateSubAdminRequest): Promise<{ success: boolean; error?: string; admin?: SubAdmin }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Validate required fields
    if (!data.username || !data.email || !data.password) {
      return { success: false, error: 'Username, email, and password are required' };
    }

    // Check if username or email already exists
    const existingAdmins = this.getSubAdmins();
    const usernameExists = existingAdmins.some(admin => admin.username === data.username);
    const emailExists = existingAdmins.some(admin => admin.email === data.email);

    if (usernameExists) {
      return { success: false, error: 'Username already exists' };
    }

    if (emailExists) {
      return { success: false, error: 'Email already exists' };
    }

    // Create new sub-admin
    const newAdmin: SubAdmin = {
      id: Date.now().toString(),
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      status: 'pending',
      permissions: data.permissions,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'admin' // In real implementation, get from current user
    };

    // Save to storage
    const admins = [...existingAdmins, newAdmin];
    this.saveSubAdmins(admins);

    // In real implementation, send invitation email here
    console.log(`Invitation email sent to ${data.email}`);

    return { success: true, admin: newAdmin };
  }

  static async updateSubAdmin(id: string, updates: Partial<SubAdmin>): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const admins = this.getSubAdmins();
    const adminIndex = admins.findIndex(admin => admin.id === id);

    if (adminIndex === -1) {
      return { success: false, error: 'Sub-admin not found' };
    }

    // Update admin
    admins[adminIndex] = { ...admins[adminIndex], ...updates };
    this.saveSubAdmins(admins);

    return { success: true };
  }

  static async deleteSubAdmin(id: string): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const admins = this.getSubAdmins();
    const filteredAdmins = admins.filter(admin => admin.id !== id);

    if (filteredAdmins.length === admins.length) {
      return { success: false, error: 'Sub-admin not found' };
    }

    this.saveSubAdmins(filteredAdmins);
    return { success: true };
  }

  static async toggleSubAdminStatus(id: string): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const admins = this.getSubAdmins();
    const admin = admins.find(admin => admin.id === id);

    if (!admin) {
      return { success: false, error: 'Sub-admin not found' };
    }

    admin.status = admin.status === 'active' ? 'inactive' : 'active';
    this.saveSubAdmins(admins);

    return { success: true };
  }

  static getSubAdmins(): SubAdmin[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(this.ADMINS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static getSubAdminById(id: string): SubAdmin | null {
    const admins = this.getSubAdmins();
    return admins.find(admin => admin.id === id) || null;
  }

  static getSubAdminStats() {
    const admins = this.getSubAdmins();
    
    return {
      total: admins.length,
      active: admins.filter(admin => admin.status === 'active').length,
      inactive: admins.filter(admin => admin.status === 'inactive').length,
      pending: admins.filter(admin => admin.status === 'pending').length,
      subAdmins: admins.filter(admin => admin.role === 'sub-admin').length,
      viewers: admins.filter(admin => admin.role === 'viewer').length
    };
  }

  static hasPermission(adminId: string, permission: keyof SubAdmin['permissions']): boolean {
    const admin = this.getSubAdminById(adminId);
    return admin?.permissions[permission] || false;
  }

  static async sendInvitationEmail(email: string, tempPassword: string): Promise<{ success: boolean; error?: string }> {
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Invitation email sent to ${email} with temporary password: ${tempPassword}`);
    return { success: true };
  }

  static async resendInvitation(adminId: string): Promise<{ success: boolean; error?: string }> {
    const admin = this.getSubAdminById(adminId);
    
    if (!admin) {
      return { success: false, error: 'Sub-admin not found' };
    }

    if (admin.status !== 'pending') {
      return { success: false, error: 'Can only resend invitations to pending users' };
    }

    // Simulate resending invitation
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Invitation resent to ${admin.email}`);
    
    return { success: true };
  }

  private static saveSubAdmins(admins: SubAdmin[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.ADMINS_KEY, JSON.stringify(admins));
    }
  }
}