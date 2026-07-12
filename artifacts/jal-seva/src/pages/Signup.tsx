import { useState } from "react";
import { useAuth, type Role } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Phone, Lock, User, Home, Bike, ShieldCheck, Store } from "lucide-react";

const roles: { value: Role; label: string; sublabel: string; icon: React.ReactNode; color: string }[] = [
  { value: "grahak",      label: "ग्राहक",       sublabel: "Customer",     icon: <Home className="w-6 h-6" />,        color: "border-blue-400 bg-blue-50 text-blue-700" },
  { value: "delivery_boy",label: "डिलीवरी बॉय", sublabel: "Delivery Boy", icon: <Bike className="w-6 h-6" />,        color: "border-green-400 bg-green-50 text-green-700" },
  { value: "shop",        label: "दुकान",         sublabel: "Shop",         icon: <Store className="w-6 h-6" />,       color: "border-orange-400 bg-orange-50 text-orange-700" },
  { value: "admin",       label: "एडमिन",         sublabel: "Admin",        icon: <ShieldCheck className="w-6 h-6" />, color: "border-purple-400 bg-purple-50 text-purple-700" },
];

export default function Signup() {
  const { signup } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("grahak");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mobile.length !== 10) { setError("10 अंकों का मोबाइल नंबर डालें"); return; }
    if (password.length < 6) { setError("पासवर्ड कम से कम 6 अक्षरों का होना चाहिए"); return; }
    setLoading(true);
    try {
      await signup(name, mobile, password, role);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50">
      <div className="bg-primary text-primary-foreground p-6 pb-10 flex flex-col items-center">
        <img src="/anshu-jal-logo.svg" alt="Anshu Jal" className="w-20 h-20 rounded-full mb-3" />
        <h1 className="text-2xl font-bold">अंशु जल</h1>
        <p className="text-primary-foreground/80 text-sm mt-1">नया अकाउंट बनाएं</p>
      </div>

      <div className="flex-1 p-6 -mt-6 bg-slate-50 rounded-t-3xl overflow-y-auto pb-10">
        <h2 className="text-xl font-bold mb-5 text-slate-800">साइनअप करें</h2>

        {/* Role Selection */}
        <div className="mb-5">
          <Label className="text-base mb-3 block">आप कौन हैं? (Role चुनें)</Label>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                  role === r.value
                    ? r.color + " border-opacity-100 shadow-sm scale-[1.03]"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                {r.icon}
                <span className="font-semibold text-sm leading-tight">{r.label}</span>
                <span className="text-xs opacity-70">{r.sublabel}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-base">पूरा नाम</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input type="text" placeholder="आपका नाम" value={name}
                onChange={(e) => setName(e.target.value)} className="pl-10 h-12 text-base" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-base">मोबाइल नंबर</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input type="tel" placeholder="10 अंकों का नंबर" value={mobile}
                onChange={(e) => setMobile(e.target.value)} maxLength={10}
                className="pl-10 h-12 text-base" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-base">पासवर्ड</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input type={showPass ? "text" : "password"} placeholder="कम से कम 6 अक्षर"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-12 h-12 text-base" required />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">{error}</div>
          )}

          <Button type="submit" className="w-full h-12 text-base font-semibold mt-2" disabled={loading}>
            {loading ? "अकाउंट बन रहा है..." : "अकाउंट बनाएं"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            पहले से अकाउंट है?{" "}
            <button onClick={() => navigate("/login")}
              className="text-primary font-semibold underline-offset-2 hover:underline">
              लॉगिन करें
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
