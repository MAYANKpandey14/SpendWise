import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ExpenseFormData } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { analyzeReceipt } from '../services/geminiService';
import { Camera, X, ArrowLeft } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const AddExpense: React.FC = () => {
  const navigate = useNavigate();
  const { categories, addExpense } = useApp();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: 0,
    currency: user?.currency || 'INR',
    categoryId: 'food',
    date: new Date().toISOString().split('T')[0],
    merchant: '',
    description: '',
    receiptUrl: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setReceiptPreview(base64);
        setFormData(prev => ({ ...prev, receiptUrl: base64 }));
        
        // Auto-trigger scan
        await handleScanReceipt(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanReceipt = async (base64: string) => {
    setIsScanning(true);
    const result = await analyzeReceipt(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
    setIsScanning(false);

    if (result) {
      setFormData(prev => ({
        ...prev,
        ...result,
        receiptUrl: base64 // Ensure receipt stays
      }));
    } else {
        // analyzeReceipt returns null if key is missing or API fails
        // We can silently fail or show a toast, but keeping alert for MVP simplicity
        console.warn("Could not analyze receipt. Please fill manually.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const confirmAdd = () => {
    setIsConfirmOpen(false);
    setIsLoading(true);
    
    // Simulate network delay for better UX
    setTimeout(() => {
        addExpense({
            id: generateId(),
            createdAt: Date.now(),
            ...formData
        });
        setIsLoading(false);
        navigate('/expenses');
    }, 300);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center gap-4 mb-4 md:mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
        </Button>
        <h2 className="text-2xl font-bold text-text-DEFAULT dark:text-text-dark">New Entry</h2>
      </div>

      <div className="bg-bg-subtle dark:bg-bg-subtle-dark md:border border-border dark:border-border-dark p-4 md:p-8 rounded-lg transition-colors shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          
          {/* Receipt Section */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">Receipt</label>
            
            {!receiptPreview ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-border dark:border-border-dark bg-bg dark:bg-bg-dark rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-[#e0e0e0] dark:hover:bg-[#2a2a2a] transition-colors group"
              >
                <div className="bg-bg-subtle dark:bg-bg-subtle-dark p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <Camera className="text-text-muted" size={20} />
                </div>
                <p className="text-sm text-text-muted font-medium">Scan or Upload Receipt</p>
              </div>
            ) : (
               <div className="relative rounded-md overflow-hidden border border-border dark:border-border-dark bg-bg dark:bg-bg-dark group">
                   <img src={receiptPreview} alt="Receipt" className="max-h-64 w-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                   <button 
                    type="button"
                    onClick={() => {
                        setReceiptPreview(null);
                        setFormData(prev => ({ ...prev, receiptUrl: '' }));
                    }}
                    className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full shadow-sm hover:bg-black transition-colors"
                   >
                       <X size={16} />
                   </button>
                   {isScanning && (
                       <div className="absolute inset-0 bg-bg/80 dark:bg-bg-dark/80 flex items-center justify-center text-text-DEFAULT dark:text-text-dark font-medium backdrop-blur-sm animate-pulse">
                           AI Analyzing...
                       </div>
                   )}
               </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">Amount</label>
                <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-text-muted font-light text-lg">
                        {formData.currency === 'INR' ? '₹' : formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency}
                    </span>
                    <input 
                        required
                        type="number" 
                        step="0.01"
                        name="amount"
                        value={formData.amount || ''}
                        onChange={handleInputChange}
                        className="w-full pl-6 py-2 bg-transparent border-b border-border dark:border-border-dark text-2xl font-light text-text-DEFAULT dark:text-text-dark focus:outline-none focus:border-primary rounded-none transition-colors placeholder:text-text-muted/30"
                        placeholder="0.00"
                    />
                </div>
            </div>
            <Input 
                label="Date"
                required
                type="date" 
                name="date"
                value={formData.date}
                onChange={handleInputChange}
            />
          </div>

          <Input 
             label="Merchant Name"
             required
             type="text" 
             name="merchant"
             value={formData.merchant}
             onChange={handleInputChange}
             placeholder="e.g. Starbucks"
          />

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {categories.map(cat => (
                    <button
                        type="button"
                        key={cat.id}
                        onClick={() => setFormData(prev => ({ ...prev, categoryId: cat.id }))}
                        className={`
                            px-2 py-2 rounded-md text-sm font-medium transition-all duration-200 border text-center truncate
                            ${formData.categoryId === cat.id 
                                ? 'bg-text-DEFAULT text-bg border-transparent dark:bg-white dark:text-black shadow-sm' 
                                : 'bg-bg dark:bg-bg-dark border-border dark:border-border-dark text-text-muted hover:border-text-muted hover:text-text-DEFAULT dark:hover:text-text-dark'}
                        `}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">Notes</label>
            <textarea 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-border dark:border-border-dark bg-transparent text-text-DEFAULT dark:text-text-dark focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none placeholder:text-text-muted/50 text-sm"
                placeholder="Add details..."
            />
          </div>

          <div className="pt-4">
            <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                isLoading={isLoading}
            >
                Review & Save
            </Button>
          </div>
        </form>
      </div>
      
      <Modal 
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          title="Confirm Entry"
          description={`Are you sure you want to add this expense of ${formData.amount} at ${formData.merchant}?`}
          onConfirm={confirmAdd}
          confirmLabel="Add Expense"
          isLoading={isLoading}
       />
    </div>
  );
};