import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, password?: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for persisted user session
    const storedUser = localStorage.getItem('spendwise_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    // Simulate Network Request
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real app, validation and backend call would happen here.
    if (!email || !password) {
        setIsLoading(false);
        throw new Error("Invalid credentials");
    }

    const mockUser: User = {
      id: '1',
      name: email.split('@')[0],
      email: email,
      avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=000000&color=fff`,
      currency: 'USD',
      locale: 'en-US'
    };
    
    setUser(mockUser);
    localStorage.setItem('spendwise_user', JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const signup = async (name: string, email: string, password?: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (!email || !password || !name) {
        setIsLoading(false);
        throw new Error("All fields are required");
    }

    const mockUser: User = {
      id: '1',
      name,
      email,
      avatar: `https://ui-avatars.com/api/?name=${name}&background=000000&color=fff`,
      currency: 'USD',
      locale: 'en-US'
    };
    
    setUser(mockUser);
    localStorage.setItem('spendwise_user', JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const googleLogin = async () => {
    setIsLoading(true);
    // Simulate Google OAuth Popup flow
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockUser: User = {
      id: 'google-uid-123',
      name: 'Google User',
      email: 'user@gmail.com',
      avatar: 'https://ui-avatars.com/api/?name=Google+User&background=2383e2&color=fff',
      currency: 'USD',
      locale: 'en-US'
    };
    
    setUser(mockUser);
    localStorage.setItem('spendwise_user', JSON.stringify(mockUser));
    setIsLoading(false);
  }

  const logout = () => {
    setUser(null);
    localStorage.removeItem('spendwise_user');
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('spendwise_user', JSON.stringify(updatedUser));
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, googleLogin, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};