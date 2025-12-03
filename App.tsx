import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';

// --- Lazy Load Pages ---
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const ExpenseList = lazy(() => import('./pages/ExpenseList').then(module => ({ default: module.ExpenseList })));
const AddExpense = lazy(() => import('./pages/AddExpense').then(module => ({ default: module.AddExpense })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Signup = lazy(() => import('./pages/Signup').then(module => ({ default: module.Signup })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword').then(module => ({ default: module.UpdatePassword })));

// --- Shared Components ---
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background dark:bg-dark-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// 1. FIX: Root Redirect Logic (Prevents the "Login Flash")
const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

// 2. FIX: Protected Route
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Layout>{children}</Layout>;
};

// 3. FIX: Public Only Route (Fixes the Logout Loop bug)
// Ensures users don't access Login page while the session is still active
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes (Wrapped to prevent access if logged in) */}
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
                <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                
                {/* Note: UpdatePassword usually requires Auth, or a specific token. Keeping as is for now. */}
                <Route path="/update-password" element={<UpdatePassword />} />

                {/* Root Redirect */}
                <Route path="/" element={<RootRedirect />} />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/expenses" element={<ProtectedRoute><ExpenseList /></ProtectedRoute>} />
                <Route path="/add" element={<ProtectedRoute><AddExpense /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                {/* Fallback - Fixed Logic */}
                <Route path="*" element={<RootRedirect />} />
              </Routes>
            </Suspense>
          </Router>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;