// PAVE Admin - Auth Context

import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminUser } from '@/types';
import { authService } from '@/services/api';
import { AuthContext, STORAGE_KEY } from './auth-context-def';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const {
    mutateAsync: loginAdmin,
    reset: resetLogin,
    isPending: isLoginPending,
  } = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: (authenticatedAdmin) => {
      setAdmin(authenticatedAdmin);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedAdmin));
      if (authenticatedAdmin.token) {
        sessionStorage.setItem('pave_admin_token', authenticatedAdmin.token);
      }
    },
  });

  useEffect(() => {
    const handleExpiredSession = () => {
      setAdmin(null);
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem('pave_admin_token');
      localStorage.removeItem('pave_admin_token');
      queryClient.clear();
    };

    window.addEventListener('pave:auth-expired', handleExpiredSession);
    return () => window.removeEventListener('pave:auth-expired', handleExpiredSession);
  }, [queryClient]);
  // Check for existing session on mount
  useEffect(() => {
    const storedAuth = sessionStorage.getItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('pave_admin_token');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        setAdmin(parsed);
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
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
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem('pave_admin_token');
      localStorage.removeItem('pave_admin_token');
      queryClient.clear();
      setIsLoading(false);
    }
  }, [queryClient]);

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
