import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/context/AuthContext";

import Dashboard from "@/pages/Dashboard";
import GrahakDashboard from "@/pages/GrahakDashboard";
import CustomerList from "@/pages/CustomerList";
import CustomerForm from "@/pages/CustomerForm";
import CustomerDetail from "@/pages/CustomerDetail";
import DeliveryEntry from "@/pages/DeliveryEntry";
import PaymentEntry from "@/pages/PaymentEntry";
import PartyOrders from "@/pages/PartyOrders";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

function LoadingScreen() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <img src="/anshu-jal-logo.svg" alt="Anshu Jal" className="w-16 h-16 rounded-full animate-pulse" />
        <p className="text-muted-foreground text-sm">लोड हो रहा है...</p>
      </div>
    </div>
  );
}

/** Home route — shows GrahakDashboard for grahak, full Dashboard for others */
function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (user.role === "grahak") return <GrahakDashboard />;
  return <Dashboard />;
}

/** Full-access only — redirects grahak to home */
function FullRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading, isFullAccess } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (!isFullAccess) return <Redirect to="/" />;
  return <Component />;
}

/** Any authenticated user */
function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login"  component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/"                    component={HomeRoute} />
      <Route path="/customers"           component={() => <FullRoute component={CustomerList} />} />
      <Route path="/customers/new"       component={() => <FullRoute component={CustomerForm} />} />
      <Route path="/customers/:id/edit"  component={() => <FullRoute component={CustomerForm} />} />
      <Route path="/customers/:id"       component={() => <FullRoute component={CustomerDetail} />} />
      <Route path="/delivery/new"        component={() => <FullRoute component={DeliveryEntry} />} />
      <Route path="/payment/new"         component={() => <FullRoute component={PaymentEntry} />} />
      <Route path="/party-orders"        component={() => <FullRoute component={PartyOrders} />} />
      <Route path="/reports"             component={() => <FullRoute component={Reports} />} />
      <Route path="/settings"            component={() => <AuthRoute component={Settings} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="jal-seva-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
