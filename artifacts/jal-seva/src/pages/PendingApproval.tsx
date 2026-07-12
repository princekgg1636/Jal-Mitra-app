import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, RefreshCw } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  grahak: "ग्राहक",
  delivery_boy: "डिलीवरी बॉय",
  shop: "दुकान",
  admin: "एडमिन",
};

export default function PendingApproval() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  function handleRefresh() {
    window.location.reload();
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 pb-10 flex flex-col items-center">
        <img src="/anshu-jal-logo.svg" alt="Anshu Jal" className="w-20 h-20 rounded-full mb-3" />
        <h1 className="text-2xl font-bold">अंशु जल</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 -mt-6 bg-slate-50 rounded-t-3xl flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mb-5">
          <Clock className="w-10 h-10 text-yellow-600" />
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">Approval का इंतज़ार है</h2>
        <p className="text-muted-foreground leading-relaxed mb-2">
          आपका अकाउंट अभी <strong>Admin</strong> की Approval का इंतज़ार कर रहा है।
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          Admin approve करने के बाद आप अपना dashboard देख पाएंगे।
        </p>

        {/* User Info Card */}
        <div className="w-full max-w-sm bg-white rounded-2xl border p-4 mb-6 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">नाम</span>
            <span className="font-semibold">{user?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">मोबाइल</span>
            <span className="font-semibold">{user?.mobile}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Role</span>
            <span className="font-semibold">{ROLE_LABELS[user?.role || ""] || user?.role}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-semibold text-yellow-600">⏳ Pending</span>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <Button variant="outline" className="w-full h-12 gap-2" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
            Status Check करें (Refresh)
          </Button>
          <Button variant="ghost" className="w-full h-12 gap-2 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Logout करें
          </Button>
        </div>
      </div>
    </div>
  );
}
