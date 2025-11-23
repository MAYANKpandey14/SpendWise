import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Expense, Budget, FilterState, Category } from '../types';
import { CATEGORIES, DEFAULT_BUDGETS } from '../constants';

interface AppContextType {
  expenses: Expense[];
  categories: Category[];
  budgets: Budget[];
  filters: FilterState;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories] = useState<Category[]>(CATEGORIES);
  const [budgets] = useState<Budget[]>(DEFAULT_BUDGETS);
  const [isLoading, setIsLoading] = useState(true);

  // Initial Filter State
  const initialFilters: FilterState = {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
    endDate: new Date().toISOString().split('T')[0],
    categoryIds: [],
    searchQuery: '',
  };

  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Load from LocalStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const storedExpenses = localStorage.getItem('spendwise_expenses');
        if (storedExpenses) {
          setExpenses(JSON.parse(storedExpenses));
        } else {
            // Seed sample data if empty
            const sampleData: Expense[] = [
                { id: '1', amount: 12.50, currency: 'USD', categoryId: 'food', date: new Date().toISOString().split('T')[0], merchant: 'Starbucks', description: 'Morning coffee', createdAt: Date.now() },
                { id: '2', amount: 45.00, currency: 'USD', categoryId: 'transport', date: new Date().toISOString().split('T')[0], merchant: 'Uber', description: 'Ride to work', createdAt: Date.now() - 10000 },
                { id: '3', amount: 120.00, currency: 'USD', categoryId: 'shopping', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], merchant: 'Target', description: 'Groceries', createdAt: Date.now() - 86400000 },
            ];
            setExpenses(sampleData);
            localStorage.setItem('spendwise_expenses', JSON.stringify(sampleData));
        }
      } catch (e) {
        console.error("Failed to load local storage", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Save to LocalStorage whenever expenses change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('spendwise_expenses', JSON.stringify(expenses));
    }
  }, [expenses, isLoading]);

  const addExpense = useCallback((expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
  }, []);

  const updateExpense = useCallback((updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  return (
    <AppContext.Provider value={{
      expenses,
      categories,
      budgets,
      filters,
      setFilters,
      addExpense,
      updateExpense,
      deleteExpense,
      resetFilters,
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
