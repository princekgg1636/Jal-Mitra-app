import { Layout } from "@/components/layout/Layout";
import { useGetDailyReport, useGetMonthlyReport, useGetOutstandingReport } from "@workspace/api-client-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { format, subMonths, addMonths } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { IndianRupee, Droplet, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Reports() {
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  
  const [monthDate, setMonthDate] = useState(new Date());
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;

  const { data: daily, isLoading: dailyLoading } = useGetDailyReport({ date });
  const { data: monthly, isLoading: monthlyLoading } = useGetMonthlyReport({ month, year });
  const { data: outstanding, isLoading: outLoading } = useGetOutstandingReport();

  return (
    <Layout title="रिपोर्ट (Reports)">
      <div className="p-4 pb-24">
        <Tabs defaultValue="daily">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="daily">दैनिक</TabsTrigger>
            <TabsTrigger value="monthly">मासिक</TabsTrigger>
            <TabsTrigger value="outstanding">बकाया</TabsTrigger>
          </TabsList>

          {/* Daily Report */}
          <TabsContent value="daily" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="h-12 flex-1"
              />
            </div>

            {dailyLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : daily ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <StatBox label="कुल जार" value={daily.totalJars} icon={<Droplet className="w-4 h-4 text-blue-500" />} />
                  <StatBox label="कुल डिलीवरी" value={daily.totalDeliveries} icon={<CalendarIcon className="w-4 h-4 text-slate-500" />} />
                  <StatBox label="नकद प्राप्त" value={`₹${daily.totalCash}`} icon={<IndianRupee className="w-4 h-4 text-green-500" />} valueClass="text-green-600" />
                  <StatBox label="उधार" value={`₹${daily.totalUdhar}`} icon={<IndianRupee className="w-4 h-4 text-red-500" />} valueClass="text-red-500" />
                </div>

                <h3 className="font-semibold mb-2">आज की डिलीवरी ({daily.deliveries.length})</h3>
                <div className="space-y-2 mb-6">
                  {daily.deliveries.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">कोई डिलीवरी नहीं</p>
                  ) : (
                    daily.deliveries.map(d => (
                      <Card key={d.id}>
                        <CardContent className="p-3 flex justify-between items-center">
                          <div>
                            <p className="font-medium">{d.customerName}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${d.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {d.isPaid ? 'जमा' : 'उधार'}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold flex items-center justify-end"><Droplet className="w-3.5 h-3.5 mr-1 text-blue-500"/> {d.jarCount}</p>
                            <p className="text-sm text-muted-foreground">₹{d.amount}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                <h3 className="font-semibold mb-2">आज के भुगतान ({daily.payments.length})</h3>
                <div className="space-y-2">
                  {daily.payments.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">कोई भुगतान नहीं</p>
                  ) : (
                    daily.payments.map(p => (
                      <Card key={p.id}>
                        <CardContent className="p-3 flex justify-between items-center">
                          <div>
                            <p className="font-medium">{p.customerName}</p>
                            <p className="text-xs text-muted-foreground capitalize mt-1">{p.mode}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">+₹{p.amount}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </>
            ) : null}
          </TabsContent>

          {/* Monthly Report */}
          <TabsContent value="monthly" className="space-y-4">
            <div className="flex items-center justify-between mb-4 bg-white dark:bg-zinc-900 p-2 rounded-lg border shadow-sm">
              <Button variant="ghost" size="icon" onClick={() => setMonthDate(subMonths(monthDate, 1))}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="font-bold text-lg">
                {format(monthDate, "MMMM yyyy")}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMonthDate(addMonths(monthDate, 1))}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {monthlyLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : monthly ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <StatBox label="कुल जार" value={monthly.totalJars} icon={<Droplet className="w-4 h-4 text-blue-500" />} />
                  <StatBox label="कुल बिल" value={`₹${monthly.totalAmount}`} icon={<IndianRupee className="w-4 h-4 text-slate-500" />} />
                  <StatBox label="जमा प्राप्त" value={`₹${monthly.totalCollected}`} icon={<IndianRupee className="w-4 h-4 text-green-500" />} valueClass="text-green-600" />
                  <StatBox label="मासिक बकाया" value={`₹${monthly.totalOutstanding}`} icon={<IndianRupee className="w-4 h-4 text-red-500" />} valueClass="text-red-500" />
                </div>

                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">ग्राहकवार रिपोर्ट</h3>
                  <p className="text-sm text-muted-foreground">{monthly.totalCustomers} ग्राहक</p>
                </div>
                
                <div className="space-y-2">
                  {monthly.customerSummaries.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">इस महीने का कोई डाटा नहीं</p>
                  ) : (
                    monthly.customerSummaries.map(c => (
                      <Card key={c.customerId}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-semibold">{c.customerName}</p>
                            <p className="font-bold text-blue-600">{c.totalJars} जार</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center text-sm border-t pt-2">
                            <div>
                              <p className="text-xs text-muted-foreground">बिल</p>
                              <p className="font-medium">₹{c.totalAmount}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">जमा</p>
                              <p className="font-medium text-green-600">₹{c.totalPaid}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">बकाया</p>
                              <p className={`font-medium ${c.balance > 0 ? 'text-red-500' : ''}`}>₹{c.balance}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </>
            ) : null}
          </TabsContent>

          {/* Outstanding Report */}
          <TabsContent value="outstanding" className="space-y-4">
            {outLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : outstanding ? (
              <>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 p-4 rounded-xl mb-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">कुल बाजार बकाया</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-500">
                      ₹{outstanding.reduce((sum, c) => sum + c.balance, 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">कुल ग्राहक</p>
                    <p className="text-xl font-bold text-red-700 dark:text-red-500">{outstanding.length}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {outstanding.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">बाजार में कोई बकाया नहीं है! (Well done!)</p>
                  ) : (
                    outstanding.map(c => (
                      <Card key={c.id}>
                        <CardContent className="p-3 flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{c.name}</p>
                            {c.lastDeliveryDate && (
                              <p className="text-xs text-muted-foreground">
                                अंतिम डिलीवरी: {format(new Date(c.lastDeliveryDate), "dd MMM yyyy")}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-500 text-lg">₹{c.balance}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function StatBox({ label, value, icon, valueClass }: { label: string, value: string | number, icon: React.ReactNode, valueClass?: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border p-3 rounded-xl shadow-sm">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`text-xl font-bold ${valueClass || ''}`}>{value}</p>
    </div>
  );
}
