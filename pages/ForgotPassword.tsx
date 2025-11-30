
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
    const { resetPassword, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await resetPassword(email);
            setIsSubmitted(true);
        } catch (e: any) {
            setError(e.message || 'Failed to send reset email. Please try again.');
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-bg text-text-DEFAULT dark:bg-bg-dark dark:text-text-dark transition-colors duration-200 font-sans">
                <div className="w-full max-w-sm space-y-8 animate-fade-in text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Check your email</h2>
                    <p className="text-text-muted">
                        We have sent a password reset link to <strong>{email}</strong>.
                    </p>
                    <div className="pt-4">
                        <Link to="/login">
                            <Button variant="outline" className="w-full">
                                Back to Sign In
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-bg text-text-DEFAULT dark:bg-bg-dark dark:text-text-dark transition-colors duration-200 font-sans">
            <div className="w-full max-w-sm space-y-8 animate-fade-in">
                <div className="space-y-2">
                    <Link to="/login" className="inline-flex items-center text-sm text-text-muted hover:text-primary transition-colors mb-4">
                        <ArrowLeft size={16} className="mr-1" /> Back to Login
                    </Link>
                    <h2 className="text-2xl font-bold tracking-tight">Reset Password</h2>
                    <p className="text-sm text-text-muted">Enter your email address and we'll send you a link to reset your password.</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md flex items-center text-sm border border-red-100 dark:border-red-900/30 animate-slide-up">
                        <AlertCircle size={16} className="mr-2 shrink-0" />
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <Input
                        label="Email"
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<Mail size={16} />}
                    />

                    <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                        Send Reset Link
                    </Button>
                </form>
            </div>
        </div>
    );
};
