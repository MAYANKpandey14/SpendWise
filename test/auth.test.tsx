import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Login } from '../pages/Login';
import { Signup } from '../pages/Signup';
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider } from '../context/ThemeContext';

// Mock Supabase
vi.mock('../services/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

// Mock useNavigate
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Page', () => {

    it('renders login form correctly', () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
              <Login />
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      );
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in with email/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    });

    it('handles email input', () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
              <Login />
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(emailInput).toHaveValue('test@example.com');
    });
  });

  describe('Signup Page', () => {
    it('renders signup form correctly', () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
              <Signup />
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      );
      
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });
  });
});
