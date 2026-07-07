import { Layout } from "@/components/layout/Layout";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";

const formSchema = z.object({
  businessName: z.string().min(1, "दुकान का नाम आवश्यक है"),
  businessAddress: z.string().optional(),
  phone: z.string().optional(),
  upiId: z.string().optional(),
  defaultJarRate: z.coerce.number().min(0),
  whatsappTemplateDeliveryPeople: z.string().optional(),
  whatsappTemplateDeliveryShop: z.string().optional(),
  whatsappTemplatePayment: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      businessAddress: "",
      phone: "",
      upiId: "",
      defaultJarRate: 20,
      whatsappTemplateDeliveryPeople: "",
      whatsappTemplateDeliveryShop: "",
      whatsappTemplatePayment: "",
    },
  });

  const initialized = useRef(false);

  useEffect(() => {
    if (settings && !initialized.current) {
      form.reset({
        businessName: settings.businessName || "",
        businessAddress: settings.businessAddress || "",
        phone: settings.phone || "",
        upiId: settings.upiId || "",
        defaultJarRate: settings.defaultJarRate || 20,
        whatsappTemplateDeliveryPeople: settings.whatsappTemplateDeliveryPeople || "नमस्ते {name} जी, आज आपके यहाँ {jars} जार पानी पहुँचाया गया है। कुल बकाया: ₹{balance}",
        whatsappTemplateDeliveryShop: settings.whatsappTemplateDeliveryShop || "नमस्ते, आज आपकी दुकान पर {jars} जार पानी डिलीवर किया गया है। कुल बकाया: ₹{balance}",
        whatsappTemplatePayment: settings.whatsappTemplatePayment || "नमस्ते {name} जी, ₹{amount} का भुगतान प्राप्त हुआ। शेष बकाया: ₹{balance}",
      });
      initialized.current = true;
    }
  }, [settings, form]);

  const onSubmit = (data: FormValues) => {
    updateSettings.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
        toast({ title: "सेटिंग्स सेव हो गईं (Settings saved)" });
      },
      onError: () => {
        toast({ title: "त्रुटि (Error)", variant: "destructive" });
      }
    });
  };

  return (
    <Layout title="सेटिंग्स (Settings)" showBack>
      <div className="p-4 pb-24 space-y-6">
        
        <div className="bg-white dark:bg-zinc-900 border p-4 rounded-xl shadow-sm flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">थीम (Theme)</h3>
            <p className="text-sm text-muted-foreground">{theme === 'dark' ? 'डार्क मोड' : 'लाइट मोड'}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={theme === 'light' ? 'default' : 'outline'} 
              size="icon" 
              onClick={() => setTheme('light')}
              className="rounded-full w-12 h-12"
            >
              <Sun className="w-6 h-6" />
            </Button>
            <Button 
              variant={theme === 'dark' ? 'default' : 'outline'} 
              size="icon" 
              onClick={() => setTheme('dark')}
              className="rounded-full w-12 h-12"
            >
              <Moon className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div>लोड हो रहा है (Loading...)</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">दुकान की जानकारी (Business Info)</h3>
                
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>दुकान का नाम (Business Name)</FormLabel>
                      <FormControl>
                        <Input className="h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>फ़ोन नंबर (Phone)</FormLabel>
                        <FormControl>
                          <Input className="h-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="defaultJarRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>डिफ़ॉल्ट जार रेट (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" className="h-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="upiId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UPI ID</FormLabel>
                      <FormControl>
                        <Input className="h-12" placeholder="example@upi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="businessAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>पता (Address)</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">व्हाट्सएप मैसेज (WhatsApp Templates)</h3>
                
                <FormField
                  control={form.control}
                  name="whatsappTemplateDeliveryPeople"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>घर पर डिलीवरी (People Delivery)</FormLabel>
                      <FormDescription>उपयोग करें: {"{name}, {jars}, {balance}"}</FormDescription>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsappTemplateDeliveryShop"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>दुकान पर डिलीवरी (Shop Delivery)</FormLabel>
                      <FormDescription>उपयोग करें: {"{name}, {jars}, {balance}"}</FormDescription>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsappTemplatePayment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>भुगतान रसीद (Payment Receipt)</FormLabel>
                      <FormDescription>उपयोग करें: {"{name}, {amount}, {balance}"}</FormDescription>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold shadow-md"
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? "सेव हो रहा है..." : "सेव करें (Save)"}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </Layout>
  );
}
