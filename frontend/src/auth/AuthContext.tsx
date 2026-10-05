import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import type { User } from "../api/auth";

const STORAGE_KEY = "campus-customs-user";

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (fields: authApi.SignupPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (email, password) => {
        const loggedIn = await authApi.login({ email, password });
        setUser(loggedIn);
      },
      signup: async (fields) => {
        const created = await authApi.signup(fields);
        setUser(created);
      },
      logout: () => setUser(null),
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
