import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Dashboard } from '../pages/Dashboard';
import { AuthProvider } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';

// Mock Supabase
vi.mock('../services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

describe('Dashboard', () => {

  it('renders dashboard components', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <ThemeProvider>
              <Dashboard />
            </ThemeProvider>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/total spent/i)).toBeInTheDocument();
    expect(screen.getByText(/recent transactions/i)).toBeInTheDocument();
  });
});
