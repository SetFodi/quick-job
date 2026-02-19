'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const justRegistered = searchParams.get('registered') === 'true';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: authError } = await getSupabase().auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        router.push('/dashboard');
    }

    return (
        <>
            {justRegistered && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    Account created! Check your email to confirm, then sign in.
                </div>
            )}

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-brand-200 mb-1.5">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-brand-200 mb-1.5">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Your password"
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all pr-11"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        'Sign in'
                    )}
                </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-sm text-white/40">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-brand-400 hover:text-brand-300 transition-colors">
                    Create one
                </Link>
            </p>
        </>
    );
}

export default function LoginPage() {
    return (
        <>
            {/* Logo */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">Quick-Job</h1>
                <p className="text-brand-300 mt-1 text-sm">Secure freelance marketplace</p>
            </div>

            {/* Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                <h2 className="text-xl font-semibold text-white mb-6">Welcome back</h2>
                <Suspense fallback={<div className="text-white/40 text-center py-4">Loading...</div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </>
    );
}
