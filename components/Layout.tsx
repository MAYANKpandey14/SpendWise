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

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/expenses', icon: Receipt, label: 'All Expenses' },
    { to: '/add', icon: Plus, label: 'Add Entry' },
    { to: '/reports', icon: PieChart, label: 'Analytics' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark flex flex-col md:flex-row font-sans text-sm">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-bg-subtle dark:bg-bg-subtle-dark border-r border-border dark:border-border-dark h-screen sticky top-0 z-20 transition-colors duration-300">
        <div className="p-4 flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white font-bold text-xs">S</div>
          <span className="font-semibold text-text-DEFAULT dark:text-text-dark tracking-tight">SpendWise</span>
        </div>

        {user && (
           <div className="px-4 pb-4">
             <div 
               onClick={() => navigate('/settings')}
               className="flex items-center gap-2 p-2 rounded hover:bg-[#dcdcdb] dark:hover:bg-[#2a2a2a] cursor-pointer transition-colors group"
             >
               {user.avatar ? (
                  <img src={user.avatar} alt="User" className="w-5 h-5 rounded-sm object-cover" />
               ) : (
                  <div className="w-5 h-5 rounded-sm bg-text-muted text-white flex items-center justify-center text-xs">
                      {user.name.charAt(0)}
                  </div>
               )}
               <span className="font-medium text-text-DEFAULT dark:text-text-dark truncate flex-1">{user.name}</span>
               <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
             </div>
           </div>
        )}
        
        <nav className="flex-1 px-2 space-y-0.5">
          <div className="px-2 py-1 text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            Menu
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-200
                ${isActive 
                  ? 'bg-[#dcdcdb] dark:bg-[#2a2a2a] text-text-DEFAULT dark:text-text-dark font-medium' 
                  : 'text-text-muted hover:bg-[#dcdcdb] dark:hover:bg-[#2a2a2a] hover:text-text-DEFAULT dark:hover:text-text-dark'
                }
              `}
            >
              <item.icon size={16} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border dark:border-border-dark space-y-2">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-text-muted hover:bg-[#dcdcdb] dark:hover:bg-[#2a2a2a] transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-text-muted hover:bg-[#ffebeb] hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
          >
             <LogOut size={16} />
             <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        <div className="max-w-5xl mx-auto p-4 md:p-10 md:pt-12 pb-24 md:pb-10">
            {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-subtle dark:bg-bg-subtle-dark border-t border-border dark:border-border-dark z-50 pb-safe transition-colors">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex flex-col items-center justify-center p-2 rounded-md transition-colors
                ${isActive ? 'text-primary' : 'text-text-muted'}
              `}
            >
               <item.icon size={20} strokeWidth={2} />
               {item.to === '/add' && <span className="sr-only">Add</span>}
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