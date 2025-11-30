import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AddExpense } from '../pages/AddExpense';
import { ExpenseList } from '../pages/ExpenseList';
import { AuthProvider } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';
import { BrowserRouter } from 'react-router-dom';
import { analyzeReceipt } from '../services/geminiService';
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
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } }),
      })),
    },
  },
}));

// Mock Gemini Service
vi.mock('../services/geminiService', () => ({
  analyzeReceipt: vi.fn(),
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

describe('Expense Management', () => {
  describe('Expense List', () => {

    it('renders expense list', () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <AppProvider>
              <ThemeProvider>
                <ExpenseList />
              </ThemeProvider>
            </AppProvider>
          </AuthProvider>
        </BrowserRouter>
      );
      
      expect(screen.getByText(/history of all transactions/i)).toBeInTheDocument();
    });
  });

  describe('Add Expense', () => {
    it('renders add expense form', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <AppProvider>
              <ThemeProvider>
                <AddExpense />
              </ThemeProvider>
            </AppProvider>
          </AuthProvider>
        </BrowserRouter>
      );
      
      expect(await screen.findByPlaceholderText(/0.00/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/merchant name/i)).toBeInTheDocument();
    });

    it('handles AI receipt extraction', async () => {
      // Mock AI response with data from user-provided receipt
      (analyzeReceipt as any).mockResolvedValue({
        amount: 154.06,
        date: '2019-02-11',
        merchant: 'East Repair Inc.',
        category: 'Maintenance',
        description: 'Front and rear brake cables, New set of pedal arms, Labor 3hrs',
        currency: 'USD'
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <AppProvider>
              <ThemeProvider>
                <AddExpense />
              </ThemeProvider>
            </AppProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      // Simulate file upload
      const file = new File(['(⌐□_□)'], 'receipt.png', { type: 'image/png' });
      const input = screen.getByTestId('receipt-upload');
      
      fireEvent.change(input, { target: { files: [file] } });

      // Wait for AI processing
      await waitFor(() => {
        expect(analyzeReceipt).toHaveBeenCalled();
      });

      // Verify form fields are auto-filled
      await waitFor(() => {
        expect(screen.getByDisplayValue('154.06')).toBeInTheDocument();
        expect(screen.getByDisplayValue('East Repair Inc.')).toBeInTheDocument();
      });
    });
  });
});
