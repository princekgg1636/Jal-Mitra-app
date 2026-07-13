import { Layout } from "@/components/layout/Layout";
import { useGetCustomer, useCreateCustomer, useUpdateCustomer, getGetCustomerQueryKey } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(1, "नाम आवश्यक है (Name is required)"),
  type: z.enum(["people", "shop"]),
  address: z.string().optional(),
  mobile: z.string().optional(),
  whatsapp: z.string().optional(),
  jarRate: z.coerce.number().min(0),
  securityDeposit: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CustomerForm() {
  const { id } = useParams();
  const isEditing = id && id !== "new";
  const customerId = isEditing ? parseInt(id, 10) : undefined;
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customer, isLoading } = useGetCustomer(customerId as number, {
    query: { enabled: !!customerId, queryKey: getGetCustomerQueryKey(customerId as number) }
  });

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "people",
      address: "",
      mobile: "",
      whatsapp: "",
      jarRate: 20,
      securityDeposit: 0,
      notes: "",
    },
  });

  const initialized = useRef(false);

  useEffect(() => {
    if (customer && isEditing && !initialized.current) {
      form.reset({
        name: customer.name,
        type: customer.type,
        address: customer.address || "",
        mobile: customer.mobile || "",
        whatsapp: customer.whatsapp || "",
        jarRate: customer.jarRate,
        securityDeposit: customer.securityDeposit || 0,
        notes: customer.notes || "",
      });
      initialized.current = true;
    }
  }, [customer, isEditing, form]);

  const onSubmit = (data: FormValues) => {
    if (isEditing && customerId) {
      updateCustomer.mutate({ id: customerId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
          toast({ title: "ग्राहक अपडेट हो गया (Customer updated)" });
          setLocation(`/customers/${customerId}`);
        },
        onError: (err: any) => {
          toast({ title: "त्रुटि (Error)", description: String(err?.message || err), variant: "destructive" });
        }
      });
    } else {
      createCustomer.mutate({ data }, {
        onSuccess: (newCustomer) => {
          queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
          toast({ title: "नया ग्राहक जुड़ गया (Customer added)" });
          setLocation(`/customers/${newCustomer.id}`);
        },
        onError: (err: any) => {
          toast({ title: "त्रुटि (Error)", description: String(err?.message || err), variant: "destructive" });
        }
      });
    }
  };

  return (
    <Layout title={isEditing ? "ग्राहक एडिट करें" : "ग्राहक जोड़ें"} showBack>
      <div className="p-4 pb-24">
        {isLoading ? (
          <div>लोड हो रहा है (Loading...)</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>प्रकार (Type)</FormLabel>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={field.value === "people" ? "default" : "outline"}
                        className="flex-1 h-14 text-lg"
                        onClick={() => field.onChange("people")}
                      >
                        घर (People)
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === "shop" ? "default" : "outline"}
                        className="flex-1 h-14 text-lg"
                        onClick={() => field.onChange("shop")}
                      >
                        दुकान (Shop)
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>नाम (Name)</FormLabel>
                    <FormControl>
                      <Input placeholder="ग्राहक का नाम" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="jarRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>जार रेट (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" className="h-12 text-lg font-semibold" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="securityDeposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>जमा राशि (Deposit)</FormLabel>
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
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>मोबाइल नंबर (Mobile)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="10 अंकों का नंबर" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>व्हाट्सएप नंबर (WhatsApp)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="अगर अलग हो" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>पता (Address)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="पूरा पता" className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>अन्य जानकारी (Notes)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="कोई खास जानकारी" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold mt-6 shadow-md"
                disabled={createCustomer.isPending || updateCustomer.isPending}
              >
                {createCustomer.isPending || updateCustomer.isPending ? "सेव हो रहा है..." : "सेव करें"}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </Layout>
  );
}
