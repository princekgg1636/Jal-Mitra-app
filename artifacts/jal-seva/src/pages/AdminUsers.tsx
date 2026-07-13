import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Users, CheckCircle2, XCircle, Trash2, RefreshCw, Clock,
  UserPlus, Eye, EyeOff, Shield, ChevronDown, ChevronUp
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

interface ManagedUser {
  id: number; name: string; mobile: string;
  role: string; approved: boolean;
  permissions: string[] | null; createdAt: string;
}

const ROLE_LABEL: Record<string, string> = {
  grahak: "ग्राहक", delivery_boy: "डिलीवरी बॉय",
  shop: "दुकान", co_admin: "को-एडमिन",
};
const ROLE_COLOR: Record<string, string> = {
  grahak: "bg-blue-100 text-blue-700",
  delivery_boy: "bg-green-100 text-green-700",
  shop: "bg-orange-100 text-orange-700",
  co_admin: "bg-purple-100 text-purple-700",
};

const PERMISSIONS: { key: string; label: string; desc: string }[] = [
  { key: "approve_users",       label: "Users Approve करें",    desc: "Pending users को approve/reject कर सके" },
  { key: "manage_customers",    label: "Customers Manage करें", desc: "Customer add/edit/deactivate कर सके" },
  { key: "manage_deliveries",   label: "Deliveries Manage करें",desc: "Daily delivery entry कर सके" },
  { key: "manage_payments",     label: "Payments Manage करें",  desc: "Payment record कर सके" },
  { key: "manage_party_orders", label: "Party Orders Manage करें", desc: "Party/Shadi orders manage कर सके" },
  { key: "view_reports",        label: "Reports देखें",         desc: "Monthly reports देख सके" },
  { key: "manage_settings",     label: "Settings Change करें",  desc: "Business settings बदल सके" },
];

