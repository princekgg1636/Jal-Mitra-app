import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Phone, Lock } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(mobile, password);
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
        <p className="text-primary-foreground/80 text-sm mt-1">Water Delivery Management</p>
      </div>

      <div className="flex-1 p-6 -mt-6 bg-slate-50 rounded-t-3xl">
        <h2 className="text-xl font-bold mb-6 text-slate-800">लॉगिन करें</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-base">मोबाइल नंबर</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="10 अंकों का नंबर"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="pl-10 h-12 text-base"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-base">पासवर्ड</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPass ? "text" : "password"}
                placeholder="पासवर्ड डालें"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-12 h-12 text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full h-12 text-base font-semibold mt-2" disabled={loading}>
            {loading ? "लॉगिन हो रहा है..." : "लॉगिन करें"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            नया अकाउंट बनाना है?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-primary font-semibold underline-offset-2 hover:underline"
            >
              साइनअप करें
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
