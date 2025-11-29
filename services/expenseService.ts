
import { supabase } from './supabaseClient';
import { Expense } from '../types';
import { Database } from '../types/supabase';

type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type ExpenseUpdate = Database['public']['Tables']['expenses']['Update'];

// Helper to map DB snake_case to App camelCase
const mapFromDb = (dbExpense: ExpenseRow): Expense => ({
  id: dbExpense.id,
  amount: dbExpense.amount,
  currency: dbExpense.currency,
  categoryId: dbExpense.category_id,
  date: dbExpense.date,
  merchant: dbExpense.merchant,
  description: dbExpense.description || undefined,
  receiptUrl: dbExpense.receipt_url || undefined,
  createdAt: dbExpense.created_at,
});

// Helper to map App camelCase to DB snake_case
const mapToDb = (expense: Expense, userId: string): ExpenseInsert => ({
  id: expense.id,
  user_id: userId,
  amount: expense.amount,
  currency: expense.currency,
  category_id: expense.categoryId,
  date: expense.date,
  merchant: expense.merchant,
  description: expense.description || null,
  receipt_url: expense.receiptUrl || null,
  created_at: expense.createdAt,
});

export const fetchExpensesFromDb = async (): Promise<Expense[]> => {
  console.debug('fetchExpensesFromDb: starting');

  const timeoutMs = 7000;

  const supabasePromise = supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  // Timeout promise resolves to a sentinel response so we can handle gracefully
  const timeoutPromise = new Promise<any>(resolve => {
    const id = setTimeout(() => {
      clearTimeout(id);
      resolve({ data: null, error: new Error('Timeout fetching expenses') });
    }, timeoutMs);
  });

  const resp = (await Promise.race([supabasePromise, timeoutPromise])) as { data: ExpenseRow[] | null; error: any } | null;

  if (!resp) {
    console.warn('fetchExpensesFromDb: got no response, returning empty list');
    return [];
  }

  const { data, error } = resp;

  if (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }

  if (!data) {
    console.debug('fetchExpensesFromDb: no rows returned');
    return [];
  }

  console.debug(`fetchExpensesFromDb: fetched ${data.length} rows`);
  const rows = data as ExpenseRow[];
  return rows.map(mapFromDb);
};

export const createExpenseInDb = async (expense: Expense) => {
  // Cast to any to bypass SupabaseAuthClient type issues
  const userResp = await (supabase.auth as any).getUser();
  const user = userResp?.data?.user;
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('expenses')
    .insert(mapToDb(expense, user.id));

  if (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

export const updateExpenseInDb = async (expense: Expense) => {
  // Cast to any to bypass SupabaseAuthClient type issues
  const userResp = await (supabase.auth as any).getUser();
  const user = userResp?.data?.user;
  if (!user) throw new Error('User not authenticated');

  // Build an update payload matching the Update type (all fields optional)
  const payload: ExpenseUpdate = {
    user_id: user.id,
    amount: expense.amount,
    currency: expense.currency,
    category_id: expense.categoryId,
    date: expense.date,
    merchant: expense.merchant,
    description: expense.description ?? null,
    receipt_url: expense.receiptUrl ?? null,
    created_at: expense.createdAt,
  };

  const { error } = await supabase
    .from('expenses')
    .update(payload)
    .eq('id', expense.id);

  if (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

export const deleteExpenseInDb = async (id: string) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};
