import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Fournisseurs from "./pages/Fournisseurs";
import Stock from "./pages/Stock";
import Achats from "./pages/Achats";
import Ventes from "./pages/Ventes";
import Rapports from "./pages/Rapports";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement...</div>;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement...</div>;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/produits" element={<ProtectedRoute><Products /></ProtectedRoute>} />
    <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
    <Route path="/fournisseurs" element={<ProtectedRoute><Fournisseurs /></ProtectedRoute>} />
    <Route path="/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
    <Route path="/achats" element={<ProtectedRoute><Achats /></ProtectedRoute>} />
    <Route path="/ventes" element={<ProtectedRoute><Ventes /></ProtectedRoute>} />
    <Route path="/rapports" element={<ProtectedRoute><Rapports /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
