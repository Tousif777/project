'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  UserPlus, 
  Users, 
  Shield, 
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Key,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import Header from '@/components/dashboard/Header';

interface SubAdmin {
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

export default function AdminContent() {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<SubAdmin | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const [newAdmin, setNewAdmin] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'sub-admin' as 'sub-admin' | 'viewer',
    permissions: {
      canRunCalculations: true,
      canViewReports: true,
      canManageSettings: false,
      canExportData: false
    },
    notes: ''
  });

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; admin: SubAdmin | null }>({ open: false, admin: null });

  useEffect(() => {
    fetch('/api/admin/sub-admins')
      .then(res => res.json())
      .then(data => setSubAdmins(data));
  }, []);

  const handleCreateAdmin = async () => {
    setLoading(true);
    setSuccess('');
    try {
      const res = await fetch('/api/admin/sub-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin),
      });
      if (!res.ok) {
        const err = await res.json();
        setSuccess(err.error || 'Failed to create sub-admin.');
      } else {
        setSuccess('Sub-admin created successfully! Invitation email sent.');
        setIsCreateDialogOpen(false);
        setNewAdmin({
          username: '',
          email: '',
          firstName: '',
          lastName: '',
          password: '',
          role: 'sub-admin',
          permissions: {
            canRunCalculations: true,
            canViewReports: true,
            canManageSettings: false,
            canExportData: false
          },
          notes: ''
        });
        // Refresh list
        const updated = await fetch('/api/admin/sub-admins').then(r => r.json());
        setSubAdmins(updated);
      }
    } catch (e) {
      setSuccess('Failed to create sub-admin.');
    }
    setTimeout(() => setSuccess(''), 5000);
    setLoading(false);
  };

  const handleEditAdmin = async () => {
    if (!selectedAdmin) return;
    setLoading(true);
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/sub-admins/${selectedAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedAdmin),
      });
      if (!res.ok) {
        const err = await res.json();
        setSuccess(err.error || 'Failed to update sub-admin.');
      } else {
        setSuccess('Sub-admin updated successfully!');
        setIsEditDialogOpen(false);
        setSelectedAdmin(null);
        // Refresh list
        const updated = await fetch('/api/admin/sub-admins').then(r => r.json());
        setSubAdmins(updated);
      }
    } catch (e) {
      setSuccess('Failed to update sub-admin.');
    }
    setTimeout(() => setSuccess(''), 3000);
    setLoading(false);
  };

  const handleDeleteAdmin = async (adminId: string) => {
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/sub-admins/${adminId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        setSuccess(err.error || 'Failed to delete sub-admin.');
      } else {
        setSuccess('Sub-admin deleted successfully!');
        // Refresh list
        const updated = await fetch('/api/admin/sub-admins').then(r => r.json());
        setSubAdmins(updated);
      }
    } catch (e) {
      setSuccess('Failed to delete sub-admin.');
    }
    setTimeout(() => setSuccess(''), 3000);
    setDeleteDialog({ open: false, admin: null });
  };

  const handleToggleStatus = async (adminId: string) => {
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/sub-admins/${adminId}/toggle-status`, { method: 'PATCH' });
      if (!res.ok) {
        const err = await res.json();
        setSuccess(err.error || 'Failed to toggle status.');
      } else {
        // Refresh list
        const updated = await fetch('/api/admin/sub-admins').then(r => r.json());
        setSubAdmins(updated);
      }
    } catch (e) {
      setSuccess('Failed to toggle status.');
    }
    setTimeout(() => setSuccess(''), 3000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'sub-admin' 
      ? <Badge className="bg-blue-100 text-blue-700">Sub Admin</Badge>
      : <Badge className="bg-purple-100 text-purple-700">Viewer</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Sub-Admin Management</h1>
                <p className="text-slate-600">Manage sub-administrators and their permissions</p>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Sub-Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Sub-Admin</DialogTitle>
                  <DialogDescription>
                    Add a new sub-administrator to your FBA dashboard with specific permissions.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={newAdmin.firstName}
                        onChange={(e) => setNewAdmin((prev: typeof newAdmin) => ({ ...prev, firstName: e.target.value }))}
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={newAdmin.lastName}
                        onChange={(e) => setNewAdmin((prev: typeof newAdmin) => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newAdmin.username}
                        onChange={(e) => setNewAdmin((prev: typeof newAdmin) => ({ ...prev, username: e.target.value }))}
                        placeholder="john_doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin((prev: typeof newAdmin) => ({ ...prev, email: e.target.value }))}
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Temporary Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin((prev: typeof newAdmin) => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter temporary password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="role"
                          value="sub-admin"
                          checked={newAdmin.role === 'sub-admin'}
                          onChange={(e) => setNewAdmin((prev: typeof newAdmin) => ({ ...prev, role: e.target.value as 'sub-admin' | 'viewer' }))}
                        />
                        <span>Sub-Admin</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="role"
                          value="viewer"
                          checked={newAdmin.role === 'viewer'}
                          onChange={(e) => setNewAdmin((prev: typeof newAdmin) => ({ ...prev, role: e.target.value as 'sub-admin' | 'viewer' }))}
                        />
                        <span>Viewer</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Permissions</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Run Calculations</p>
                          <p className="text-xs text-slate-500">Allow running shipment calculations</p>
                        </div>
                        <Switch
                          checked={newAdmin.permissions.canRunCalculations}
                          onCheckedChange={(checked) => setNewAdmin((prev: typeof newAdmin) => ({
                            ...prev,
                            permissions: { ...prev.permissions, canRunCalculations: checked }
                          }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">View Reports</p>
                          <p className="text-xs text-slate-500">Access to view calculation reports</p>
                        </div>
                        <Switch
                          checked={newAdmin.permissions.canViewReports}
                          onCheckedChange={(checked) => setNewAdmin((prev: typeof newAdmin) => ({
                            ...prev,
                            permissions: { ...prev.permissions, canViewReports: checked }
                          }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Manage Settings</p>
                          <p className="text-xs text-slate-500">Modify dashboard settings</p>
                        </div>
                        <Switch
                          checked={newAdmin.permissions.canManageSettings}
                          onCheckedChange={(checked) => setNewAdmin((prev: typeof newAdmin) => ({
                            ...prev,
                            permissions: { ...prev.permissions, canManageSettings: checked }
                          }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Export Data</p>
                          <p className="text-xs text-slate-500">Download reports and data exports</p>
                        </div>
                        <Switch
                          checked={newAdmin.permissions.canExportData}
                          onCheckedChange={(checked) => setNewAdmin((prev: typeof newAdmin) => ({
                            ...prev,
                            permissions: { ...prev.permissions, canExportData: checked }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={newAdmin.notes}
                      onChange={(e) => setNewAdmin((prev: typeof newAdmin) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about this sub-admin..."
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateAdmin}
                    disabled={loading || !newAdmin.username || !newAdmin.email || !newAdmin.password}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? 'Creating...' : 'Create Sub-Admin'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {success && (
            <Alert className="border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Statistics Cards */}
          {/* Removed statistics cards for Active, Pending, Inactive as requested */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Sub-Admins</p>
                    <p className="text-2xl font-bold text-slate-900">{subAdmins.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sub-Admins Table */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Sub-Administrators</CardTitle>
              <CardDescription>
                Manage all sub-administrators and their access permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">
                            {admin.firstName} {admin.lastName}
                          </p>
                          <p className="text-sm text-slate-500">@{admin.username}</p>
                          <p className="text-xs text-slate-400">{admin.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(admin.role)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {admin.permissions.canRunCalculations && (
                            <Badge variant="outline" className="text-xs">Run</Badge>
                          )}
                          {admin.permissions.canViewReports && (
                            <Badge variant="outline" className="text-xs">View</Badge>
                          )}
                          {admin.permissions.canManageSettings && (
                            <Badge variant="outline" className="text-xs">Settings</Badge>
                          )}
                          {admin.permissions.canExportData && (
                            <Badge variant="outline" className="text-xs">Export</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">{admin.createdAt}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAdmin(admin);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {/* Only show Deactivate if admin is active, otherwise hide */}
                            {admin.status === 'active' && (
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(admin.id)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteDialog({ open: true, admin })}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Sub-Admin</DialogTitle>
            <DialogDescription>
              Update sub-administrator information and permissions.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAdmin && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={selectedAdmin.firstName}
                    onChange={(e) => setSelectedAdmin((prev: SubAdmin | null) => prev ? { ...prev, firstName: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={selectedAdmin.lastName}
                    onChange={(e) => setSelectedAdmin((prev: SubAdmin | null) => prev ? { ...prev, lastName: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editUsername">Username</Label>
                  <Input
                    id="editUsername"
                    value={selectedAdmin.username}
                    onChange={(e) => setSelectedAdmin((prev: SubAdmin | null) => prev ? { ...prev, username: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email Address</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={selectedAdmin.email}
                    onChange={(e) => setSelectedAdmin((prev: SubAdmin | null) => prev ? { ...prev, email: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="editRole"
                      value="sub-admin"
                      checked={selectedAdmin.role === 'sub-admin'}
                      onChange={(e) => setSelectedAdmin((prev: SubAdmin | null) => prev ? { ...prev, role: e.target.value as 'sub-admin' | 'viewer' } : null)}
                    />
                    <span>Sub-Admin</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="editRole"
                      value="viewer"
                      checked={selectedAdmin.role === 'viewer'}
                      onChange={(e) => setSelectedAdmin((prev: SubAdmin | null) => prev ? { ...prev, role: e.target.value as 'sub-admin' | 'viewer' } : null)}
                    />
                    <span>Viewer</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Permissions</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Run Calculations</p>
                      <p className="text-xs text-slate-500">Allow running shipment calculations</p>
                    </div>
                    <Switch
                      checked={selectedAdmin.permissions.canRunCalculations}
                      onCheckedChange={(checked) => setSelectedAdmin((prev: SubAdmin | null) => prev ? {
                        ...prev,
                        permissions: { ...prev.permissions, canRunCalculations: checked }
                      } : null)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">View Reports</p>
                      <p className="text-xs text-slate-500">Access to view calculation reports</p>
                    </div>
                    <Switch
                      checked={selectedAdmin.permissions.canViewReports}
                      onCheckedChange={(checked) => setSelectedAdmin((prev: SubAdmin | null) => prev ? {
                        ...prev,
                        permissions: { ...prev.permissions, canViewReports: checked }
                      } : null)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Manage Settings</p>
                      <p className="text-xs text-slate-500">Modify dashboard settings</p>
                    </div>
                    <Switch
                      checked={selectedAdmin.permissions.canManageSettings}
                      onCheckedChange={(checked) => setSelectedAdmin((prev: SubAdmin | null) => prev ? {
                        ...prev,
                        permissions: { ...prev.permissions, canManageSettings: checked }
                      } : null)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Export Data</p>
                      <p className="text-xs text-slate-500">Download reports and data exports</p>
                    </div>
                    <Switch
                      checked={selectedAdmin.permissions.canExportData}
                      onCheckedChange={(checked) => setSelectedAdmin((prev: SubAdmin | null) => prev ? {
                        ...prev,
                        permissions: { ...prev.permissions, canExportData: checked }
                      } : null)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditAdmin}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Updating...' : 'Update Sub-Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog(d => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sub-Admin</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <b>{deleteDialog.admin?.firstName} {deleteDialog.admin?.lastName}</b>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, admin: null })}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteAdmin(deleteDialog.admin!.id)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}