import React from 'react';
import { Expense, Category } from '../types';
import * as Icons from 'lucide-react';

interface ExpenseCardProps {
  expense: Expense;
  category?: Category;
  onClick: () => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, category, onClick }) => {
  // Dynamic Icon rendering
  const IconComponent = category ? (Icons[category.icon as keyof typeof Icons] as React.ElementType) : Icons.HelpCircle;

  return (
    <div 
      onClick={onClick}
      className="group flex items-center gap-4 py-3 border-b border-border dark:border-border-dark cursor-pointer hover:bg-bg-subtle dark:hover:bg-bg-subtle-dark px-2 rounded-md transition-colors -mx-2"
    >
      <div className={`h-8 w-8 rounded flex items-center justify-center shrink-0 ${category?.color || 'bg-gray-200 text-gray-600'} bg-opacity-10 text-opacity-100`}>
        {/* We need to extract the color from bg-X-500 to text-X-600 roughly, or just use inline styles if we wanted perfect pastel matches like Notion. For now, we rely on the existing color props but use opacity. */}
        {IconComponent ? <IconComponent size={16} className="text-current" /> : <Icons.HelpCircle size={16} />}
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:justify-between gap-1">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-text-DEFAULT dark:text-text-dark truncate group-hover:underline decoration-text-muted/50 underline-offset-4 decoration-1">{expense.merchant}</h3>
          <p className="text-xs text-text-muted truncate">{expense.description || category?.name}</p>
        </div>
        
        <div className="flex items-center gap-4 md:text-right shrink-0">
          <span className="text-xs text-text-muted font-mono">{expense.date}</span>
          <span className="text-sm font-semibold text-text-DEFAULT dark:text-text-dark w-20 text-right">
            -${expense.amount.toFixed(2)}
          </span>
        </div>
      </div>
      
      {expense.receiptUrl && (
         <Icons.Paperclip size={14} className="text-text-muted shrink-0" />
      )}
    </div>
  );
};