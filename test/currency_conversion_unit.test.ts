import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertAmount } from '../services/currencyService';

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

// Mock global fetch
global.fetch = vi.fn((url: string | URL | Request) => {
    const urlStr = url.toString();
    // Extract currencies from URL (format: .../pair/FROM/TO)
    const parts = urlStr.split('/');
    const to = parts[parts.length - 1];
    const from = parts[parts.length - 2];
    
    // We assume target is always INR for this test
    const rate = (to === 'INR') ? (RATES[from] || 1) : 1;

    return Promise.resolve({
        json: () => Promise.resolve({
            result: 'success',
            conversion_rate: rate
        })
    } as Response);
});

describe('Currency Conversion Unit Test', () => {
    it('converts mock data amounts to INR correctly', async () => {
        for (const data of MOCK_DATA) {
            const converted = await convertAmount(data.amount, data.currency, 'INR');
            
            const expectedRate = RATES[data.currency] || 1;
            const expectedAmount = data.amount * expectedRate;

            console.log(`${data.amount} ${data.currency} -> ${converted} INR (Expected: ${expectedAmount})`);
            
            expect(converted).toBeCloseTo(expectedAmount, 2);
        }
    });
});
