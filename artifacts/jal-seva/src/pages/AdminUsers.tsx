import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, CheckCircle2, XCircle, Trash2, RefreshCw, Clock } from "lucide-react";

interface ManagedUser {
  id: number; name: string; mobile: string;
  role: string; approved: boolean; createdAt: string;
}

const ROLE_LABEL: Record<string, string> = {
  grahak: "ग्राहक", delivery_boy: "डिलीवरी बॉय", shop: "दुकान", admin: "एडमिन",
};
const ROLE_COLOR: Record<string, string> = {
  grahak: "bg-blue-100 text-blue-700",
  delivery_boy: "bg-green-100 text-green-700",
  shop: "bg-orange-100 text-orange-700",
  admin: "bg-purple-100 text-purple-700",
};

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/users", { credentials: "include" });
      setUsers(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function approve(id: number, name: string) {
    const r = await fetch(`/api/admin/users/${id}/approve`, {
      method: "PATCH", credentials: "include",
    });
    if (r.ok) {
      toast({ title: `✅ ${name} को approve कर दिया!` });
      load();
    }
  }

  async function reject(id: number, name: string) {
    const r = await fetch(`/api/admin/users/${id}/reject`, {
      method: "PATCH", credentials: "include",
    });
    if (r.ok) {
      toast({ title: `❌ ${name} का access हटा दिया` });
      load();
    }
  }

  async function deleteUser(id: number, name: string) {
    if (!confirm(`"${name}" को permanently delete करें?`)) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
    toast({ title: `${name} delete हो गया` });
    load();
  }

  const pending = users.filter(u => !u.approved);
  const approved = users.filter(u => u.approved);
  const list = tab === "pending" ? pending : approved;

  return (
    <Layout title="User Management" showBack>
      <div className="p-4 space-y-4 pb-10">

        {/* Tab toggle */}
        <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setTab("pending")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === "pending" ? "bg-white shadow text-yellow-700" : "text-muted-foreground"
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending
            {pending.length > 0 && (
              <span className="bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pending.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("approved")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === "approved" ? "bg-white shadow text-green-700" : "text-muted-foreground"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Approved ({approved.length})
          </button>
        </div>

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
            {list.map(u => (
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

                  <div className="flex gap-2">
                    {!u.approved ? (
                      <>
                        <Button
                          className="flex-1 h-10 bg-green-600 hover:bg-green-700 gap-1.5 text-sm"
                          onClick={() => approve(u.id, u.name)}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve करें
                        </Button>
                        <Button
                          variant="outline"
                          className="h-10 w-10 p-0 border-red-200 text-red-500 hover:bg-red-50"
                          onClick={() => deleteUser(u.id, u.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1 h-10 border-red-200 text-red-500 hover:bg-red-50 gap-1.5 text-sm"
                          onClick={() => reject(u.id, u.name)}
                        >
                          <XCircle className="w-4 h-4" /> Access हटाएं
                        </Button>
                        <Button
                          variant="outline"
                          className="h-10 w-10 p-0 border-red-200 text-red-500 hover:bg-red-50"
                          onClick={() => deleteUser(u.id, u.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
