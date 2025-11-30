import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ExpenseCard } from '../components/ExpenseCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Search, Filter, Download, Trash2 } from 'lucide-react';

export const ExpenseList: React.FC = () => {
  const { expenses, categories, filters, setFilters, deleteExpense } = useApp();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Date Range
      if (filters.startDate && expense.date < filters.startDate) return false;
      if (filters.endDate && expense.date > filters.endDate) return false;

      // Category
      if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(expense.categoryId)) return false;

      // Search
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          expense.merchant.toLowerCase().includes(query) ||
          expense.description?.toLowerCase().includes(query)
        );
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, filters]);

  const handleExportCSV = () => {
    const headers = ["ID", "Date", "Merchant", "Category", "Amount", "Description"];
    const rows = filteredExpenses.map(e => [
      e.id,
      e.date,
      e.merchant,
      categories.find(c => c.id === e.categoryId)?.name || e.categoryId,
      e.amount.toFixed(2),
      `"${e.description || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteExpense(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in h-full flex flex-col">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border dark:border-border-dark pb-6">
        <div>
          <h2 className="text-3xl font-bold text-text-DEFAULT dark:text-text-dark tracking-tight">Expenses</h2>
          <p className="text-text-muted mt-1">History of all transactions</p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search merchant..."
              className="w-full pl-9 pr-4 py-2 rounded-md border border-border dark:border-border-dark bg-transparent text-text-DEFAULT dark:text-text-dark focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none placeholder:text-text-muted/60 transition-all text-sm"
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            />
          </div>
          <Button variant="outline" size="icon" title="Export CSV" onClick={handleExportCSV}>
            <Download size={16} />
          </Button>
        </div>
      </header>

      {/* Date Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {['all', 'thisMonth', 'lastMonth'].map(range => (
          <button
            key={range}
            onClick={() => {
              const now = new Date();
              let start = '';
              let end = '';

              if (range === 'thisMonth') {
                start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
              } else if (range === 'lastMonth') {
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
                end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
              }

              setFilters(prev => ({ ...prev, startDate: start, endDate: end }));
            }}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${(range === 'thisMonth' && filters.startDate && filters.startDate.includes(new Date().toISOString().slice(0, 7))) || (range === 'all' && !filters.startDate)
              ? 'bg-text-DEFAULT text-bg border-transparent dark:bg-white dark:text-black'
              : 'bg-transparent text-text-muted border-border dark:border-border-dark hover:bg-bg-subtle dark:hover:bg-bg-subtle-dark hover:text-text-DEFAULT'
              }`}
          >
            {range === 'all' ? 'All Time' : range === 'thisMonth' ? 'This Month' : 'Last Month'}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-1">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border dark:border-border-dark rounded-lg">
            <Filter className="text-text-muted mx-auto mb-3" size={24} />
            <h3 className="text-sm font-medium text-text-DEFAULT dark:text-text-dark">No results</h3>
            <p className="text-xs text-text-muted mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          filteredExpenses.map(expense => (
            <div key={expense.id} className="group relative pr-12 hover:bg-bg-subtle/50 dark:hover:bg-bg-subtle-dark/50 rounded-md transition-colors overflow-hidden">
              <ExpenseCard
                expense={expense}
                category={categories.find(c => c.id === expense.categoryId)}
                onClick={() => { }}
              />
              <div className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center bg-gradient-to-l from-bg dark:from-bg-dark to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(expense.id);
                  }}
                  className="text-text-muted hover:text-red-500 p-2 transform translate-x-4 group-hover:translate-x-0 transition-transform duration-300"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Expense"
        description="Are you sure you want to remove this expense record?"
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
      />
    </div>
  );
};