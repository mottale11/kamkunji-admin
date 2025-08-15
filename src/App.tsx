import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import AdminLanding from "./pages/admin/landing";
import AdminLogin from "./pages/admin/login";
import AdminSignup from "./pages/admin/signup";
import AdminDashboard from "./pages/admin/dashboard";
import AdminProducts from "./pages/admin/products";
import AdminOrders from "./pages/admin/orders";


function Router() {
  return (
    <Switch>
      {/* Admin routes */}
      <Route path="/admin" component={AdminLanding} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/signup" component={AdminSignup} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/orders" component={AdminOrders} />
      
      {/* Root route - redirect to admin landing */}
      <Route path="/" component={AdminLanding} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

// Changed to named export to avoid multiple default exports
export function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}