type TabType = "pending" | "approved" | "create";

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("pending");

  // Create user form
  const [createName, setCreateName]       = useState("");
  const [createMobile, setCreateMobile]   = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole]       = useState<string>("grahak");
  const [showPass, setShowPass]           = useState(false);
  const [creating, setCreating]           = useState(false);

  // Permission editor state: userId → selected permissions
  const [permEditing, setPermEditing]     = useState<Record<number, string[] | null>>({});
  const [expandedId, setExpandedId]       = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/admin/users`, { credentials: "include" });
      setUsers(await r.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Approve ──────────────────────────────────────────────────
  async function approve(u: ManagedUser) {
    const perms = u.role === "co_admin"
      ? (permEditing[u.id] ?? u.permissions ?? [])
      : undefined;
    const r = await fetch(`${API_URL}/api/admin/users/${u.id}/approve`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: perms }),
    });
    if (r.ok) { toast({ title: `✅ ${u.name} को approve कर दिया!` }); load(); }
  }

  // ── Save permissions for already-approved co_admin ───────────
  async function savePermissions(u: ManagedUser) {
    const perms = permEditing[u.id] ?? u.permissions ?? [];
    const r = await fetch(`${API_URL}/api/admin/users/${u.id}/permissions`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: perms }),
    });
    if (r.ok) { toast({ title: `✅ Permissions save हो गईं` }); load(); }
  }

  async function reject(u: ManagedUser) {
    const r = await fetch(`${API_URL}/api/admin/users/${u.id}/reject`, {
      method: "PATCH", credentials: "include",
    });
    if (r.ok) { toast({ title: `❌ ${u.name} का access हटा दिया` }); load(); }
  }

  async function deleteUser(u: ManagedUser) {
    if (!confirm(`"${u.name}" को permanently delete करें?`)) return;
    await fetch(`${API_URL}/api/admin/users/${u.id}`, { method: "DELETE", credentials: "include" });
    toast({ title: `${u.name} delete हो गया` });
    load();
  }

  // ── Create user ───────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (createMobile.length !== 10) { toast({ title: "10 अंकों का मोबाइल नंबर डालें", variant: "destructive" }); return; }
    if (createPassword.length < 6) { toast({ title: "Password कम से कम 6 अक्षरों का होना चाहिए", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const r = await fetch(`${API_URL}/api/admin/create-user`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName, mobile: createMobile, password: createPassword, role: createRole }),
      });
      const data = await r.json();
      if (!r.ok) { toast({ title: data.error || "Error", variant: "destructive" }); return; }
      toast({ title: `✅ ${createName} का account बन गया!` });
      setCreateName(""); setCreateMobile(""); setCreatePassword(""); setCreateRole("grahak");
      setTab("approved");
      load();
    } finally { setCreating(false); }
  }

  function togglePerm(userId: number, currentPerms: string[] | null, key: string) {
    const base = permEditing[userId] ?? currentPerms ?? [];
    const next = base.includes(key) ? base.filter(p => p !== key) : [...base, key];
    setPermEditing(prev => ({ ...prev, [userId]: next }));
  }

  const pending  = users.filter(u => !u.approved);
  const approved = users.filter(u => u.approved);
  const list     = tab === "pending" ? pending : tab === "approved" ? approved : [];

  // ── Permission checkboxes component ──────────────────────────
  function PermissionEditor({ u, showSave }: { u: ManagedUser; showSave: boolean }) {
    const current = permEditing[u.id] ?? u.permissions ?? [];
    return (
      <div className="mt-3 bg-purple-50 rounded-xl p-3 space-y-2 border border-purple-200">
        <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> को-एडमिन Permissions चुनें
        </p>
        {PERMISSIONS.map(p => (
          <label key={p.key} className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={current.includes(p.key)}
              onChange={() => togglePerm(u.id, u.permissions, p.key)}
              className="mt-0.5 w-4 h-4 accent-purple-600 cursor-pointer"
            />
            <span>
              <span className="text-sm font-semibold">{p.label}</span>
              <span className="block text-xs text-muted-foreground">{p.desc}</span>
            </span>
          </label>
        ))}
        {showSave && (
          <Button size="sm" className="w-full mt-2 bg-purple-600 hover:bg-purple-700 gap-1.5"
            onClick={() => savePermissions(u)}>
            <Shield className="w-3.5 h-3.5" /> Permissions Save करें
          </Button>
        )}
      </div>
    );
  }

  return (
    <Layout title="User Management" showBack>
      <div className="p-4 space-y-4 pb-10">

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(["pending", "approved", "create"] as TabType[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                tab === t ? "bg-white shadow" : "text-muted-foreground"
              } ${t === "pending" && tab === t ? "text-yellow-700" : ""}
              ${t === "approved" && tab === t ? "text-green-700" : ""}
              ${t === "create" && tab === t ? "text-blue-700" : ""}`}
            >
              {t === "pending"  && <><Clock className="w-3.5 h-3.5" />Pending{pending.length > 0 && <span className="bg-yellow-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{pending.length}</span>}</>}
              {t === "approved" && <><CheckCircle2 className="w-3.5 h-3.5" />Approved ({approved.length})</>}
              {t === "create"   && <><UserPlus className="w-3.5 h-3.5" />New बनाएं</>}
            </button>
          ))}
        </div>

        {/* ── CREATE USER FORM ── */}
        {tab === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground">Admin सीधे किसी का भी account बना सकता है। Account तुरंत approved होगा।</p>

                <div className="space-y-1.5">
                  <Label>पूरा नाम</Label>
                  <Input placeholder="जैसे: Ramesh Kumar" value={createName}
                    onChange={e => setCreateName(e.target.value)} className="h-11" required />
                </div>

                <div className="space-y-1.5">
                  <Label>मोबाइल नंबर</Label>
                  <Input type="tel" placeholder="10 अंकों का नंबर" value={createMobile}
                    onChange={e => setCreateMobile(e.target.value)} maxLength={10} className="h-11" required />
                </div>

                <div className="space-y-1.5">
                  <Label>पासवर्ड</Label>
                  <div className="relative">
                    <Input type={showPass ? "text" : "password"} placeholder="कम से कम 6 अक्षर"
                      value={createPassword} onChange={e => setCreatePassword(e.target.value)}
                      className="h-11 pr-12" required />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "grahak",      label: "ग्राहक",          color: "border-blue-400 bg-blue-50 text-blue-700" },
                      { value: "delivery_boy",label: "डिलीवरी बॉय",    color: "border-green-400 bg-green-50 text-green-700" },
                      { value: "shop",        label: "दुकान",            color: "border-orange-400 bg-orange-50 text-orange-700" },
                      { value: "co_admin",    label: "को-एडमिन",         color: "border-purple-400 bg-purple-50 text-purple-700" },
                    ].map(r => (
                      <button key={r.value} type="button" onClick={() => setCreateRole(r.value)}
                        className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          createRole === r.value ? r.color + " shadow-sm scale-[1.02]" : "border-slate-200 bg-white text-slate-500"
                        }`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {createRole === "co_admin" && (
                  <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
                    <p className="text-xs text-purple-700 font-semibold flex items-center gap-1.5 mb-1">
                      <Shield className="w-3.5 h-3.5" /> को-एडमिन की Permissions बाद में Admin Panel से set करें
                    </p>
                    <p className="text-xs text-muted-foreground">Account बनने के बाद Approved tab में जाकर permissions tick करें।</p>
                  </div>
                )}

                <Button type="submit" className="w-full h-11 gap-2 font-semibold" disabled={creating}>
                  <UserPlus className="w-4 h-4" />
                  {creating ? "बन रहा है..." : "Account बनाएं"}
                </Button>
              </CardContent>
            </Card>
          </form>
        )}

        {/* ── REFRESH + USER LIST ── */}
        {tab !== "create" && (
          <>
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={load}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>

            {loading ? (
              <div className="text-center py-10 text-muted-foreground">लोड हो रहा है...</div>
            ) : list.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{tab === "pending" ? "कोई pending user नहीं" : "कोई approved user नहीं"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {list.map(u => {
                  const isExpanded = expandedId === u.id;
                  return (
                    <Card key={u.id} className={`border-l-4 ${u.approved ? "border-l-green-400" : "border-l-yellow-400"}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-base">{u.name}</h3>
                            <p className="text-sm text-muted-foreground">{u.mobile}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(u.createdAt).toLocaleDateString("hi-IN")} को join किया
                            </p>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ROLE_COLOR[u.role] || "bg-slate-100 text-slate-600"}`}>
                            {ROLE_LABEL[u.role] || u.role}
                          </span>
                        </div>

                        {/* Co-admin pending: show permissions before approving */}
                        {!u.approved && u.role === "co_admin" && (
                          <>
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : u.id)}
                              className="w-full flex items-center justify-between text-sm text-purple-700 font-semibold bg-purple-50 rounded-lg px-3 py-2 mb-3 border border-purple-200"
                            >
                              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Permissions set करें</span>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {isExpanded && <PermissionEditor u={u} showSave={false} />}
                          </>
                        )}

                        {/* Co-admin approved: show/edit permissions */}
                        {u.approved && u.role === "co_admin" && (
                          <>
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : u.id)}
                              className="w-full flex items-center justify-between text-sm text-purple-700 font-semibold bg-purple-50 rounded-lg px-3 py-2 mb-3 border border-purple-200"
                            >
                              <span className="flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5" />
                                Permissions ({(u.permissions?.length ?? 0)}/{PERMISSIONS.length})
                              </span>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {isExpanded && <PermissionEditor u={u} showSave={true} />}
                          </>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          {!u.approved ? (
                            <>
                              <Button className="flex-1 h-10 bg-green-600 hover:bg-green-700 gap-1.5 text-sm"
                                onClick={() => approve(u)}>
                                <CheckCircle2 className="w-4 h-4" /> Approve करें
                              </Button>
                              <Button variant="outline"
                                className="h-10 w-10 p-0 border-red-200 text-red-500 hover:bg-red-50"
                                onClick={() => deleteUser(u)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="outline"
                                className="flex-1 h-10 border-red-200 text-red-500 hover:bg-red-50 gap-1.5 text-sm"
                                onClick={() => reject(u)}>
                                <XCircle className="w-4 h-4" /> Access हटाएं
                              </Button>
                              <Button variant="outline"
                                className="h-10 w-10 p-0 border-red-200 text-red-500 hover:bg-red-50"
                                onClick={() => deleteUser(u)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
        }
