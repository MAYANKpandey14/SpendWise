
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';

export const UpdatePassword: React.FC = () => {
    const { updatePassword, isLoading } = useAuth();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            await updatePassword(password);
            setSuccess(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 3000);
        } catch (e: any) {
            setError(e.message || 'Failed to update password. Please try again.');
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-bg text-text-DEFAULT dark:bg-bg-dark dark:text-text-dark transition-colors duration-200 font-sans">
                <div className="w-full max-w-sm space-y-8 animate-fade-in text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Password Updated</h2>
                    <p className="text-text-muted">
                        Your password has been successfully updated. Redirecting you to the dashboard...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-bg text-text-DEFAULT dark:bg-bg-dark dark:text-text-dark transition-colors duration-200 font-sans">
            <div className="w-full max-w-sm space-y-8 animate-fade-in">
                <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-bold tracking-tight">Set New Password</h2>
                    <p className="text-sm text-text-muted">Please enter your new password below.</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md flex items-center text-sm border border-red-100 dark:border-red-900/30 animate-slide-up">
                        <AlertCircle size={16} className="mr-2 shrink-0" />
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <Input
                        label="New Password"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        icon={<Lock size={16} />}
                    />
                    <Input
                        label="Confirm Password"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        icon={<Lock size={16} />}
                    />

                    <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                        Update Password
                    </Button>
                </form>
            </div>
        </div>
    );
};
