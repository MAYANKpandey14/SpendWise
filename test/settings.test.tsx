import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Settings } from '../pages/Settings';
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
      single: vi.fn().mockResolvedValue({ data: { name: 'Test User', currency: 'USD' }, error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

describe('Settings', () => {

  it('renders settings form', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <ThemeProvider>
              <Settings />
            </ThemeProvider>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /profile/i, level: 3 })).toBeInTheDocument();
  });
});
