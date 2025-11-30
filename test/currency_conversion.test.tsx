import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddExpense } from '../pages/AddExpense';
import { Dashboard } from '../pages/Dashboard';
import { AuthProvider } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';
import { ThemeProvider } from '../context/ThemeContext';
import { BrowserRouter } from 'react-router-dom';
import { analyzeReceipt } from '../services/geminiService';
import * as currencyService from '../services/currencyService';

// Mock Supabase
const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
const mockSelect = vi.fn().mockReturnThis();

vi.mock('../services/supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: {
                    session: {
                        user: { id: 'test-user', email: 'test@example.com', user_metadata: { full_name: 'Test User' } }
                    }
                }
            }),
            onAuthStateChange: vi.fn((callback) => {
                // Simulate immediate sign in
                callback('SIGNED_IN', { user: { id: 'test-user', email: 'test@example.com' } });
                return { data: { subscription: { unsubscribe: vi.fn() } } };
            }),
            getUser: vi.fn().mockResolvedValue({
                data: {
                    user: { id: 'test-user', email: 'test@example.com', user_metadata: { full_name: 'Test User' } }
                }
            }),
        },
        from: vi.fn(() => ({
            select: mockSelect,
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            insert: mockInsert,
            then: vi.fn().mockResolvedValue({ data: [], error: null }),
            delete: vi.fn().mockResolvedValue({ data: null, error: null }),
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

// Mock Currency Service
vi.mock('../services/currencyService', () => ({
    convertExpenses: vi.fn(),
    getExchangeRate: vi.fn(),
    convertAmount: vi.fn(),
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

// Mock User Service to return INR user
vi.mock('../services/userService', () => ({
    getUserProfile: vi.fn().mockResolvedValue({
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        currency: 'INR',
        locale: 'en-US'
    }),
    updateUserProfile: vi.fn(),
}));

describe('Currency Conversion Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('extracts USD from receipt and converts to INR on dashboard', async () => {
        // 1. Setup Mocks

        // AI returns USD expense
        (analyzeReceipt as any).mockResolvedValue({
            amount: 10, // 10 USD
            date: '2023-10-27',
            merchant: 'US Store',
            category: 'food', // Ensure this matches a valid category ID or logic
            description: 'Lunch',
            currency: 'USD'
        });

        // Currency service converts 10 USD -> 830 INR
        (currencyService.convertExpenses as any).mockImplementation(async (expenses: any[], targetCurrency: string) => {
            return expenses.map(e => {
                if (e.currency === 'USD' && targetCurrency === 'INR') {
                    return { ...e, amount: e.amount * 83 }; // Mock rate 83
                }
                return e;
            });
        });

        // 2. Render AddExpense to simulate upload
        // We need a wrapper to hold the AppContext state (expenses)

        const TestWrapper = ({ children }: { children: React.ReactNode }) => (
            <BrowserRouter>
                <AuthProvider>
                    <AppProvider>
                        <ThemeProvider>
                            {children}
                        </ThemeProvider>
                    </AppProvider>
                </AuthProvider>
            </BrowserRouter>
        );

        // We can't easily switch components in one test without a router or state hack.
        // So we will verify the "Add" part, then manually seed the "Dashboard" part or use a custom component that renders both.

        // Let's try rendering AddExpense first
        const { unmount } = render(
            <TestWrapper>
                <AddExpense />
            </TestWrapper>
        );

        // 3. Simulate Receipt Upload
        const file = new File(['(receipt)'], 'receipt.png', { type: 'image/png' });
        const input = screen.getByTestId('receipt-upload');

        await act(async () => {
            fireEvent.change(input, { target: { files: [file] } });
        });

        // Wait for AI analysis
        await waitFor(() => {
            expect(analyzeReceipt).toHaveBeenCalled();
        });

        // Verify Form shows USD symbol ($) and amount 10
        expect(screen.getByDisplayValue('10')).toBeInTheDocument();
        // The currency symbol is rendered in a span. 
        // We can check if '$' is present near the input.
        expect(screen.getByText('$')).toBeInTheDocument();

        // 4. Submit the expense
        const submitBtn = screen.getByText(/Review & Save/i);
        fireEvent.click(submitBtn);

        // Confirm modal
        await waitFor(() => {
            expect(screen.getByText(/Confirm Entry/i)).toBeInTheDocument();
        });

        vi.useFakeTimers();
        const confirmBtn = screen.getByText('Add Expense');
        await act(async () => {
            fireEvent.click(confirmBtn);
            vi.advanceTimersByTime(500);
        });
        vi.useRealTimers();

        // Wait for async addExpense (simulated delay 300ms)
        await waitFor(() => {
            expect(mockInsert).toHaveBeenCalled();
        }, { timeout: 2000 });

        // Verify insert was called with USD
        const insertCall = mockInsert.mock.calls[0][0];
        // insertCall is an array of objects or single object
        const insertedExpense = Array.isArray(insertCall) ? insertCall[0] : insertCall;

        expect(insertedExpense).toMatchObject({
            amount: 10,
            currency: 'USD',
            merchant: 'US Store'
        });

        unmount();

        // 5. Now Verify Dashboard Conversion
        // We need to simulate that the expense is now in the AppContext.
        // Since we mocked supabase.from('expenses').select, we can make it return this expense.

        mockSelect.mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            then: vi.fn().mockResolvedValue({
                data: [{
                    id: 'test-id',
                    amount: 10,
                    currency: 'USD',
                    merchant: 'US Store',
                    categoryId: 'food',
                    date: '2023-10-27',
                    description: 'Lunch',
                    created_at: new Date().toISOString()
                }],
                error: null
            })
        } as any);

        // Render Dashboard
        render(
            <TestWrapper>
                <Dashboard />
            </TestWrapper>
        );

        // Wait for currency conversion
        await waitFor(() => {
            expect(currencyService.convertExpenses).toHaveBeenCalled();
        });

        // Verify Display
        // 10 USD * 83 = 830 INR
        // Dashboard should show ₹830.00

        // We look for the Total Spent or Recent Transactions
        // "Total Spent" is usually the first big number
        // We can search for "830.00"

        await waitFor(() => {
            expect(screen.getByText((content, element) => {
                return content.includes('830.00');
            })).toBeInTheDocument();
        });

        // Verify symbol is INR (₹)
        expect(screen.getAllByText(/₹/i).length).toBeGreaterThan(0);
    });
});
