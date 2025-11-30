import { Expense } from '../types';

const API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY || 'YOUR-API-KEY';
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

interface CacheEntry {
  rate: number;
  timestamp: number;
}

// Cache rates for 1 hour
const CACHE_DURATION = 3600 * 1000;
const RATE_CACHE: Record<string, CacheEntry> = {};

export const getExchangeRate = async (from: string, to: string): Promise<number> => {
  if (from === to) return 1;

  const cacheKey = `${from}_${to}`;
  const now = Date.now();

  if (RATE_CACHE[cacheKey] && (now - RATE_CACHE[cacheKey].timestamp < CACHE_DURATION)) {
    return RATE_CACHE[cacheKey].rate;
  }

  try {
    const response = await fetch(`${BASE_URL}/${API_KEY}/pair/${from}/${to}`);
    const data = await response.json();

    if (data.result === 'success') {
      const rate = data.conversion_rate;
      RATE_CACHE[cacheKey] = { rate, timestamp: now };
      return rate;
    } else {
      console.error('Currency API Error:', data['error-type']);
      return 1; // Fallback to 1:1 if API fails
    }
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
    return 1; // Fallback
  }
};

export const convertAmount = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
};

export const convertExpenses = async (expenses: Expense[], targetCurrency: string): Promise<Expense[]> => {
  const converted = await Promise.all(expenses.map(async (expense) => {
    // Assume expense.currency exists, if not default to 'INR' or whatever logic
    // The user mentioned "currency_from_receipt", implying expenses might have a currency field.
    // I checked types.ts and Expense HAS a currency field.
    const fromCurrency = expense.currency || 'INR'; 
    
    if (fromCurrency === targetCurrency) return expense;

    const newAmount = await convertAmount(expense.amount, fromCurrency, targetCurrency);
    return {
      ...expense,
      amount: newAmount,
      // We keep the original currency in the record? 
      // Or do we return a view model?
      // The request says "convert them into INR before showing".
      // So for display purposes we return a modified object.
      // But we should probably not mutate the ID or other fields if we are just displaying.
      // However, for the dashboard stats, we need the amounts in the target currency.
    };
  }));
  return converted;
};
