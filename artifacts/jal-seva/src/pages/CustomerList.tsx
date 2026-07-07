import { Layout } from "@/components/layout/Layout";
import { useListCustomers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Search, UserPlus, Phone, IndianRupee } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function CustomerList() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | "people" | "shop">("all");
  
  const { data: customers, isLoading } = useListCustomers();

  const filteredCustomers = customers?.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.mobile?.includes(search)) return false;
    if (type !== "all" && c.type !== type) return false;
    return true;
  });

  return (
    <Layout title="ग्राहक (Customers)">
      <div className="p-4 space-y-4">
        {/* Search & Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="नाम या नंबर से खोजें..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>
        
        <div className="flex gap-2 pb-2 overflow-x-auto hide-scrollbar">
          <Button 
            variant={type === "all" ? "default" : "outline"} 
            onClick={() => setType("all")}
            className="rounded-full h-10 px-6"
          >
            सभी (All)
          </Button>
          <Button 
            variant={type === "people" ? "default" : "outline"} 
            onClick={() => setType("people")}
            className="rounded-full h-10 px-6"
          >
            घर (People)
          </Button>
          <Button 
            variant={type === "shop" ? "default" : "outline"} 
            onClick={() => setType("shop")}
            className="rounded-full h-10 px-6"
          >
            दुकान (Shop)
          </Button>
        </div>

        {/* List */}
        <div className="space-y-3 pb-24">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredCustomers?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              कोई ग्राहक नहीं मिला (No customers found)
            </div>
          ) : (
            filteredCustomers?.map(customer => (
              <Link key={customer.id} href={`/customers/${customer.id}`}>
                <Card className="active:bg-slate-50 dark:active:bg-slate-900 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg leading-tight">{customer.name}</h3>
                          <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                            {customer.type === "people" ? "घर" : "दुकान"}
                          </Badge>
                        </div>
                        {customer.mobile && (
                          <div className="flex items-center text-muted-foreground text-sm gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            {customer.mobile}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                          {customer.jarRate}/जार
                        </div>
                        {customer.balance > 0 ? (
                          <div className="text-red-500 font-bold flex flex-col items-end leading-tight">
                            <span className="text-xs font-normal">बकाया (Udhar)</span>
                            ₹{customer.balance}
                          </div>
                        ) : (
                          <div className="text-green-600 font-medium text-sm">
                            Clear
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* FAB */}
        <Link href="/customers/new">
          <Button 
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg p-0" 
            size="icon"
          >
            <UserPlus className="w-6 h-6" />
          </Button>
        </Link>
      </div>
    </Layout>
  );
}
