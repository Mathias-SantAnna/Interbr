"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  getMe,
  type AuthUser,
  type RegisterPayload,
  register as apiRegister,
} from "./auth-api";

function setAccessCookie(token: string | null) {
  if (typeof document === "undefined") return;
  if (token) {
    document.cookie = `interbr-access=${token}; max-age=900; path=/; samesite=lax`;
  } else {
    document.cookie = "interbr-access=; max-age=0; path=/";
  }
}

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  accessToken: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Schedule a silent refresh 14 minutes after getting a new access token
  const scheduleRefresh = useCallback((delay = 14 * 60 * 1000) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" });
        if (!res.ok) { setUser(null); setAccessToken(null); return; }
        const { access } = await res.json();
        const u = await getMe(access);
        setAccessToken(access);
        setAccessCookie(access);
        setUser(u);
        scheduleRefresh();
      } catch {
        setUser(null);
        setAccessToken(null);
      }
    }, delay);
  }, []);

  // On mount: try to restore session via httpOnly refresh cookie
  useEffect(() => {
    async function restore() {
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" });
        if (!res.ok) return;
        const { access } = await res.json();
        const u = await getMe(access);
        setAccessToken(access);
        setAccessCookie(access);
        setUser(u);
        scheduleRefresh();
      } catch {
        // No session
      }
    }
    restore().finally(() => setLoading(false));
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [scheduleRefresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw { status: res.status, data };
    }
    const { access } = await res.json();
    const u = await getMe(access);
    setAccessToken(access);
    setAccessCookie(access);
    setUser(u);
    scheduleRefresh();
    router.refresh();
  }, [scheduleRefresh, router]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    }).catch(() => {});
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    setAccessCookie(null);
    setUser(null);
    setAccessToken(null);
    router.refresh();
  }, [accessToken, router]);

  const register = useCallback(async (payload: RegisterPayload) => {
    await apiRegister(payload);
    await login(payload.email, payload.password);
  }, [login]);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
