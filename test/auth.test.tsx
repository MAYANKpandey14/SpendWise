
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Login } from '../pages/Login';
import { Signup } from '../pages/Signup';
import { ForgotPassword } from '../pages/ForgotPassword';
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';

// Mock Supabase
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();
const mockSignOut = vi.fn();

vi.mock('../services/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      signInWithOAuth: (...args: any[]) => mockSignInWithOAuth(...args),
      resetPasswordForEmail: (...args: any[]) => mockResetPasswordForEmail(...args),
      updateUser: (...args: any[]) => mockUpdateUser(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockImplementation((callback) => {
        callback('INITIAL_SESSION', { user: null });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
    },
  },
}));

// Mock audit service
vi.mock('../services/auditService', () => ({
  logAuthEvent: vi.fn(),
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
    // Default success responses
    mockSignInWithPassword.mockResolvedValue({ data: { session: { user: { id: '123' } } }, error: null });
    mockSignUp.mockResolvedValue({ data: { session: { user: { id: '123' } } }, error: null });
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
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
      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });

    it('calls login function on submit', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
              <Login />
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      const submitButton = screen.getByRole('button', { name: /sign in with email/i });
      await waitFor(() => expect(submitButton).not.toBeDisabled());

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });

  describe('ForgotPassword Page', () => {
    it('renders forgot password form', () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
              <ForgotPassword />
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      expect(screen.getByText(/reset password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('calls resetPassword function on submit', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
              <ForgotPassword />
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await waitFor(() => expect(submitButton).not.toBeDisabled());

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', expect.any(Object));
      });
    });
  });
});
