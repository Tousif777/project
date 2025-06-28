'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Package, Settings, LogOut, User, Users, Key } from 'lucide-react';
import { AuthService } from '@/lib/auth';

export default function Header() {
  const router = useRouter();
  const user = AuthService.getCurrentUser();

  const handleLogout = async () => {
    await AuthService.logout();
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  const handleAdminClick = () => {
    router.push('/admin');
  };

  const handleApiSettingsClick = () => {
    router.push('/api-settings');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">FBA Shipment Automation Dashboard</h1>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-slate-100">
                  <Avatar className="h-10 w-10 border-2 border-slate-200">
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                      {user?.username?.charAt(0).toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="cursor-pointer" onClick={handleProfileClick}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="cursor-pointer" onClick={handleSettingsClick}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer" onClick={handleApiSettingsClick}>
                  <Key className="mr-2 h-4 w-4" />
                  <span>API Settings</span>
                </DropdownMenuItem>

                {AuthService.isSuperAdmin() && (
                  <DropdownMenuItem className="cursor-pointer" onClick={handleAdminClick}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Sub-Admin Management</span>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}