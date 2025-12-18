'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { 
  Search, 
  Plus, 
  Edit, 
  UserX, 
  UserCheck, 
  Users, 
  Calendar, 
  Shield, 
  Eye, 
  EyeOff, 
  X, 
  Loader2,
  AlertCircle,
  Mail,
  Save
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'supervisor' | 'auditor';
  status: 'active' | 'inactive' | 'suspended';
  title?: string;
  department?: string;
  phone?: string;
  timezone?: string;
  last_login?: string;
  created_at: string;
  meetings_attended: number;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [totalMeetingsCount, setTotalMeetingsCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', role: 'user' as 'user' | 'admin' | 'supervisor' | 'auditor', status: 'active' as 'active' | 'inactive' | 'suspended',
    title: '', department: '', phone: ''
  });
  
  const [editUser, setEditUser] = useState({
    name: '', email: '', role: 'user' as 'user' | 'admin' | 'supervisor' | 'auditor', status: 'active' as 'active' | 'inactive' | 'suspended',
    title: '', department: '', phone: '', timezone: ''
  });
  
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login');
      return;
    }
    loadData();
  }, [currentUser, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const usersResponse = await apiClient.getAllUsers();
      setUsers(usersResponse.data.users);
      
      // Set total meetings to 0 for now since meetings_attended field may not exist or be accurate
      setTotalMeetingsCount(0);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load user data');
      setUsers([]);
      setTotalMeetingsCount(0);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'supervisor': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'auditor': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'suspended': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'inactive': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) return;

    try {
      setCreating(true);
      const response = await apiClient.createUser(newUser);
      setUsers([response.data.user, ...users]);
      setShowCreateModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'user', status: 'active', title: '', department: '', phone: '' });
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setUpdating(true);
      const response = await apiClient.updateUser(selectedUser.id, editUser);
      setUsers(users.map(user => user.id === selectedUser.id ? response.data.user : user));
      setShowEditModal(false);
      setSelectedUser(null);
      setEditUser({ name: '', email: '', role: 'user', status: 'active', title: '', department: '', phone: '', timezone: '' });
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user');
    } finally {
      setUpdating(false);
    }
  };


  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;

    try {
      setChangingPassword(true);
      await apiClient.changeUserPassword(selectedUser.id, newPassword);
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      setError(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      title: user.title || '',
      department: user.department || '',
      phone: user.phone || '',
      timezone: user.timezone || ''
    });
    setShowEditModal(true);
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Access denied. Admin privileges required.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading user data...</span>
        </div>
      </div>
    );
  }

  const activeUsers = users.filter(u => u.status === 'active').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
            <p className="text-slate-400">Manage user accounts, roles, and permissions</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add User
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 flex-shrink-0" />
              <div className="text-right min-w-0 flex-1 ml-3">
                <p className="text-slate-400 text-xs sm:text-sm truncate">Total Users</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-green-400 flex-shrink-0" />
              <div className="text-right min-w-0 flex-1 ml-3">
                <p className="text-slate-400 text-xs sm:text-sm truncate">Active Users</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <UserX className="h-6 w-6 sm:h-8 sm:w-8 text-red-400 flex-shrink-0" />
              <div className="text-right min-w-0 flex-1 ml-3">
                <p className="text-slate-400 text-xs sm:text-sm truncate">Suspended</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{suspendedUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400 flex-shrink-0" />
              <div className="text-right min-w-0 flex-1 ml-3">
                <p className="text-slate-400 text-xs sm:text-sm truncate">Total Meetings</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{totalMeetingsCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="auditor">Auditor</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            <div className="text-slate-400 text-sm flex items-center">
              {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left p-3 sm:p-4 text-slate-300 font-medium">User</th>
                  <th className="text-left p-3 sm:p-4 text-slate-300 font-medium">Role</th>
                  <th className="text-left p-3 sm:p-4 text-slate-300 font-medium">Status</th>
                  <th className="text-left p-3 sm:p-4 text-slate-300 font-medium hidden md:table-cell">Last Login</th>
                  <th className="text-left p-3 sm:p-4 text-slate-300 font-medium hidden lg:table-cell">Meetings</th>
                  <th className="text-left p-3 sm:p-4 text-slate-300 font-medium hidden lg:table-cell">Joined</th>
                  <th className="text-left p-3 sm:p-4 text-slate-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="relative">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                          </div>
                          {/* Online indicator - show green dot if user logged in within last 5 minutes */}
                          {user.last_login && new Date().getTime() - new Date(user.last_login).getTime() < 5 * 60 * 1000 && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-slate-800 rounded-full"></div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium truncate">{user.name}</p>
                          <p className="text-slate-400 text-xs sm:text-sm flex items-center truncate">
                            <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </p>
                          {user.title && (
                            <p className="text-slate-500 text-xs truncate hidden sm:block">{user.title}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-slate-300 text-sm hidden md:table-cell">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="p-3 sm:p-4 text-slate-300 text-sm hidden lg:table-cell">{user.meetings_attended}</td>
                    <td className="p-3 sm:p-4 text-slate-300 text-sm hidden lg:table-cell">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded transition-colors"
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openPasswordModal(user)}
                          className="p-1.5 text-slate-400 hover:text-yellow-400 hover:bg-slate-700 rounded transition-colors"
                          title="Change password"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Add New User</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-4 py-2 pr-10 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="auditor">Auditor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                    <select
                      value={newUser.status}
                      onChange={(e) => setNewUser({ ...newUser, status: e.target.value as any })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create User
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Edit User</h2>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleEditUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editUser.name}
                    onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={editUser.email}
                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter email address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                    <select
                      value={editUser.role}
                      onChange={(e) => setEditUser({ ...editUser, role: e.target.value as any })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="auditor">Auditor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                    <select
                      value={editUser.status}
                      onChange={(e) => setEditUser({ ...editUser, status: e.target.value as any })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update User
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Change Password</h2>
                <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-slate-400 mb-4">Change password for {selectedUser.name}</p>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 pr-10 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
