export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currency: string;
  locale: string;
}

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  categoryId: string;
  date: string; // ISO string YYYY-MM-DD
  merchant: string;
  description?: string;
  receiptUrl?: string;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind class like 'bg-red-500'
  icon: string; // Lucide icon name
}

export interface Budget {
  categoryId: string;
  limit: number;
}

export type ExpenseFormData = Omit<Expense, 'id' | 'createdAt'>;

export interface FilterState {
  startDate: string;
  endDate: string;
  categoryIds: string[];
  minAmount?: number;
  maxAmount?: number;
  searchQuery: string;
}

export type ViewMode = 'list' | 'chart';

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
];

export const REGIONS = [
  { code: 'en-IN', label: 'India (DD/MM/YYYY)' },
  { code: 'en-US', label: 'United States (MM/DD/YYYY)' },
  { code: 'en-GB', label: 'United Kingdom (DD/MM/YYYY)' },
  { code: 'ja-JP', label: 'Japan (YYYY/MM/DD)' },
  { code: 'de-DE', label: 'Germany (DD.MM.YYYY)' },
  { code: 'fr-FR', label: 'France (DD/MM/YYYY)' },
];