import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ExpenseCard } from '../components/ExpenseCard';
import { ArrowUpRight, Plus, Calendar, TrendingUp, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, Tooltip as RechartsTooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

export const Dashboard: React.FC = () => {
  const { expenses, categories, budgets } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [convertedExpenses, setConvertedExpenses] = useState(expenses);
  const [isConverting, setIsConverting] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    const convert = async () => {
      if (!user?.currency) {
        setConvertedExpenses(expenses);
        return;
      }
      setIsConverting(true);
      try {
        const { convertExpenses } = await import('../services/currencyService');
        const converted = await convertExpenses(expenses, user.currency);
        setConvertedExpenses(converted);
      } catch (error) {
        console.error('Failed to convert expenses', error);
        setConvertedExpenses(expenses);
      } finally {
        setIsConverting(false);
      }
    };
    convert();
  }, [expenses, user?.currency]);

  const stats = useMemo(() => {
    const thisMonthExpenses = convertedExpenses.filter(e => e.date.startsWith(currentMonth));
    const total = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const count = thisMonthExpenses.length;

    // Sort by date desc
    const recent = [...convertedExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    // Highest spending category
    const categoryTotals = thisMonthExpenses.reduce((acc, curr) => {
      acc[curr.categoryId] = (acc[curr.categoryId] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    // Find highest category
    let maxCatId = '';
    let maxCatAmount = 0;
    Object.entries(categoryTotals).forEach(([id, amt]) => {
      const amount = amt as number;
      if (amount > maxCatAmount) {
        maxCatAmount = amount;
        maxCatId = id;
      }
    });
    const highestCategory = categories.find(c => c.id === maxCatId);

    // Monthly Trend Data
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const areaData = [];
    let runningTotal = 0;

    const expensesByDay = thisMonthExpenses.reduce((acc, curr) => {
      const day = parseInt(curr.date.split('-')[2]);
      acc[day] = (acc[day] || 0) + curr.amount;
      return acc;
    }, {} as Record<number, number>);

    for (let i = 1; i <= daysInMonth; i++) {
      const today = new Date().getDate();
      if (i > today) break;
      const dailyAmount = expensesByDay[i] || 0;
      runningTotal += dailyAmount;
      areaData.push({ day: i, amount: runningTotal, daily: dailyAmount });
    }

    // Last 7 Days Data
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTotal = convertedExpenses
        .filter(e => e.date === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);
      weeklyData.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        amount: dayTotal,
        fullDate: dateStr
      });
    }

    return { total, count, recent, areaData, weeklyData, highestCategory, maxCatAmount };
  }, [convertedExpenses, categories, currentMonth]);

  // Budget Progress Calculation
  const budgetAlerts = useMemo(() => {
    return budgets.map(b => {
      const catName = categories.find(c => c.id === b.categoryId)?.name || b.categoryId;
      const spent = convertedExpenses
        .filter(e => e.categoryId === b.categoryId && e.date.startsWith(currentMonth))
        .reduce((sum, e) => sum + e.amount, 0);
      const percent = Math.min((spent / b.limit) * 100, 100);
      return { ...b, catName, spent, percent };
    }).sort((a, b) => b.percent - a.percent); // Sort by highest usage
  }, [budgets, convertedExpenses, categories, currentMonth]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg dark:bg-bg-dark border border-border dark:border-border-dark p-2 rounded shadow-sm text-sm z-50">
          <p className="font-semibold text-text-DEFAULT dark:text-text-dark">{label || payload[0].name}</p>
          <p className="text-text-muted">
            {payload[0].value ? `${user?.currency === 'INR' ? '₹' : '$'}${payload[0].value.toFixed(2)}` : '0.00'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex justify-between items-end border-b border-border dark:border-border-dark pb-6">
        <div>
          <h2 className="text-3xl font-bold text-text-DEFAULT dark:text-text-dark tracking-tight">Dashboard</h2>
          <p className="text-text-muted mt-1">Overview for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
        <button
          onClick={() => navigate('/add')}
          className="md:hidden bg-text-DEFAULT dark:bg-white text-bg dark:text-black p-3 rounded-full shadow-lg"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Spent */}
        <div className="p-6 rounded-lg border border-border dark:border-border-dark bg-bg dark:bg-bg-dark flex flex-col justify-between shadow-sm">
          <div>
            <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">Total Spent</p>
            <h3 className="text-4xl font-bold text-text-DEFAULT dark:text-text-dark tracking-tight">
              {user?.currency === 'INR' ? '₹' : '$'}{stats.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="mt-4 flex items-center text-sm text-text-muted">
            <span className="bg-bg-subtle dark:bg-bg-subtle-dark px-2 py-0.5 rounded text-xs mr-2">{stats.count} txns</span>
            <span>in {new Date().toLocaleString('default', { month: 'short' })}</span>
          </div>
        </div>

        {/* Highest Category */}
        <div className="p-6 rounded-lg border border-border dark:border-border-dark bg-bg dark:bg-bg-dark flex flex-col justify-between shadow-sm">
          <div>
            <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">Top Category</p>
            <h3 className="text-2xl font-bold text-text-DEFAULT dark:text-text-dark truncate">
              {stats.highestCategory?.name || 'N/A'}
            </h3>
            <p className="text-lg text-text-muted mt-1">
              {user?.currency === 'INR' ? '₹' : '$'}{stats.maxCatAmount.toFixed(2)}
            </p>
          </div>
          <div className="mt-2 text-xs text-text-muted">
            Most spent category this month
          </div>
        </div>

        {/* Weekly Avg (Simple Calc) */}
        <div className="p-6 rounded-lg border border-border dark:border-border-dark bg-bg dark:bg-bg-dark flex flex-col justify-between shadow-sm">
          <div>
            <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">Last 7 Days</p>
            <h3 className="text-2xl font-bold text-text-DEFAULT dark:text-text-dark">
              {user?.currency === 'INR' ? '₹' : '$'}{stats.weeklyData.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
            </h3>
          </div>
          <div className="h-12 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyData}>
                <Bar dataKey="amount" fill={theme === 'dark' ? '#525252' : '#d4d4d4'} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart - Spending Trend */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={16} /> Monthly Spend Trend
            </h3>
          </div>
          <div className="h-[340px] w-full bg-bg-subtle/30 dark:bg-bg-subtle-dark/30 rounded-lg border border-border dark:border-border-dark p-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.areaData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme === 'dark' ? '#d4d4d4' : '#37352f'} stopOpacity={0.1} />
                    <stop offset="95%" stopColor={theme === 'dark' ? '#d4d4d4' : '#37352f'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#2f2f2f' : '#e9e9e8'} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9b9a97' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9b9a97' }} tickFormatter={(v) => `${user?.currency === 'INR' ? '₹' : '$'}${v}`} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#9b9a97', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={theme === 'dark' ? '#d4d4d4' : '#37352f'}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Daily Bar Chart & Budget Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Activity Bar Chart */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <Activity size={16} /> Daily Activity
          </h3>
          <div className="h-64 bg-bg-subtle/30 dark:bg-bg-subtle-dark/30 rounded-lg border border-border dark:border-border-dark p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#2f2f2f' : '#e9e9e8'} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9b9a97', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${user?.currency === 'INR' ? '₹' : '$'}${val}`} tick={{ fill: '#9b9a97', fontSize: 12 }} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: theme === 'dark' ? '#2f2f2f' : '#f7f7f5' }} />
                <Bar dataKey="amount" fill={theme === 'dark' ? '#d4d4d4' : '#37352f'} radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget List */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <Calendar size={16} /> Monthly Budgets
          </h3>
          <div className="h-64 overflow-y-auto pr-2 bg-bg-subtle/30 dark:bg-bg-subtle-dark/30 rounded-lg border border-border dark:border-border-dark p-4 custom-scrollbar">
            {budgetAlerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted">
                <p className="text-sm">No budgets set.</p>
                <button onClick={() => { }} className="text-xs text-primary mt-2 hover:underline">Add Budget</button>
              </div>
            ) : (
              <div className="space-y-5">
                {budgetAlerts.map(b => (
                  <div key={b.categoryId} className="group">
                    <div className="flex justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-DEFAULT dark:text-text-dark">{b.catName}</span>
                      </div>
                      <span className={`text-xs ${b.percent > 90 ? 'text-red-500 font-bold' : 'text-text-muted'}`}>
                        {user?.currency === 'INR' ? '₹' : '$'}{b.spent.toFixed(0)} / {user?.currency === 'INR' ? '₹' : '$'}{b.limit}
                      </span>
                    </div>
                    <div className="w-full bg-bg-subtle dark:bg-bg-subtle-dark rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${b.percent > 100 ? 'bg-red-500' : b.percent > 85 ? 'bg-yellow-500' : 'bg-primary'
                          }`}
                        style={{ width: `${b.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-end border-b border-border dark:border-border-dark pb-2">
          <h3 className="text-lg font-bold text-text-DEFAULT dark:text-text-dark">Recent Transactions</h3>
          <button onClick={() => navigate('/expenses')} className="text-xs font-medium text-text-muted hover:text-primary transition-colors">VIEW ALL</button>
        </div>
        <div>
          {stats.recent.length === 0 ? (
            <div className="py-12 text-center text-text-muted">
              <p>No transactions recorded yet.</p>
            </div>
          ) : (
            stats.recent.map(expense => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                category={categories.find(c => c.id === expense.categoryId)}
                onClick={() => navigate('/expenses')}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};