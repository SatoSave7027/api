"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  api,
  clearTokens,
  getAccessToken,
  storeTokens,
} from "./api";
import type { UserOut } from "./types";

type AuthState = {
  user: UserOut | null;
  loading: boolean;
  hydrated: boolean;
  requestCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<UserOut>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const data = await api.me();
      setUser(data);
    } catch {
      clearTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } finally {
        setLoading(false);
        setHydrated(true);
      }
    })();
  }, [refresh]);

  const requestCode = useCallback(async (email: string) => {
    await api.requestCode(email);
  }, []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    const tokens = await api.verifyCode(email, code);
    storeTokens(tokens);
    const me = await api.me();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      hydrated,
      requestCode,
      verifyCode,
      logout,
      refresh,
    }),
    [user, loading, hydrated, requestCode, verifyCode, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
