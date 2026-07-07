import { Layout } from "@/components/layout/Layout";
import { useCreateDelivery, useListCustomers, useGetSettings } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";

export default function DeliveryEntry() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const initialCustomerId = urlParams.get('customer') ? parseInt(urlParams.get('customer')!, 10) : null;

  const { data: customers } = useListCustomers();
  const { data: settings } = useGetSettings();
  const createDelivery = useCreateDelivery();

  const [customerId, setCustomerId] = useState<number | null>(initialCustomerId);
  const [jarCount, setJarCount] = useState<number>(1);
  const [isPaid, setIsPaid] = useState<boolean>(false);
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

    createDelivery.mutate({
      data: {
        customerId,
        jarCount,
        isPaid,
        deliveryDate: date
      }
    }, {
      onSuccess: (delivery) => {
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
        queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        
        toast({ title: "डिलीवरी सेव हो गई (Saved)" });

        // WhatsApp redirect logic
        const targetCust = customers?.find(c => c.id === customerId);
        const phone = targetCust?.whatsapp || targetCust?.mobile;
        
        if (phone && settings) {
          const totalAmount = targetCust.jarRate * jarCount;
          const newBalance = targetCust.balance + (isPaid ? 0 : totalAmount);
          
          let template = targetCust.type === 'people' 
            ? settings.whatsappTemplateDeliveryPeople 
            : settings.whatsappTemplateDeliveryShop;

          if (template) {
            let msg = template
              .replace("{name}", targetCust.name)
              .replace("{jars}", jarCount.toString())
              .replace("{balance}", newBalance.toString());
            
            const waUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
            
            // Allow state to settle before navigating away/opening window
            setTimeout(() => {
              if (confirm("WhatsApp पर मैसेज भेजें?")) {
                window.open(waUrl, "_blank");
              }
              setLocation("/");
            }, 100);
            return;
          }
        }
        
        setLocation("/");
      },
      onError: () => {
        toast({ title: "सेव करने में त्रुटि (Error)", variant: "destructive" });
      }
    });
  };

  return (
    <Layout title="नई डिलीवरी" showBack>
      <div className="p-4 pb-24 space-y-6">
        
        {/* Step 1: Customer Selection */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">1. ग्राहक चुनें</h3>
          
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
              <div className="grid grid-cols-2 gap-2">
                {filteredCustomers.map(customer => (
                  <Button
                    key={customer.id}
                    variant="outline"
                    className="h-auto py-3 px-4 justify-start text-left flex-col items-start"
                    onClick={() => setCustomerId(customer.id)}
                  >
                    <span className="font-semibold truncate w-full">{customer.name}</span>
                    <span className="text-xs text-muted-foreground">{customer.type === 'people' ? 'घर' : 'दुकान'}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <Card className="border-primary bg-primary/5">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">{selectedCustomer.name}</p>
                  <p className="text-sm text-muted-foreground">रेट: ₹{selectedCustomer.jarRate}/जार</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCustomerId(null)}>
                  बदलें (Change)
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Step 2: Quantity */}
        <div className={`space-y-3 transition-opacity ${!customerId ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">2. कितने जार?</h3>
          <div className="flex items-center justify-center gap-6 bg-white dark:bg-zinc-900 p-6 rounded-xl border shadow-sm">
            <Button 
              variant="outline" 
              className="w-16 h-16 rounded-full text-3xl pb-1"
              onClick={() => setJarCount(Math.max(1, jarCount - 1))}
            >-</Button>
            <div className="text-5xl font-bold w-20 text-center">
              {jarCount}
            </div>
            <Button 
              className="w-16 h-16 rounded-full text-3xl pb-1 bg-primary text-white hover:bg-primary/90"
              onClick={() => setJarCount(jarCount + 1)}
            >+</Button>
          </div>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 5].map(n => (
              <Button key={n} variant="outline" className="flex-1" onClick={() => setJarCount(n)}>{n}</Button>
            ))}
          </div>
        </div>

        {/* Step 3: Payment Type */}
        <div className={`space-y-3 transition-opacity ${!customerId ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">3. भुगतान (Payment)</h3>
          <div className="flex gap-3">
            <Button 
              className={`flex-1 h-16 text-lg border-2 ${!isPaid ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              variant="outline"
              onClick={() => setIsPaid(false)}
            >
              उधार (Credit)
              {!isPaid && <CheckCircle2 className="w-5 h-5 ml-2 text-red-500" />}
            </Button>
            <Button 
              className={`flex-1 h-16 text-lg border-2 ${isPaid ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              variant="outline"
              onClick={() => setIsPaid(true)}
            >
              जमा (Paid)
              {isPaid && <CheckCircle2 className="w-5 h-5 ml-2 text-green-600" />}
            </Button>
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
          className="w-full h-16 text-xl font-bold rounded-xl shadow-lg mt-8"
          onClick={handleSave}
          disabled={!customerId || createDelivery.isPending}
        >
          {createDelivery.isPending ? "सेव हो रहा है..." : "सेव करें (Save)"}
        </Button>
      </div>
    </Layout>
  );
}
