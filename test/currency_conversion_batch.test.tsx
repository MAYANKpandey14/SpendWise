import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddExpense } from '../pages/AddExpense';
import { AppProvider } from '../context/AppContext';
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import * as currencyService from '../services/currencyService';

// Mock data provided by user
const MOCK_DATA = [
    {
        merchant: "Zomato",
        amount: 459.75,
        currency: "INR",
        date: "2025-11-30",
        categoryId: "food"
    },
    {
        merchant: "Uber",
        amount: 12.50,
        currency: "USD",
        date: "2025-11-29",
        categoryId: "transport"
    },
    {
        merchant: "Lidl Supermarket",
        amount: 28.99,
        currency: "EUR",
        date: "2025-11-28",
        categoryId: "shopping"
    },
    {
        merchant: "Amazon Japan",
        amount: 3500.00,
        currency: "JPY",
        date: "2025-11-27",
        categoryId: "shopping"
    },
    {
        merchant: "Starbucks",
        amount: 5.75,
        currency: "GBP",
        date: "2025-11-26",
        categoryId: "food"
    },
    {
        merchant: "Gym Membership",
        amount: 49.99,
        currency: "AUD",
        date: "2025-11-25",
        categoryId: "health"
    },
    {
        merchant: "Netflix",
        amount: 15.99,
        currency: "USD",
        date: "2025-11-24",
        categoryId: "entertainment"
    }
];

// Mock Exchange Rates
const RATES: Record<string, number> = {
    'USD': 84.0,
    'EUR': 88.0,
    'JPY': 0.55,
    'GBP': 105.0,
    'AUD': 54.0,
    'INR': 1.0
};

// Mock Services
vi.mock('../services/currencyService', () => ({
    convertAmount: vi.fn((amount, from, to) => {
        if (from === to) return Promise.resolve(amount);
        const rate = RATES[from] || 1;
        return Promise.resolve(amount * rate);
    }),
    getExchangeRate: vi.fn()
}));

vi.mock('../services/geminiService', () => ({
    analyzeReceipt: vi.fn()
}));

// Mock Supabase Client
vi.mock('../services/supabaseClient', () => ({
    supabase: {
        auth: {
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        }
    }
}));

// Mock User Service
vi.mock('../services/userService', () => ({
    getUserProfile: vi.fn().mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        currency: 'INR'
    }),
    updateUserProfile: vi.fn()
}));

// Mock Expense Service
vi.mock('../services/expenseService', () => ({
    createExpenseInDb: vi.fn().mockResolvedValue(null),
    fetchExpensesFromDb: vi.fn().mockResolvedValue([]),
    updateExpenseInDb: vi.fn(),
    deleteExpenseInDb: vi.fn()
}));

// Mock FileReader
class MockFileReader {
    result = '';
    onloadend = () => { };
    readAsDataURL = (_blob: Blob) => {
        console.log('MockFileReader: readAsDataURL called');
        this.result = 'data:image/jpeg;base64,mockbase64data';
        this.onloadend();
    };
}
global.FileReader = MockFileReader as any;

describe('Currency Conversion Batch Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('converts foreign currencies to INR correctly', async () => {
        // We'll render the component once and simulate adding each expense
        const { createExpenseInDb } = await import('../services/expenseService');

        for (const data of MOCK_DATA) {
            console.log(`Testing ${data.merchant}`);
            // Re-render for each item to clear state
            const { unmount } = render(
                <BrowserRouter>
                    <AuthProvider>
                        <AppProvider>
                            <AddExpense />
                        </AppProvider>
                    </AuthProvider>
                </BrowserRouter>
            );

            // Fill Form
            fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: data.amount.toString(), name: 'amount' } });

            // Mock analyzeReceipt to return this specific item's data
            const { analyzeReceipt } = await import('../services/geminiService');
            vi.mocked(analyzeReceipt).mockResolvedValueOnce({
                merchant: data.merchant,
                amount: data.amount,
                date: data.date,
                categoryId: data.categoryId,
                currency: data.currency
            });

            // Trigger "Scan" flow simulation
            const file = new File(['dummy'], 'receipt.jpg', { type: 'image/jpeg' });
            const input = screen.getByTestId('receipt-upload');
            // Object.defineProperty(input, 'files', { value: [file] });
            fireEvent.change(input, { target: { files: [file] } });

            // Wait for AI analysis to complete (simulated)
            await waitFor(() => {
                expect(vi.mocked(analyzeReceipt)).toHaveBeenCalled();
            }, { timeout: 3000 });

            await waitFor(() => {
                expect(screen.getByDisplayValue(data.merchant)).toBeInTheDocument();
            }, { timeout: 3000 });

            // Now click Save
            fireEvent.click(screen.getByText('Review & Save'));

            // Confirm Modal
            await waitFor(() => {
                expect(screen.getByText('Confirm Entry')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Add Expense'));

            // Wait for addExpense to be called (which calls createExpenseInDb)
            await waitFor(() => {
                expect(createExpenseInDb).toHaveBeenCalled();
            });

            // Verify the last call arguments
            const lastCall = vi.mocked(createExpenseInDb).mock.calls[vi.mocked(createExpenseInDb).mock.calls.length - 1];
            const savedExpense = lastCall[0];

            // Expected Amount
            const expectedRate = RATES[data.currency] || 1;
            const expectedAmount = data.amount * expectedRate;

            console.log(`Verifying ${data.merchant}: ${data.amount} ${data.currency} -> ${expectedAmount} INR`);

            expect(savedExpense.currency).toBe('INR');
            expect(savedExpense.amount).toBeCloseTo(expectedAmount, 2);

            if (data.currency !== 'INR') {
                expect(savedExpense.description).toContain(`Original: ${data.amount} ${data.currency}`);
            }

            unmount();
        }
    });
});
