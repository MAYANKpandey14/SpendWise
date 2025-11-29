import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, Plus, PieChart, Settings, Sun, Moon, LogOut, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Modal } from './ui/Modal';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Removed Analytics from navigation
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/expenses', icon: Receipt, label: 'All Expenses' },
    { to: '/add', icon: Plus, label: 'Add Entry' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark flex flex-col md:flex-row font-sans text-sm">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-bg-subtle dark:bg-bg-subtle-dark border-r border-border dark:border-border-dark h-screen sticky top-0 z-20 transition-colors duration-300">
        <div className="p-6 flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">S</div>
          <span className="font-bold text-lg text-text-DEFAULT dark:text-text-dark tracking-tight">SpendWise</span>
        </div>

        {user && (
           <div className="px-4 pb-6">
             <div 
               onClick={() => navigate('/settings')}
               className="flex items-center gap-3 p-3 rounded-lg bg-bg dark:bg-bg-dark border border-border dark:border-border-dark hover:border-primary/50 cursor-pointer transition-all group shadow-sm"
             >
               {user.avatar ? (
                  <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full object-cover ring-2 ring-bg dark:ring-bg-dark" />
               ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      {user.name.charAt(0)}
                  </div>
               )}
               <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-DEFAULT dark:text-text-dark truncate">{user.name}</p>
                  <p className="text-xs text-text-muted truncate">View Profile</p>
               </div>
               <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
             </div>
           </div>
        )}
        
        <nav className="flex-1 px-4 space-y-1">
          <div className="px-2 py-2 text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
            Menu
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                ${isActive 
                  ? 'bg-primary/10 text-primary font-semibold' 
                  : 'text-text-muted hover:bg-bg dark:hover:bg-bg-dark hover:text-text-DEFAULT dark:hover:text-text-dark'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={isActive ? 'text-primary' : ''} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border dark:border-border-dark space-y-1">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:bg-bg dark:hover:bg-bg-dark transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
          >
             <LogOut size={18} />
             <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-h-screen relative scroll-smooth">
        {/* Sticky Blur Header */}
        <div className="hidden md:block sticky top-0 z-30 h-16 w-full bg-bg/80 dark:bg-bg-dark/80 backdrop-blur-xl border-b border-border/40 dark:border-border-dark/40 transition-colors">
           {/* This area provides the blur effect over scrolling content */}
        </div>

        <div className="max-w-5xl mx-auto p-4 md:p-10 md:pt-8 pb-24 md:pb-10">
            {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg/90 dark:bg-bg-dark/90 backdrop-blur-lg border-t border-border dark:border-border-dark z-50 pb-safe transition-colors">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex flex-col items-center justify-center w-full h-full p-1 transition-colors
                ${isActive ? 'text-primary' : 'text-text-muted'}
              `}
            >
               {({ isActive }) => (
                  <>
                     <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                     <span className="text-[10px] font-medium mt-1">{item.label}</span>
                  </>
               )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Log out"
        description="Are you sure you want to log out of your account?"
        confirmLabel="Log out"
        confirmVariant="danger"
        onConfirm={handleLogout}
      />
    </div>
  );
};