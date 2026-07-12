import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth, type Permission } from "@/context/AuthContext";

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
import PendingApproval from "@/pages/PendingApproval";
import AdminUsers from "@/pages/AdminUsers";

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

/** Home route */
function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (!user.approved) return <PendingApproval />;
  if (user.role === "grahak") return <GrahakDashboard />;
  return <Dashboard />;
}

/** Full-access: admin, approved delivery_boy/shop, or co_admin with any permission */
function FullRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading, isFullAccess } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (!user.approved) return <PendingApproval />;
  if (!isFullAccess) return <Redirect to="/" />;
  return <Component />;
}

/** Permission-gated route for co_admin granular access */
function PermRoute({ component: Component, permission }: { component: React.ComponentType; permission: Permission }) {
  const { user, loading, can } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (!user.approved) return <PendingApproval />;
  // admin / delivery_boy / shop have implicit access, co_admin needs explicit permission
  if (!can(permission)) return <Redirect to="/" />;
  return <Component />;
}

/** Admin-only route */
function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (user.role !== "admin") return <Redirect to="/" />;
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
      <Route path="/"                   component={HomeRoute} />
      <Route path="/customers"          component={() => <PermRoute component={CustomerList}   permission="manage_customers" />} />
      <Route path="/customers/new"      component={() => <PermRoute component={CustomerForm}   permission="manage_customers" />} />
      <Route path="/customers/:id/edit" component={() => <PermRoute component={CustomerForm}   permission="manage_customers" />} />
      <Route path="/customers/:id"      component={() => <PermRoute component={CustomerDetail} permission="manage_customers" />} />
      <Route path="/delivery/new"       component={() => <PermRoute component={DeliveryEntry}  permission="manage_deliveries" />} />
      <Route path="/payment/new"        component={() => <PermRoute component={PaymentEntry}   permission="manage_payments" />} />
      <Route path="/party-orders"       component={() => <PermRoute component={PartyOrders}    permission="manage_party_orders" />} />
      <Route path="/reports"            component={() => <PermRoute component={Reports}        permission="view_reports" />} />
      <Route path="/settings"           component={() => <AuthRoute component={Settings} />} />
      <Route path="/admin/users"        component={() => <AdminRoute component={AdminUsers} />} />
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
