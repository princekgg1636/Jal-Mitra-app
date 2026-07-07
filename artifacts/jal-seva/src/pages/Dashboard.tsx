import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardStats, useGetTopOutstanding } from "@workspace/api-client-react";
import { Link } from "wouter";
import { IndianRupee, Droplet, Users, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: topOutstanding, isLoading: outLoading } = useGetTopOutstanding();

  return (
    <Layout title="होम">
      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/delivery/new" className="flex flex-col items-center justify-center bg-primary text-white p-4 rounded-xl shadow-sm active:scale-95 transition-transform">
            <Droplet className="w-8 h-8 mb-2" />
            <span className="font-semibold text-lg">+ डिलीवरी</span>
          </Link>
          <Link href="/payment/new" className="flex flex-col items-center justify-center bg-green-600 text-white p-4 rounded-xl shadow-sm active:scale-95 transition-transform">
            <IndianRupee className="w-8 h-8 mb-2" />
            <span className="font-semibold text-lg">+ भुगतान</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">आज (Today)</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard 
              title="जार डिलीवरी" 
              value={statsLoading ? <Skeleton className="h-8 w-16" /> : `${stats?.todayJars || 0} जार`}
              subtitle={`${stats?.todayDeliveries || 0} डिलीवरी`}
              icon={<Droplet className="w-5 h-5 text-blue-500" />}
            />
            <StatCard 
              title="नकद प्राप्त" 
              value={statsLoading ? <Skeleton className="h-8 w-16" /> : `₹${stats?.todayCash || 0}`}
              icon={<IndianRupee className="w-5 h-5 text-green-500" />}
              valueClass="text-green-600 dark:text-green-400"
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">इस महीने (This Month)</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard 
              title="कुल इनकम" 
              value={statsLoading ? <Skeleton className="h-8 w-16" /> : `₹${stats?.monthlyIncome || 0}`}
              icon={<IndianRupee className="w-5 h-5 text-green-500" />}
            />
            <StatCard 
              title="नया उधार" 
              value={statsLoading ? <Skeleton className="h-8 w-16" /> : `₹${stats?.monthlyUdhar || 0}`}
              icon={<AlertCircle className="w-5 h-5 text-red-500" />}
              valueClass="text-red-500 dark:text-red-400"
            />
          </div>
        </div>

        {/* Top Outstanding */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">टॉप बकाया (Top Outstanding)</h2>
            <Link href="/reports" className="text-sm text-primary font-medium">सब देखें</Link>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {outLoading ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : topOutstanding?.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  कोई बकाया नहीं है (No outstanding)
                </div>
              ) : (
                <div className="divide-y">
                  {topOutstanding?.slice(0, 5).map(customer => (
                    <Link key={customer.id} href={`/customers/${customer.id}`}>
                      <div className="flex justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-900 active:bg-slate-100 transition-colors">
                        <div>
                          <p className="font-semibold">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.type === 'people' ? 'घर' : 'दुकान'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-500">₹{customer.balance}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, subtitle, icon, valueClass }: { title: string, value: React.ReactNode, subtitle?: string, icon?: React.ReactNode, valueClass?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon}
        </div>
        <h3 className={`text-2xl font-bold ${valueClass || ''}`}>{value}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
