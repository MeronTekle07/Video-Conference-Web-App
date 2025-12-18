'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import {
  Home,
  Video,
  Calendar,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Shield,
  BarChart3,
  FileText,
  Bell,
  Search,
  Plus,
  Clock,
  Star,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Building,
  Briefcase
} from 'lucide-react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect will be handled by the auth context
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => pathname === path;

  const userMenuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Meetings', href: '/dashboard/meetings', icon: Video },
    { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
    { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const adminMenuItems = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Meetings', href: '/admin/meetings', icon: Video },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Security', href: '/admin/security', icon: Shield },
    { name: 'System', href: '/admin/system', icon: Settings },
  ];

  const auditorMenuItems = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Security', href: '/admin/security', icon: Shield },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
  ];

  const supervisorMenuItems = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Meetings', href: '/admin/meetings', icon: Video },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ];

  const getMenuItems = () => {
    if (!user) return userMenuItems;
    
    switch (user.role) {
      case 'admin':
        return adminMenuItems;
      case 'supervisor':
        return supervisorMenuItems;
      case 'auditor':
        return auditorMenuItems;
      default:
        return userMenuItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md bg-white shadow-lg"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">VideoConf</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive(item.href)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="border-t border-gray-200 p-4">
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">
                    {user?.role || 'user'}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                  <div className="space-y-1">
                    <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Building className="w-3 h-3" />
                        <span>{user?.department || 'No department'}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Briefcase className="w-3 h-3" />
                        <span>{user?.title || 'No title'}</span>
                      </div>
                    </div>
                    
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
  const navItems = [
    {
      href: '/admin',
      icon: Home,
      label: 'Dashboard',
    },
    {
      href: '/admin/user-management',
      icon: Users,
      label: 'User Management',
    },
    // ... other navigation items
  ];
