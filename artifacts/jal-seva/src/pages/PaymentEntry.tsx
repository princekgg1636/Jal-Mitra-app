import { Layout } from "@/components/layout/Layout";
import { useCreatePayment, useListCustomers, useGetSettings } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { PaymentMode } from "@workspace/api-client-react";

export default function PaymentEntry() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const initialCustomerId = urlParams.get('customer') ? parseInt(urlParams.get('customer')!, 10) : null;

  const { data: customers } = useListCustomers({ hasBalance: true });
  const { data: settings } = useGetSettings();
  const createPayment = useCreatePayment();

  const [customerId, setCustomerId] = useState<number | null>(initialCustomerId);
  const [amount, setAmount] = useState<string>("");
  const [mode, setMode] = useState<PaymentMode>("cash");
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!searchQuery) return customers.slice(0, 10);
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.mobile?.includes(searchQuery)
    ).slice(0, 10);
  }, [customers, searchQuery]);

  const selectedCustomer = customers?.find(c => c.id === customerId);

  const handleSave = () => {
    if (!customerId) {
      toast({ title: "कृपया ग्राहक चुनें", variant: "destructive" });
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ title: "सही राशि दर्ज करें", variant: "destructive" });
      return;
    }

    createPayment.mutate({
      data: {
        customerId,
        amount: Number(amount),
        mode,
        paymentDate: date
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
        queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        
        toast({ title: "भुगतान सेव हो गया (Saved)" });

        // WhatsApp redirect logic
        const targetCust = customers?.find(c => c.id === customerId);
        const phone = targetCust?.whatsapp || targetCust?.mobile;
        
        if (phone && settings?.whatsappTemplatePayment) {
          const newBalance = targetCust.balance - Number(amount);
          let msg = settings.whatsappTemplatePayment
            .replace("{name}", targetCust.name)
            .replace("{amount}", amount)
            .replace("{balance}", newBalance.toString());
          
          const waUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
          
          setTimeout(() => {
            if (confirm("WhatsApp पर रसीद भेजें?")) {
              window.open(waUrl, "_blank");
            }
            setLocation("/");
          }, 100);
          return;
        }
        
        setLocation("/");
      },
      onError: () => {
        toast({ title: "सेव करने में त्रुटि", variant: "destructive" });
      }
    });
  };

  return (
    <Layout title="नया भुगतान (Payment)" showBack>
      <div className="p-4 pb-24 space-y-6">
        
        {/* Step 1: Customer Selection */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">1. ग्राहक चुनें (बकाया वाले)</h3>
          
          {!selectedCustomer ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="नाम से खोजें..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {filteredCustomers.map(customer => (
                  <Button
                    key={customer.id}
                    variant="outline"
                    className="h-auto py-3 px-4 justify-between items-center flex"
                    onClick={() => setCustomerId(customer.id)}
                  >
                    <div className="text-left flex-col items-start flex">
                      <span className="font-semibold">{customer.name}</span>
                    </div>
                    <span className="text-red-500 font-bold">₹{customer.balance}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">{selectedCustomer.name}</p>
                  <p className="text-sm font-semibold text-red-500">कुल बकाया: ₹{selectedCustomer.balance}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCustomerId(null)}>
                  बदलें
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Step 2: Amount */}
        <div className={`space-y-3 transition-opacity ${!customerId ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">2. राशि (Amount)</h3>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-slate-500">₹</span>
            <Input 
              type="number" 
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="pl-10 h-16 text-3xl font-bold text-green-700"
              placeholder="0"
            />
          </div>
          {selectedCustomer && (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setAmount(selectedCustomer.balance.toString())}>
                पूरा बकाया भरें (Full)
              </Button>
            </div>
          )}
        </div>

        {/* Step 3: Mode */}
        <div className={`space-y-3 transition-opacity ${!customerId ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">3. माध्यम (Mode)</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'cash', label: 'नकद (Cash)' },
              { id: 'upi', label: 'UPI' },
              { id: 'bank', label: 'बैंक (Bank)' },
              { id: 'other', label: 'अन्य (Other)' }
            ].map(m => (
              <Button
                key={m.id}
                variant={mode === m.id ? "default" : "outline"}
                className={`h-14 text-base ${mode === m.id ? 'bg-green-600 hover:bg-green-700' : ''}`}
                onClick={() => setMode(m.id as PaymentMode)}
              >
                {m.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Step 4: Date */}
        <div className={`space-y-3 transition-opacity ${!customerId ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">तारीख (Date)</h3>
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="h-14 text-lg"
          />
        </div>

        <Button 
          className="w-full h-16 text-xl font-bold rounded-xl shadow-lg mt-8 bg-green-600 hover:bg-green-700 text-white"
          onClick={handleSave}
          disabled={!customerId || createPayment.isPending}
        >
          {createPayment.isPending ? "सेव हो रहा है..." : "जमा करें (Save)"}
        </Button>
      </div>
    </Layout>
  );
}
