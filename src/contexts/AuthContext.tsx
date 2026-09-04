// PAVE Admin - Auth Context

import React, { useState, useEffect, useCallback } from 'react';
import { AdminUser } from '@/types';
import { authService } from '@/services/api';
import { AuthContext, STORAGE_KEY } from './auth-context-def';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    const hasLoggedOut = localStorage.getItem('pave_admin_logged_out');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        setAdmin(parsed);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    } else if (!hasLoggedOut) {
      const defaultAdmin: AdminUser = {
        id: 'admin_001',
        name: 'Benjamin Okonkwo',
        email: 'benjamin@pave.com',
        role: 'super_admin',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Benjamin',
        createdAt: '2024-01-15T08:00:00Z',
        lastLoginAt: new Date().toISOString(),
      };
      setAdmin(defaultAdmin);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAdmin));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      if (response.success && response.data) {
        setAdmin(response.data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
        localStorage.removeItem('pave_admin_logged_out');
        return { success: true };
      }
      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setAdmin(null);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem('pave_admin_logged_out', 'true');
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        admin,
        isLoading,
        isAuthenticated: !!admin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
