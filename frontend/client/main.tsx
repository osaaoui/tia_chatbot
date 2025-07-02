import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Added Navigate
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { AuthProvider } from "./context/AuthContext"; // Only AuthProvider needed here
import ProtectedRoute from "./components/ProtectedRoute"; // Import the new ProtectedRoute

const queryClient = new QueryClient();

// ProtectedRouteWrapper is no longer needed here as it's in ProtectedRoute.tsx

const AppRoutes = () => {
  // useAuth can't be used here directly as AppRoutes might not be within AuthProvider yet
  // depending on structure, but ProtectedRoute itself uses useAuth.
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider> {/* Wrap routes with AuthProvider */}
        <Toaster />
        <Sonner />
        <AppRoutes /> {/* Use the new AppRoutes component */}
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
