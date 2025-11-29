import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Expense, Budget, FilterState, Category } from '../types';
import { CATEGORIES, DEFAULT_BUDGETS } from '../constants';
import { fetchExpensesFromDb, createExpenseInDb, updateExpenseInDb, deleteExpenseInDb } from '../services/expenseService';
import { useAuth } from './AuthContext';

interface SyncOperation {
  type: 'ADD' | 'UPDATE' | 'DELETE';
  payload: any;
  id: string; // The expense ID
  timestamp: number;
}

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
  isSyncing: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories] = useState<Category[]>(CATEGORIES);
  const [budgets] = useState<Budget[]>(DEFAULT_BUDGETS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncQueue, setSyncQueue] = useState<SyncOperation[]>([]);

  // Initial Filter State
  const initialFilters: FilterState = {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
    endDate: new Date().toISOString().split('T')[0],
    categoryIds: [],
    searchQuery: '',
  };

  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Load Sync Queue from LocalStorage
  useEffect(() => {
    const storedQueue = localStorage.getItem('spendwise_sync_queue');
    if (storedQueue) {
      try {
        setSyncQueue(JSON.parse(storedQueue));
      } catch (e) {
        console.error("Failed to parse sync queue", e);
      }
    }
  }, []);

  // Persist Sync Queue to LocalStorage
  useEffect(() => {
    localStorage.setItem('spendwise_sync_queue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  // Load Data Strategy:
  // 1. Load from LocalStorage immediately for speed (Offline first).
  // 2. If User is logged in, fetch from Supabase.
  // 3. Update State & LocalStorage with fresh data from DB.

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Local Load
        const storedExpenses = localStorage.getItem('spendwise_expenses');
        if (storedExpenses) {
          setExpenses(JSON.parse(storedExpenses));
        }

        // 2. Remote Fetch (Sync)
        if (user) {
          const dbExpenses = await fetchExpensesFromDb();
          if (dbExpenses && dbExpenses.length > 0) {
            // Merge logic: For simplicity in this demo, DB is source of truth if it exists.
            setExpenses(dbExpenses);
            localStorage.setItem('spendwise_expenses', JSON.stringify(dbExpenses));
          }
        }
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Process Sync Queue
  const processSyncQueue = useCallback(async () => {
    if (syncQueue.length === 0 || !user || !navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    const newQueue = [...syncQueue];
    const successfulIds: string[] = [];

    // Sort queue by timestamp to ensure operations happen in order
    newQueue.sort((a, b) => a.timestamp - b.timestamp);

    for (const op of newQueue) {
      try {
        if (op.type === 'ADD') {
           await createExpenseInDb(op.payload);
        } else if (op.type === 'UPDATE') {
           await updateExpenseInDb(op.payload);
        } else if (op.type === 'DELETE') {
           await deleteExpenseInDb(op.id);
        }
        successfulIds.push(op.id + op.type + op.timestamp); // Unique identifier for operation
      } catch (error) {
        console.error(`Failed to sync operation ${op.type} for ${op.id}`, error);
        // If error is persistent (e.g., auth failed), maybe break.
        // For transient network errors, we leave it in queue.
      }
    }

    // Remove successful operations from queue
    if (successfulIds.length > 0) {
        setSyncQueue(prev => prev.filter(op => !successfulIds.includes(op.id + op.type + op.timestamp)));
    }
    
    setIsSyncing(false);
  }, [syncQueue, user, isSyncing]);

  // Listen for online status to trigger sync
  useEffect(() => {
    const handleOnline = () => {
      console.log("App is online, processing sync queue...");
      processSyncQueue();
    };
    
    window.addEventListener('online', handleOnline);
    
    // Attempt sync immediately if queue exists and we are online
    if (navigator.onLine && syncQueue.length > 0) {
        processSyncQueue();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, [processSyncQueue, syncQueue.length]);


  // CRUD Operations
  // Strategy: Optimistic UI Update -> LocalStorage Update -> Async DB Update (with Queue)

  const addExpense = useCallback(async (expense: Expense) => {
    // 1. Optimistic Update
    setExpenses(prev => {
        const updated = [expense, ...prev];
        localStorage.setItem('spendwise_expenses', JSON.stringify(updated));
        return updated;
    });

    // 2. DB Update / Queue
    if (user) {
        try {
            if (navigator.onLine) {
                await createExpenseInDb(expense);
            } else {
                throw new Error("Offline");
            }
        } catch (error) {
            console.log("Network/DB Error, queuing ADD operation");
            setSyncQueue(prev => [...prev, { type: 'ADD', payload: expense, id: expense.id, timestamp: Date.now() }]);
        }
    }
  }, [user]);

  const updateExpense = useCallback(async (updatedExpense: Expense) => {
    // 1. Optimistic Update
    setExpenses(prev => {
        const updated = prev.map(e => e.id === updatedExpense.id ? updatedExpense : e);
        localStorage.setItem('spendwise_expenses', JSON.stringify(updated));
        return updated;
    });

    // 2. DB Update / Queue
    if (user) {
        try {
             if (navigator.onLine) {
                await updateExpenseInDb(updatedExpense);
             } else {
                 throw new Error("Offline");
             }
        } catch (error) {
             console.log("Network/DB Error, queuing UPDATE operation");
             setSyncQueue(prev => [...prev, { type: 'UPDATE', payload: updatedExpense, id: updatedExpense.id, timestamp: Date.now() }]);
        }
    }
  }, [user]);

  const deleteExpense = useCallback(async (id: string) => {
    // 1. Optimistic Update
    setExpenses(prev => {
        const updated = prev.filter(e => e.id !== id);
        localStorage.setItem('spendwise_expenses', JSON.stringify(updated));
        return updated;
    });

    // 2. DB Update / Queue
    if (user) {
        try {
            if (navigator.onLine) {
                await deleteExpenseInDb(id);
            } else {
                throw new Error("Offline");
            }
        } catch (error) {
            console.log("Network/DB Error, queuing DELETE operation");
            setSyncQueue(prev => [...prev, { type: 'DELETE', payload: null, id, timestamp: Date.now() }]);
        }
    }
  }, [user]);

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
      isLoading,
      isSyncing
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