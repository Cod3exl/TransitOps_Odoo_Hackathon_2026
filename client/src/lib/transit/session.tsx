import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Role, Session } from "./types";

const STORAGE_KEY = "transitops.session";

interface SessionState {
  session: Session | null;
  ready: boolean;
  signIn: (email: string, password: string, role: Role) => Promise<void>;
  signOut: () => void;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSession(JSON.parse(raw) as Session);
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const signIn = useCallback(async (email: string, password: string, role: Role) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          token: string;
          user: { id: string; fullName: string; role: string };
        };
        const next: Session = {
          email,
          role: data.user.role as Role,
          token: data.token,
          fullName: data.user.fullName,
        };
        setSession(next);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return;
      }
      throw new Error("Invalid credentials");
    } catch (e) {
      throw e;
    }
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({ session, ready, signIn, signOut }),
    [session, ready, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}