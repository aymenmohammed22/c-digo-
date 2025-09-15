import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LocationProvider, useLocation } from "./context/LocationContext";
import { UiSettingsProvider } from "./context/UiSettingsContext";
import { LocationPermissionModal } from "./components/LocationPermissionModal";
import Layout from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import AdminApp from "./pages/AdminApp";
import { DriverDashboard } from "./pages/DriverDashboard";
import { useState } from "react";
import Home from "./pages/Home";
import Restaurant from "./pages/Restaurant";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import Location from "./pages/Location";
import OrderTracking from "./pages/OrderTracking";
import OrdersPage from "./pages/OrdersPage";
import TrackOrdersPage from "./pages/TrackOrdersPage";
import Settings from "./pages/Settings";
import Privacy from "./pages/Privacy";
import SearchPage from "./pages/SearchPage";
// Admin pages removed - now handled separately
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  const { userType, loading } = useAuth();
  const { location } = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Handle admin login route
  if (window.location.pathname === '/admin-login') {
    return (
      <LoginPage 
        onSuccess={() => {
          if (userType === 'admin') {
            window.location.href = '/admin/dashboard';
          } else if (userType === 'driver') {
            window.location.href = '/driver/dashboard';
          } else {
            window.location.href = '/';
          }
        }} 
      />
    );
  }

  // Handle admin routes (completely separate from customer app)
  if (window.location.pathname.startsWith('/admin')) {
    // Direct access to admin panel without authentication
    return (
      <AdminApp 
        onLogout={() => {
          window.location.href = '/';
        }} 
      />
    );
  }

  // Handle driver routes (completely separate from customer app)
  if (window.location.pathname.startsWith('/driver/')) {
    // Direct access to delivery app without authentication
    return (
      <DriverDashboard 
        onLogout={() => {
          window.location.href = '/';
        }} 
      />
    );
  }

  // Remove admin/driver routes from customer app routing

  // Default customer app
  return (
    <>
      <Layout>
        <Router />
      </Layout>
      
      {showLocationModal && !location.hasPermission && (
        <LocationPermissionModal
          onPermissionGranted={(position) => {
            console.log('تم منح الإذن للموقع:', position);
            setShowLocationModal(false);
          }}
          onPermissionDenied={() => {
            console.log('تم رفض الإذن للموقع');
            setShowLocationModal(false);
          }}
        />
      )}
    </>
  );
}

function Router() {
  // Check localStorage settings for page visibility
  const showOrdersPage = localStorage.getItem('show_orders_page') !== 'false';
  const showTrackOrdersPage = localStorage.getItem('show_track_orders_page') !== 'false';

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={SearchPage} />
      <Route path="/restaurant/:id" component={Restaurant} />
      <Route path="/cart" component={Cart} />
      <Route path="/profile" component={Profile} />
      <Route path="/addresses" component={Location} />
      {showOrdersPage && <Route path="/orders" component={OrdersPage} />}
      <Route path="/orders/:orderId" component={OrderTracking} />
      {showTrackOrdersPage && <Route path="/track-orders" component={TrackOrdersPage} />}
      <Route path="/settings" component={Settings} />
      <Route path="/privacy" component={Privacy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <UiSettingsProvider>
            <LocationProvider>
              <AuthProvider>
                <CartProvider>
                  <Toaster />
                  <AuthenticatedApp />
                </CartProvider>
              </AuthProvider>
            </LocationProvider>
          </UiSettingsProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
