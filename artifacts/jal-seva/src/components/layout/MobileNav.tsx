import { Link, useLocation } from "wouter";
import { Home, Users, Plus, IndianRupee, FileText, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export function MobileNav() {
  const [location] = useLocation();
  const { isFullAccess, user } = useAuth();

  if (!user) return null;

  // Grahak — minimal nav (just home)
  if (user.role === "grahak") {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          <Link href="/" className="flex flex-col items-center justify-center w-24 h-full space-y-1">
            <Home className={cn("w-6 h-6", location === "/" ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-[10px] font-medium", location === "/" ? "text-primary" : "text-muted-foreground")}>
              मेरा खाता
            </span>
          </Link>
        </div>
      </nav>
    );
  }

  // Full access (admin, delivery_boy, shop) — full nav with party orders
  const navItems = [
    { href: "/",             icon: Home,         label: "होम" },
    { href: "/customers",    icon: Users,         label: "ग्राहक" },
    { href: "/delivery/new", icon: Plus,          label: "डिलीवरी", isFab: true },
    { href: "/party-orders", icon: PartyPopper,   label: "पार्टी" },
    { href: "/reports",      icon: FileText,       label: "रिपोर्ट" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          if (item.isFab) {
            return (
              <div key={item.href} className="relative -top-5">
                <Link href={item.href}>
                  <div className={cn(
                    "flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-white bg-primary hover:bg-primary/90 transition-colors",
                    isActive && "ring-4 ring-primary/20"
                  )}>
                    <item.icon className="w-7 h-7" />
                  </div>
                </Link>
              </div>
            );
          }
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center justify-center w-16 h-full space-y-1">
              <item.icon className={cn("w-6 h-6", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[10px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
