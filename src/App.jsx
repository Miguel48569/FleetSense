/* eslint-disable react/prop-types */
// Projeto SENAC 2026 - FleetSense
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import PageNotFound from "@/lib/PageNotFound";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/lib/AuthContext";
import Dashboard from "@/pages/Dashboard";
import Vehicles from "@/pages/Vehicles";
import Drivers from "@/pages/Drivers";
import Maintenance from "@/pages/Maintenance";
import Reports from "@/pages/Reports";
import Chat from "@/pages/Chat";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

function AuthenticatedRoute({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Validando autenticação...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Validando autenticação...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={(
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            )}
          />
          <Route
            path="/cadastro"
            element={(
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            )}
          />

          <Route
            element={(
              <AuthenticatedRoute>
                <AppLayout />
              </AuthenticatedRoute>
            )}
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/veiculos" element={<Vehicles />} />
            <Route path="/motoristas" element={<Drivers />} />
            <Route path="/manutencao" element={<Maintenance />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/chat" element={<Chat />} />
          </Route>

          <Route path="*" element={<PageNotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
