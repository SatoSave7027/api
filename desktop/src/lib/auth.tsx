import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api, clearTokens, getAccessToken, storeTokens } from "./api";
import type { UserOut } from "./types";

type AuthState = {
  user: UserOut | null;
  hydrated: boolean;
  requestCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<UserOut>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const token = getAccessToken();
      if (!token) {
        setHydrated(true);
        return;
      }
      try {
        const me = await api.me();
        setUser(me);
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

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
    () => ({ user, hydrated, requestCode, verifyCode, logout }),
    [user, hydrated, requestCode, verifyCode, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
