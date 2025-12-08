import React from 'react';
import { Expense, Category } from '../types';
import {
  HelpCircle,
  Paperclip,
  ShoppingBag,
  Coffee,
  Car,
  Home,
  Utensils,
  Zap,
  ShoppingCart,
  Briefcase,
  HeartPulse
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ExpenseCardProps {
  expense: Expense;
  category?: Category;
  onClick: () => void;
}

// 2. Create a map of string keys to Icon components
// This prevents the bundler from including unused icons
const iconMap: Record<string, React.ElementType> = {
  // Constants based mapping (Capitalized from constants.ts)
  Utensils: Utensils,
  Car: Car,
  Home: Home,
  Zap: Zap,
  HeartPulse: HeartPulse,
  ShoppingCart: ShoppingCart,
  Briefcase: Briefcase,
  Coffee: Coffee,

  // Legacy lowercase mapping (keeping for backward compatibility)
  shopping: ShoppingCart,
  food: Coffee,
  transport: Car,
  housing: Home,
  utilities: Zap,
  restaurant: Utensils,
};

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, category, onClick }) => {
  const { user } = useAuth();

  // 3. Look up the icon from the map, fallback to HelpCircle
  const IconComponent = category && category.icon && iconMap[category.icon]
    ? iconMap[category.icon]
    : HelpCircle;

  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-4 py-3 border-b border-border dark:border-border-dark cursor-pointer hover:bg-bg-subtle dark:hover:bg-bg-subtle-dark px-2 rounded-md transition-colors -mx-2"
    >
      <div className={`h-8 w-8 rounded flex items-center justify-center shrink-0 ${category?.color || 'bg-gray-200 text-gray-600'} bg-opacity-10 text-opacity-100`}>
        <IconComponent size={16} className="text-current" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:justify-between gap-1">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-text-DEFAULT dark:text-text-dark truncate group-hover:underline decoration-text-muted/50 underline-offset-4 decoration-1">{expense.merchant}</h3>
          <p className="text-xs text-text-muted truncate">{expense.description || category?.name}</p>
        </div>

        <div className="flex items-center gap-4 md:text-right shrink-0">
          <span className="text-xs text-text-muted font-mono">{expense.date}</span>
          <span className="text-sm font-semibold text-text-DEFAULT dark:text-text-dark w-20 text-right">
            -{user?.currency === 'INR' ? '₹' : '$'}{expense.amount.toFixed(2)}
          </span>
        </div>
      </div>

      {expense.receiptUrl && (
        <Paperclip size={14} className="text-text-muted shrink-0" />
      )}
    </div>
  );
};