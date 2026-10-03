// PAVE Admin - Auth Context

import React, { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AdminUser } from '@/types';
import { authService } from '@/services/api';
import { AuthContext, STORAGE_KEY } from './auth-context-def';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {
    mutateAsync: loginAdmin,
    reset: resetLogin,
    isPending: isLoginPending,
  } = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: (authenticatedAdmin) => {
      setAdmin(authenticatedAdmin);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedAdmin));
      if (authenticatedAdmin.token) {
        localStorage.setItem('pave_admin_token', authenticatedAdmin.token);
      }
    },
  });

  // Check for existing session on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        setAdmin(parsed);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await loginAdmin({ email, password });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    } finally {
      resetLogin();
      setIsLoading(false);
    }
  }, [loginAdmin, resetLogin]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setAdmin(null);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('pave_admin_token');
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        admin,
        isLoading: isLoading || isLoginPending,
        isAuthenticated: !!admin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
