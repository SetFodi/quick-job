'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, Wrench, Loader2, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '@quick-job/shared';
import { getSupabase } from '@/lib/supabase';

export default function RegisterPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: authError } = await getSupabase().auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role,
                },
            },
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        router.push('/login?registered=true');
    }

    return (
        <>
            {/* Logo */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">Quick-Job</h1>
                <p className="text-brand-300 mt-1 text-sm">Secure freelance marketplace</p>
            </div>

            {/* Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                <h2 className="text-xl font-semibold text-white mb-6">Create your account</h2>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Role Selector */}
                    <div>
                        <label className="block text-sm font-medium text-brand-200 mb-3">
                            I want to...
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole(UserRole.CLIENT)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${role === UserRole.CLIENT
                                    ? 'border-brand-400 bg-brand-500/10 text-white'
                                    : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                                    }`}
                            >
                                <Briefcase size={24} />
                                <span className="text-sm font-medium">Hire talent</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole(UserRole.WORKER)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${role === UserRole.WORKER
                                    ? 'border-brand-400 bg-brand-500/10 text-white'
                                    : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                                    }`}
                            >
                                <Wrench size={24} />
                                <span className="text-sm font-medium">Find work</span>
                            </button>
                        </div>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-brand-200 mb-1.5">
                            Full name
                        </label>
                        <input
                            id="fullName"
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        />
                    </div>

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
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 8 characters"
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
                                Creating account...
                            </>
                        ) : (
                            'Create account'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="mt-6 text-center text-sm text-white/40">
                    Already have an account?{' '}
                    <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </>
    );
}
