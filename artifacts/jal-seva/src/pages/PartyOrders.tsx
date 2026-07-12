import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PartyPopper, Plus, Phone, MapPin, Droplet, IndianRupee, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

interface PartyOrder {
  id: number; eventName: string; contactName: string;
  address: string | null; phone: string | null;
  jarCount: number; litresPerJar: number;
  ratePerJar: number; totalAmount: number;
  eventDate: string; status: string;
  advancePaid: number; notes: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "⏳ Pending", confirmed: "✓ Confirm", delivered: "✅ Delivered", cancelled: "✗ Cancelled",
};

const LITRE_OPTIONS = [10, 20, 25, 50];

export default function PartyOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<PartyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({
    eventName: "", contactName: "", address: "", phone: "",
    jarCount: 1, litresPerJar: 20, ratePerJar: "", eventDate: "", advancePaid: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    setLoading(true);
    const r = await fetch("/api/party-orders", { credentials: "include" });
    setOrders(await r.json());
    setLoading(false);
  }

  async function save() {
    if (!form.eventName || !form.contactName || !form.ratePerJar || !form.eventDate) {
      toast({ title: "सभी ज़रूरी जानकारी भरें", variant: "destructive" }); return;
    }
    setSaving(true);
    const res = await fetch("/api/party-orders", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast({ title: "✅ Order save हो गया!" });
      setShowForm(false);
      setForm({ eventName: "", contactName: "", address: "", phone: "", jarCount: 1, litresPerJar: 20, ratePerJar: "", eventDate: "", advancePaid: "", notes: "" });
      loadOrders();
    } else {
      const e = await res.json();
      toast({ title: e.error, variant: "destructive" });
    }
    setSaving(false);
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/party-orders/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadOrders();
  }

  async function deleteOrder(id: number) {
    if (!confirm("यह order delete करें?")) return;
    await fetch(`/api/party-orders/${id}`, { method: "DELETE", credentials: "include" });
    toast({ title: "Order delete हो गया" });
    loadOrders();
  }

  const f = (k: string, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <Layout title="शादी/पार्टी Orders">
      <div className="p-4 space-y-4 pb-10">

        <Button className="w-full h-12 text-base font-semibold gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5" />
          नया शादी/पार्टी Order
        </Button>

        {/* Order Form */}
        {showForm && (
          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <PartyPopper className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-800">नया Order</h3>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                ⚠️ यह section सिर्फ <strong>शादी/पार्टी</strong> के बड़े orders के लिए है — regular delivery के लिए "डिलीवरी" section use करें
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label>Event का नाम *</Label>
                  <Input placeholder="जैसे: Sharma Ji Ki Shadi" value={form.eventName}
                    onChange={e => f("eventName", e.target.value)} className="h-11" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Contact नाम *</Label>
                  <Input placeholder="Order देने वाले का नाम" value={form.contactName}
                    onChange={e => f("contactName", e.target.value)} className="h-11" />
                </div>
                <div className="space-y-1">
                  <Label>Phone नंबर</Label>
                  <Input type="tel" placeholder="Mobile" value={form.phone}
                    onChange={e => f("phone", e.target.value)} className="h-11" />
                </div>
                <div className="space-y-1">
                  <Label>Event की तारीख *</Label>
                  <Input type="date" value={form.eventDate}
                    onChange={e => f("eventDate", e.target.value)} className="h-11" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Address</Label>
                  <Input placeholder="Event की जगह" value={form.address}
                    onChange={e => f("address", e.target.value)} className="h-11" />
                </div>
              </div>

              {/* Jar Details — Highlighted Section */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                  <Droplet className="w-4 h-4" /> जार की जानकारी
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>कितने जार? *</Label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"
                        onClick={() => f("jarCount", Math.max(1, form.jarCount - 1))}>−</Button>
                      <Input type="number" min={1} value={form.jarCount}
                        onChange={e => f("jarCount", parseInt(e.target.value) || 1)}
                        className="h-11 text-center text-xl font-bold" />
                      <Button size="icon" className="h-11 w-11 shrink-0"
                        onClick={() => f("jarCount", form.jarCount + 1)}>+</Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Litre प्रति जार *</Label>
                    <div className="grid grid-cols-2 gap-1">
                      {LITRE_OPTIONS.map(l => (
                        <Button key={l} size="sm"
                          variant={form.litresPerJar === l ? "default" : "outline"}
                          className="h-10 text-sm"
                          onClick={() => f("litresPerJar", l)}>
                          {l}L
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Rate प्रति जार (₹) *</Label>
                    <Input type="number" placeholder="जैसे: 120" value={form.ratePerJar}
                      onChange={e => f("ratePerJar", e.target.value)} className="h-11 text-base" />
                  </div>
                  <div className="space-y-1">
                    <Label>Advance मिला (₹)</Label>
                    <Input type="number" placeholder="0" value={form.advancePaid}
                      onChange={e => f("advancePaid", e.target.value)} className="h-11 text-base" />
                  </div>
                </div>
                {form.jarCount > 0 && form.ratePerJar && (
                  <div className="bg-blue-100 rounded-lg p-3 text-center">
                    <p className="text-sm text-blue-700">कुल राशि</p>
                    <p className="text-2xl font-bold text-blue-800">
                      ₹{(form.jarCount * parseFloat(form.ratePerJar || "0")).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      {form.jarCount} जार × {form.litresPerJar}L × ₹{form.ratePerJar}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label>Notes (वैकल्पिक)</Label>
                <Input placeholder="कोई जरूरी बात..." value={form.notes}
                  onChange={e => f("notes", e.target.value)} className="h-11" />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-11" onClick={() => setShowForm(false)}>रद्द करें</Button>
                <Button className="flex-1 h-11 font-semibold" onClick={save} disabled={saving}>
                  {saving ? "Save हो रहा है..." : "Order Save करें"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">लोड हो रहा है...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <PartyPopper className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>कोई Party/Shadi order नहीं है</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <Card key={o.id} className={`border-l-4 ${o.status === "delivered" ? "border-l-green-500" : o.status === "cancelled" ? "border-l-red-400" : o.status === "confirmed" ? "border-l-blue-500" : "border-l-yellow-400"}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-base">{o.eventName}</h3>
                      <p className="text-sm text-muted-foreground">{o.contactName}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3 bg-slate-50 rounded-lg p-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">जार</p>
                      <p className="font-bold text-lg">{o.jarCount}</p>
                      <p className="text-xs text-blue-600">{o.litresPerJar}L</p>
                    </div>
                    <div className="text-center border-x">
                      <p className="text-xs text-muted-foreground">Rate</p>
                      <p className="font-bold text-lg">₹{o.ratePerJar}</p>
                      <p className="text-xs text-muted-foreground">/जार</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">कुल</p>
                      <p className="font-bold text-lg text-green-700">₹{o.totalAmount.toLocaleString("en-IN")}</p>
                      {o.advancePaid > 0 && <p className="text-xs text-green-600">−₹{o.advancePaid} adv.</p>}
                    </div>
                  </div>

                  <div className="flex gap-2 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><CalendarIcon /> {o.eventDate}</span>
                    {o.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {o.phone}</span>}
                  </div>

                  <button className="text-xs text-primary flex items-center gap-1 mb-2"
                    onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                    {expandedId === o.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {expandedId === o.id ? "कम करें" : "Status बदलें / Delete"}
                  </button>

                  {expandedId === o.id && (
                    <div className="space-y-2 pt-2 border-t">
                      {o.address && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{o.address}</p>}
                      {o.notes && <p className="text-sm text-muted-foreground">📝 {o.notes}</p>}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {["pending","confirmed","delivered","cancelled"].filter(s => s !== o.status).map(s => (
                          <Button key={s} variant="outline" size="sm" className="h-9 text-xs"
                            onClick={() => updateStatus(o.id, s)}>
                            {STATUS_LABEL[s]}
                          </Button>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" className="w-full h-9 text-red-500 hover:text-red-600 hover:bg-red-50 gap-1"
                        onClick={() => deleteOrder(o.id)}>
                        <Trash2 className="w-4 h-4" /> Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function CalendarIcon() {
  return <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
}
