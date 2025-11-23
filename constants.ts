import { Category, Budget } from './types';
import { ShoppingCart, Utensils, Car, Home, Zap, HeartPulse, Briefcase, Coffee } from 'lucide-react';

export const CURRENCY = 'USD';

export const CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Dining', color: 'bg-orange-500', icon: 'Utensils' },
  { id: 'transport', name: 'Transportation', color: 'bg-blue-500', icon: 'Car' },
  { id: 'housing', name: 'Housing', color: 'bg-indigo-500', icon: 'Home' },
  { id: 'utilities', name: 'Utilities', color: 'bg-yellow-500', icon: 'Zap' },
  { id: 'health', name: 'Health', color: 'bg-red-500', icon: 'HeartPulse' },
  { id: 'shopping', name: 'Shopping', color: 'bg-pink-500', icon: 'ShoppingCart' },
  { id: 'work', name: 'Work', color: 'bg-slate-500', icon: 'Briefcase' },
  { id: 'entertainment', name: 'Entertainment', color: 'bg-purple-500', icon: 'Coffee' },
];

export const DEFAULT_BUDGETS: Budget[] = [
  { categoryId: 'food', limit: 500 },
  { categoryId: 'transport', limit: 200 },
  { categoryId: 'housing', limit: 1200 },
  { categoryId: 'shopping', limit: 300 },
];
