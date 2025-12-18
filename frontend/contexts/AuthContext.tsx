'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'supervisor' | 'auditor';
  title?: string;
  department?: string;
  phone?: string;
  timezone?: string;
  avatar_url?: string;
  last_login?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  title?: string;
  department?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        if (accessToken && refreshToken) {
          // Try to get user profile
          try {
            const response = await apiClient.getProfile();
            setUser(response.data.user);
          } catch (error) {
            // If access token is invalid, try to refresh
            try {
              const refreshResponse = await apiClient.refreshToken(refreshToken);
              localStorage.setItem('accessToken', refreshResponse.data.accessToken);
              localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
              
              const profileResponse = await apiClient.getProfile();
              setUser(profileResponse.data.user);
            } catch (refreshError) {
              // If refresh fails, clear tokens and redirect to login
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.login(email, password);
      
      const { user: userData, accessToken, refreshToken } = response.data;
      
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      const response = await apiClient.register(userData);
      
      const { user: newUser, accessToken, refreshToken } = response.data;
      
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      setUser(newUser);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate tokens on server
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state regardless of server response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const refreshAuth = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.refreshToken(refreshToken);
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      // Get updated user profile
      const profileResponse = await apiClient.getProfile();
      setUser(profileResponse.data.user);
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  };

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      setLoading(true);
      const response = await apiClient.updateProfile(profileData);
      setUser(response.data.user);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      await apiClient.changePassword(currentPassword, newPassword);
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isLoading: loading,
    login,
    register,
    logout,
    refreshAuth,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
