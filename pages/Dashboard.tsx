import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ExpenseCard } from '../components/ExpenseCard';
import { ArrowUpRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useTheme } from '../context/ThemeContext';

export const Dashboard: React.FC = () => {
  const { expenses, categories, budgets } = useApp();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const currentMonth = new Date().toISOString().slice(0, 7);

  const stats = useMemo(() => {
    const thisMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
    const total = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const count = thisMonthExpenses.length;
    
    // Sort by date desc
    const recent = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    // Pie Chart Data
    const categoryTotals = thisMonthExpenses.reduce((acc, curr) => {
      acc[curr.categoryId] = (acc[curr.categoryId] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(categoryTotals).map(([key, value]) => {
      const cat = categories.find(c => c.id === key);
      return { name: cat?.name || key, value, color: cat?.color.replace('bg-', '') || 'gray' };
    });

    // Line/Area Chart Data (Simulate daily accumulation for current month)
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const areaData = [];
    let runningTotal = 0;
    
    // Create a map of expenses by day
    const expensesByDay = thisMonthExpenses.reduce((acc, curr) => {
        const day = parseInt(curr.date.split('-')[2]);
        acc[day] = (acc[day] || 0) + curr.amount;
        return acc;
    }, {} as Record<number, number>);

    for (let i = 1; i <= daysInMonth; i++) {
        // Only go up to today if it's the current month
        const today = new Date().getDate();
        if (i > today) break;

        const dailyAmount = expensesByDay[i] || 0;
        runningTotal += dailyAmount;
        areaData.push({
            day: i,
            amount: runningTotal,
            daily: dailyAmount
        });
    }

    return { total, count, recent, pieData, areaData };
  }, [expenses, categories, currentMonth]);

  // Budget Progress Calculation
  const budgetAlerts = useMemo(() => {
    return budgets.map(b => {
      const catName = categories.find(c => c.id === b.categoryId)?.name || b.categoryId;
      const spent = expenses
        .filter(e => e.categoryId === b.categoryId && e.date.startsWith(currentMonth))
        .reduce((sum, e) => sum + e.amount, 0);
      const percent = Math.min((spent / b.limit) * 100, 100);
      return { ...b, catName, spent, percent };
    }).filter(b => b.percent > 0);
  }, [budgets, expenses, categories, currentMonth]);

  const getColorHex = (twClass: string) => {
      if(twClass.includes('orange')) return '#f97316';
      if(twClass.includes('blue')) return '#3b82f6';
      if(twClass.includes('indigo')) return '#6366f1';
      if(twClass.includes('yellow')) return '#eab308';
      if(twClass.includes('red')) return '#ef4444';
      if(twClass.includes('pink')) return '#ec4899';
      if(twClass.includes('purple')) return '#a855f7';
      if(twClass.includes('emerald')) return '#10b981';
      return '#94a3b8';
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg dark:bg-bg-dark border border-border dark:border-border-dark p-2 rounded shadow-sm text-sm">
          <p className="font-semibold text-text-DEFAULT dark:text-text-dark">{label ? `Day ${label}` : payload[0].name}</p>
          <p className="text-text-muted">
             {label ? `Total: $${payload[0].value.toFixed(2)}` : `$${payload[0].value.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-12 animate-fade-in">
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group p-6 rounded-lg border border-border dark:border-border-dark hover:bg-bg-subtle dark:hover:bg-bg-subtle-dark transition-colors relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">Total Spent</p>
            <h3 className="text-4xl font-bold text-text-DEFAULT dark:text-text-dark tracking-tight">${stats.total.toLocaleString()}</h3>
            <div className="mt-4 flex items-center text-sm text-emerald-600 dark:text-emerald-400">
               <ArrowUpRight size={16} className="mr-1" />
               <span>{stats.count} transactions</span>
            </div>
          </div>
        </div>

        {/* Budgets List */}
        <div className="p-6 rounded-lg border border-border dark:border-border-dark col-span-1 md:col-span-2">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Budget Status</h3>
          <div className="space-y-4">
            {budgetAlerts.length === 0 ? (
                <p className="text-text-muted text-sm italic">No active budgets with spending.</p>
            ) : (
                budgetAlerts.map(b => (
                <div key={b.categoryId} className="group">
                    <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-text-DEFAULT dark:text-text-dark">{b.catName}</span>
                    <span className={`text-xs ${b.percent > 90 ? 'text-red-500 font-bold' : 'text-text-muted'}`}>
                        ${b.spent.toFixed(0)} / ${b.limit}
                    </span>
                    </div>
                    <div className="w-full bg-bg-subtle dark:bg-bg-subtle-dark rounded-full h-1.5 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                            b.percent > 100 ? 'bg-red-500' : b.percent > 85 ? 'bg-yellow-500' : 'bg-primary'
                        }`} 
                        style={{ width: `${b.percent}%` }}
                    ></div>
                    </div>
                </div>
                ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Chart - Spending Trend */}
         <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Monthly Trend</h3>
            <div className="h-64 w-full bg-bg-subtle/30 dark:bg-bg-subtle-dark/30 rounded-lg border border-border dark:border-border-dark p-4">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.areaData}>
                        <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme === 'dark' ? '#d4d4d4' : '#37352f'} stopOpacity={0.1}/>
                                <stop offset="95%" stopColor={theme === 'dark' ? '#d4d4d4' : '#37352f'} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#2f2f2f' : '#e9e9e8'} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9b9a97'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9b9a97'}} tickFormatter={(v) => `$${v}`} />
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

         {/* Pie Chart */}
         <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Breakdown</h3>
            <div className="h-64 w-full bg-bg-subtle/30 dark:bg-bg-subtle-dark/30 rounded-lg border border-border dark:border-border-dark p-4 relative">
                 {stats.pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats.pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={4}
                                dataKey="value"
                                stroke="none"
                            >
                                {stats.pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getColorHex(`bg-${entry.color.split('-')[0]}-500`)} />
                                ))}
                            </Pie>
                            <RechartsTooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                 ) : (
                     <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">No data</div>
                 )}
            </div>
         </div>
      </div>

      {/* Recent Transactions */}
      <div className="space-y-4 pt-4">
          <div className="flex justify-between items-end border-b border-border dark:border-border-dark pb-2">
            <h3 className="text-lg font-bold text-text-DEFAULT dark:text-text-dark">Recent Activity</h3>
            <button onClick={() => navigate('/expenses')} className="text-xs font-medium text-text-muted hover:text-primary transition-colors">VIEW ALL</button>
          </div>
          <div>
            {stats.recent.length === 0 ? (
                 <div className="py-12 text-center text-text-muted">
                    <p>No transactions recorded.</p>
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