import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getStoredToken, setStoredToken } from "../api/client";
import type { AuthUser } from "../api/types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: { email: string; fullName: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getStoredToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const me = await api.get<AuthUser>("/auth/me");
        setUser(me);
      } catch {
        await setStoredToken(null); // stored token is invalid/expired
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<{ token: string; user: AuthUser }>("/auth/login", { email, password });
    await setStoredToken(result.token);
    setUser(result.user);
  }, []);

  const signup = useCallback(async (input: { email: string; fullName: string; password: string; phone?: string }) => {
    const result = await api.post<{ token: string; user: AuthUser }>("/auth/signup", input);
    await setStoredToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await setStoredToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback((updated: AuthUser) => setUser(updated), []);

  const value = useMemo(
    () => ({ user, isLoading, login, signup, logout, refreshUser }),
    [user, isLoading, login, signup, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
