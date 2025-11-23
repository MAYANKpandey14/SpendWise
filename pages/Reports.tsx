import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../context/ThemeContext';

export const Reports: React.FC = () => {
  const { expenses, categories } = useApp();
  const { theme } = useTheme();

  // Aggregate by Category
  const categoryData = useMemo(() => {
    const agg: Record<string, number> = {};
    expenses.forEach(e => {
        agg[e.categoryId] = (agg[e.categoryId] || 0) + e.amount;
    });
    return Object.entries(agg).map(([key, value]) => ({
        name: categories.find(c => c.id === key)?.name || key,
        value: value,
        color: categories.find(c => c.id === key)?.color.replace('bg-', '') || 'gray'
    })).sort((a,b) => b.value - a.value);
  }, [expenses, categories]);

  // Aggregate by Day
  const dailyData = useMemo(() => {
      const data = [];
      for(let i=6; i>=0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const total = expenses
            .filter(e => e.date === dateStr)
            .reduce((sum, e) => sum + e.amount, 0);
          data.push({
              date: d.toLocaleDateString('en-US', { weekday: 'short' }),
              amount: total
          });
      }
      return data;
  }, [expenses]);

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
          <p className="font-semibold text-text-DEFAULT dark:text-text-dark">{label || payload[0].name}</p>
          <p className="text-text-muted">
             {payload[0].value ? `$${payload[0].value.toFixed(2)}` : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      <header className="border-b border-border dark:border-border-dark pb-6">
        <h2 className="text-3xl font-bold text-text-DEFAULT dark:text-text-dark tracking-tight">Analytics</h2>
        <p className="text-text-muted mt-1">Deep dive into your spending habits</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Spending by Category */}
          <div className="p-6 rounded-lg border border-border dark:border-border-dark bg-bg-subtle/30 dark:bg-bg-subtle-dark/30">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-6">By Category</h3>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              innerRadius={60}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                          >
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getColorHex(`bg-${entry.color}-500`)} />
                              ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {categoryData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-1.5 text-xs">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColorHex(`bg-${entry.color}-500`) }}></div>
                          <span className="text-text-muted">{entry.name}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* Daily Trend */}
           <div className="p-6 rounded-lg border border-border dark:border-border-dark bg-bg-subtle/30 dark:bg-bg-subtle-dark/30">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-6">Last 7 Days</h3>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#2f2f2f' : '#e9e9e8'} />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9b9a97', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} tick={{fill: '#9b9a97', fontSize: 12}} />
                          <Tooltip content={<CustomTooltip />} cursor={{fill: theme === 'dark' ? '#2f2f2f' : '#f7f7f5'}} />
                          <Bar dataKey="amount" fill={theme === 'dark' ? '#d4d4d4' : '#37352f'} radius={[4, 4, 0, 0]} barSize={32} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>
    </div>
  );
};