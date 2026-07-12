import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Role = "grahak" | "delivery_boy" | "admin" | "shop" | "co_admin";

export type Permission =
  | "approve_users"
  | "manage_customers"
  | "manage_deliveries"
  | "manage_payments"
  | "manage_party_orders"
  | "view_reports"
  | "manage_settings";

export interface AuthUser {
  id: number;
  name: string;
  mobile: string;
  role: Role;
  approved: boolean;
  permissions: Permission[] | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isFullAccess: boolean;
  can: (permission: Permission) => boolean;
  login: (mobile: string, password: string) => Promise<void>;
  signup: (name: string, mobile: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.id) setUser(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Full access = admin, OR approved delivery_boy/shop, OR approved co_admin with any permissions
  const isFullAccess =
    user?.approved === true &&
    (user.role === "admin" ||
      user.role === "delivery_boy" ||
      user.role === "shop" ||
      (user.role === "co_admin" && (user.permissions?.length ?? 0) > 0));

  // Check if user has a specific permission (admin always has everything)
  function can(permission: Permission): boolean {
    if (!user || !user.approved) return false;
    if (user.role === "admin") return true;
    if (user.role === "co_admin") return user.permissions?.includes(permission) ?? false;
    // delivery_boy and shop have all permissions except approve_users and manage_settings
    if (user.role === "delivery_boy" || user.role === "shop") {
      return permission !== "approve_users" && permission !== "manage_settings";
    }
    return false;
  }

  async function login(mobile: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, password }),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Login failed"); }
    const data = await res.json();
    setUser(data.user);
  }

  async function signup(name: string, mobile: string, password: string, role: Role) {
    const res = await fetch("/api/auth/signup", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mobile, password, role }),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Signup failed"); }
    const data = await res.json();
    setUser(data.user);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, isFullAccess, can, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
