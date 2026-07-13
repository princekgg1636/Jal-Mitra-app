import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplet, IndianRupee, CalendarDays, CheckCircle2, Clock, SendHorizonal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "";
interface GrahakData {
  linked: boolean;
  message?: string;
  customer?: {
    id: number; name: string; type: string;
    mobile: string; jarRate: number; balance: number;
    lastDeliveryDate: string | null;
  };
  deliveries?: { id: number; deliveryDate: string; jarCount: number; amount: number; isPaid: boolean }[];
  payments?: { id: number; paymentDate: string; amount: number; mode: string }[];
}

export default function GrahakDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<GrahakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [jarCount, setJarCount] = useState(1);
  const [requesting, setRequesting] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/grahak/me`, { credentials: "include" })
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function submitRequest() {
    setRequesting(true);
    try {
      const res = await fetch(`${API_URL}/api/jar-requests`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jarCount }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast({ title: `✅ ${jarCount} जार की request भेज दी गई!`, description: "Delivery boy जल्द deliver karega." });
      setShowRequestForm(false);
      setJarCount(1);
    } catch (err: any) {
      toast({ title: "त्रुटि", description: err.message, variant: "destructive" });
    } finally {
      setRequesting(false);
    }
  }

  if (loading) {
    return (
      <Layout title={`नमस्ते, ${user?.name}`}>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!data?.linked) {
    return (
      <Layout title="मेरा खाता">
        <div className="p-6 flex flex-col items-center justify-center min-h-64 text-center">
          <Droplet className="w-16 h-16 text-blue-200 mb-4" />
          <h2 className="text-lg font-semibold mb-2">खाता लिंक नहीं है</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{data?.message}</p>
        </div>
      </Layout>
    );
  }

  const c = data.customer!;
  const deliveries = data.deliveries || [];
  const payments = data.payments || [];

  return (
    <Layout title={`नमस्ते, ${c.name}`}>
      <div className="p-4 space-y-5 pb-10">

        {/* Balance Card */}
        <Card className={`border-2 ${c.balance > 0 ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}`}>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-slate-600 mb-1">आपका बकाया (Bakaya)</p>
            <div className={`text-4xl font-bold ${c.balance > 0 ? "text-red-600" : "text-green-600"}`}>
              ₹{c.balance.toLocaleString("en-IN")}
            </div>
            {c.balance > 0 ? (
              <p className="text-red-500 text-sm mt-1">जल्द भुगतान करें</p>
            ) : (
              <p className="text-green-600 text-sm mt-1">✓ सब clear है!</p>
            )}
            <div className="mt-3 pt-3 border-t border-slate-200 flex gap-4 text-sm text-slate-500">
              <span>💧 रेट: ₹{c.jarRate}/जार</span>
              {c.lastDeliveryDate && <span>📅 आखिरी: {c.lastDeliveryDate}</span>}
            </div>
          </CardContent>
        </Card>

        {/* Jar Request */}
        {!showRequestForm ? (
          <Button
            className="w-full h-14 text-base font-semibold gap-2 rounded-xl"
            onClick={() => setShowRequestForm(true)}
          >
            <Droplet className="w-5 h-5" />
            जार मँगवाएं (Request Jar)
          </Button>
        ) : (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-base">कितने जार चाहिए?</h3>
              <div className="flex items-center justify-center gap-6 bg-white p-5 rounded-xl border">
                <Button variant="outline" className="w-14 h-14 rounded-full text-2xl"
                  onClick={() => setJarCount(Math.max(1, jarCount - 1))}>−</Button>
                <span className="text-5xl font-bold w-16 text-center">{jarCount}</span>
                <Button className="w-14 h-14 rounded-full text-2xl"
                  onClick={() => setJarCount(jarCount + 1)}>+</Button>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 5].map(n => (
                  <Button key={n} variant="outline" className="flex-1 h-10"
                    onClick={() => setJarCount(n)}>{n}</Button>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                अनुमानित राशि: <strong>₹{jarCount * c.jarRate}</strong>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-11" onClick={() => setShowRequestForm(false)}>
                  रद्द करें
                </Button>
                <Button className="flex-1 h-11 gap-2" onClick={submitRequest} disabled={requesting}>
                  <SendHorizonal className="w-4 h-4" />
                  {requesting ? "भेज रहे हैं..." : "Request करें"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery History */}
        <div>
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-500" />
            डिलीवरी इतिहास
          </h2>
          {deliveries.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">कोई डिलीवरी नहीं</p>
          ) : (
            <div className="space-y-2">
              {deliveries.map(d => (
                <Card key={d.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{d.deliveryDate}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Droplet className="w-3.5 h-3.5" /> {d.jarCount} जार
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{d.amount}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${d.isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {d.isPaid ? "✓ जमा" : "उधार"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
          <div>
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-green-500" />
              भुगतान इतिहास
            </h2>
            <div className="space-y-2">
              {payments.map(p => (
                <Card key={p.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{p.paymentDate}</p>
                      <p className="text-sm text-muted-foreground capitalize">{p.mode}</p>
                    </div>
                    <p className="font-bold text-green-600">₹{p.amount}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
