import { Layout } from "@/components/layout/Layout";
import { useGetCustomer, getGetCustomerQueryKey, useListDeliveries, useListPayments } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Droplet, IndianRupee, MapPin, Phone, MessageCircle, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function CustomerDetail() {
  const { id } = useParams();
  const customerId = parseInt(id || "0", 10);

  const { data: customer, isLoading } = useGetCustomer(customerId, {
    query: { enabled: !!customerId, queryKey: getGetCustomerQueryKey(customerId) }
  });

  const { data: deliveries, isLoading: delLoading } = useListDeliveries({ customerId });
  const { data: payments, isLoading: payLoading } = useListPayments({ customerId });

  if (isLoading) {
    return (
      <Layout showBack title="ग्राहक विवरण">
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!customer) {
    return (
      <Layout showBack title="ग्राहक नहीं मिला">
        <div className="p-10 text-center text-muted-foreground">
          Customer not found
        </div>
      </Layout>
    );
  }

  const handleWhatsApp = () => {
    const phone = customer.whatsapp || customer.mobile;
    if (phone) {
      window.open(`https://wa.me/91${phone}`, "_blank");
    }
  };

  return (
    <Layout showBack title={customer.name}>
      <div className="p-4 pb-24 space-y-4">
        {/* Header Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">{customer.name}</h2>
                <p className="text-sm text-muted-foreground">{customer.type === 'people' ? 'घर' : 'दुकान'}</p>
              </div>
              <Link href={`/customers/${customer.id}/edit`}>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Edit className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">बकाया (Udhar)</p>
                <p className={`text-xl font-bold ${customer.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  ₹{customer.balance}
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">जार रेट (Rate)</p>
                <p className="text-xl font-bold">₹{customer.jarRate}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {customer.mobile && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <a href={`tel:${customer.mobile}`}>{customer.mobile}</a>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{customer.address}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Link href={`/delivery/new?customer=${customer.id}`} className="flex-1">
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  <Droplet className="w-4 h-4 mr-1" />
                  डिलीवरी
                </Button>
              </Link>
              <Link href={`/payment/new?customer=${customer.id}`} className="flex-1">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <IndianRupee className="w-4 h-4 mr-1" />
                  भुगतान
                </Button>
              </Link>
              {(customer.whatsapp || customer.mobile) && (
                <Button variant="outline" size="icon" onClick={handleWhatsApp} className="border-green-500 text-green-600 hover:bg-green-50">
                  <MessageCircle className="w-5 h-5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="deliveries">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deliveries">डिलीवरी इतिहास</TabsTrigger>
            <TabsTrigger value="payments">भुगतान इतिहास</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deliveries" className="space-y-3 mt-4">
            {delLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : deliveries?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">कोई डिलीवरी नहीं</div>
            ) : (
              deliveries?.map(del => (
                <Card key={del.id}>
                  <CardContent className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{format(new Date(del.deliveryDate), "dd MMM yyyy")}</p>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Droplet className="w-3 h-3 mr-1 text-blue-500" />
                        {del.jarCount} जार
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{del.amount}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${del.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {del.isPaid ? 'जमा' : 'उधार'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="payments" className="space-y-3 mt-4">
            {payLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : payments?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">कोई भुगतान नहीं</div>
            ) : (
              payments?.map(pay => (
                <Card key={pay.id}>
                  <CardContent className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{format(new Date(pay.paymentDate), "dd MMM yyyy")}</p>
                      <p className="text-sm text-muted-foreground mt-1 capitalize">{pay.mode}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+ ₹{pay.amount}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

      </div>
    </Layout>
  );
}
