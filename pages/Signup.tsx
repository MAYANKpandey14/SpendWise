import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

export const Signup: React.FC = () => {
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }

    try {
      await signup(name, email, password);
      navigate('/');
    } catch (e) {
      setError('Failed to create account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg dark:bg-bg-dark transition-colors duration-200 font-sans">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 bg-primary rounded-md mx-auto flex items-center justify-center text-white font-bold text-lg mb-4 shadow-sm">S</div>
          <h2 className="text-2xl font-bold text-text-DEFAULT dark:text-text-dark tracking-tight">Create Account</h2>
          <p className="text-sm text-text-muted">Start tracking your expenses today</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md flex items-center text-sm border border-red-100 dark:border-red-900/30 animate-slide-up">
            <AlertCircle size={16} className="mr-2 shrink-0" />
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            type="text"
            required
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<User size={16} />}
          />
           <Input
            label="Email"
            type="email"
            required
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={16} />}
          />
          <Input
            label="Password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={16} />}
          />
          
          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-text-DEFAULT dark:text-text-dark hover:underline underline-offset-4 decoration-primary/50">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};