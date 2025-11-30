import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

export const Signup: React.FC = () => {
  const { signup, googleLogin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Failed to create account. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
      navigate('/dashboard');
    } catch (e) {
      setError('Google login failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg text-text-DEFAULT dark:bg-bg-dark dark:text-text-dark transition-colors duration-200 font-sans">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 bg-primary rounded-md mx-auto flex items-center justify-center text-white font-bold text-lg mb-4 shadow-sm">S</div>
          <h2 className="text-2xl font-bold tracking-tight">Create Account</h2>
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

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border dark:border-border-dark"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wide">
            <span className="px-2 bg-bg dark:bg-bg-dark text-text-muted">Or continue with</span>
          </div>
        </div>

        <Button variant="outline" className="w-full relative bg-white dark:bg-transparent text-black dark:text-white" onClick={handleGoogleLogin} isLoading={isLoading}>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </div>
          <span className="ml-4">Google</span>
        </Button>

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