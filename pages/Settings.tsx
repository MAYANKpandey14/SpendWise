
import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { User, Save, Upload, Trash2, Globe, DollarSign } from 'lucide-react';
import { CURRENCIES, REGIONS } from '../types';
import { uploadProfileImage } from '../services/storageService';

export const Settings: React.FC = () => {
  const { expenses } = useApp();
  const { user, updateUser, isLoading } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
    const [currency, setCurrency] = useState(user?.currency || 'INR');
  const [locale, setLocale] = useState(user?.locale || 'en-US');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [msg, setMsg] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteDataOpen, setIsDeleteDataOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const confirmUpdate = async () => {
    setIsUploading(true);
    let finalAvatar = avatar;
    
    // 1. Upload new image if selected
    if (selectedFile && user) {
        const publicUrl = await uploadProfileImage(selectedFile, user.id);
        if (publicUrl) {
            finalAvatar = publicUrl;
        }
    } else {
        // Auto-update avatar if name changed and current avatar is a generated one
        const isGenerated = !finalAvatar || finalAvatar.includes('ui-avatars.com');
        if (name !== user?.name && isGenerated) {
            finalAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000000&color=fff`;
        }
    }

    setAvatar(finalAvatar);

    // 2. Update Profile Data
    await updateUser({ name, avatar: finalAvatar, currency, locale });
    
    setIsUploading(false);
    setIsConfirmOpen(false);
    setMsg('Profile updated successfully.');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleClearData = () => {
    localStorage.removeItem('spendwise_expenses');
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-fade-in pb-12">
      <header className="border-b border-border dark:border-border-dark pb-6">
        <h2 className="text-3xl font-bold text-text-DEFAULT dark:text-text-dark tracking-tight">Settings</h2>
        <p className="text-text-muted mt-1">Manage your preferences and data</p>
      </header>

      {/* Profile Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
            <User className="text-text-DEFAULT dark:text-text-dark" size={20} />
            <h3 className="text-lg font-semibold text-text-DEFAULT dark:text-text-dark">Profile</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-bg-subtle dark:bg-bg-subtle-dark p-6 rounded-lg border border-border dark:border-border-dark space-y-6">
            
            {/* Avatar Upload */}
            <div className="flex items-center gap-6">
                <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border dark:border-border-dark bg-bg dark:bg-bg-dark">
                        {avatar ? (
                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-muted bg-bg dark:bg-bg-dark">
                                <User size={32} />
                            </div>
                        )}
                    </div>
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-white"
                    >
                        <Upload size={20} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>
                <div>
                    <h4 className="font-medium text-text-DEFAULT dark:text-text-dark">Profile Picture</h4>
                    <p className="text-xs text-text-muted mt-1">Click image to upload new photo.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                    label="Display Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                />
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Currency Selector */}
                 <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted dark:text-zinc-500">Currency</label>
                    <div className="relative">
                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <select 
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 rounded-md border border-border dark:border-border-dark bg-transparent text-text-DEFAULT dark:text-text-dark focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer hover:border-text-muted transition-colors"
                        >
                            {CURRENCIES.map(c => (
                                <option key={c.code} value={c.code} className="bg-bg dark:bg-bg-dark">{c.label} ({c.symbol})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Region Selector */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted dark:text-zinc-500">Region Format</label>
                    <div className="relative">
                        <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                         <select 
                            value={locale}
                            onChange={(e) => setLocale(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 rounded-md border border-border dark:border-border-dark bg-transparent text-text-DEFAULT dark:text-text-dark focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer hover:border-text-muted transition-colors"
                        >
                            {REGIONS.map(r => (
                                <option key={r.code} value={r.code} className="bg-bg dark:bg-bg-dark">{r.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
             </div>

            <div className="flex items-center justify-between pt-4 border-t border-border dark:border-border-dark">
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium h-5">{msg}</span>
                <Button type="submit" disabled={isLoading || isUploading} className="flex items-center gap-2">
                    <Save size={16} /> {isUploading ? 'Uploading...' : 'Save Changes'}
                </Button>
            </div>
        </form>
      </section>

      {/* Data Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
             <Trash2 className="text-red-500" size={20} />
            <h3 className="text-lg font-semibold text-text-DEFAULT dark:text-text-dark">Danger Zone</h3>
        </div>

        <div className="p-6 rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <span className="block font-medium text-text-DEFAULT dark:text-text-dark">Clear Local Data</span>
                    <span className="text-xs text-text-muted">Permanently remove {expenses.length} transaction records from this device.</span>
                </div>
                <Button variant="danger" size="sm" onClick={() => setIsDeleteDataOpen(true)}>Delete All</Button>
            </div>
        </div>
      </section>

       <div className="text-center text-xs text-text-muted pt-8">
           <p>SpendWise v1.0.1 &bull; {user?.email}</p>
       </div>

       <Modal 
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          title="Save Changes"
          description="Are you sure you want to update your profile settings?"
          onConfirm={confirmUpdate}
          confirmLabel="Save"
          isLoading={isLoading || isUploading}
       />

       <Modal 
          isOpen={isDeleteDataOpen}
          onClose={() => setIsDeleteDataOpen(false)}
          title="Clear All Data"
          description="This action cannot be undone. All your expenses will be permanently deleted from this device."
          onConfirm={handleClearData}
          confirmLabel="Delete Everything"
          confirmVariant="danger"
       />
    </div>
  );
};
