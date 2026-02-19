'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const justRegistered = searchParams.get('registered') === 'true';
    const { t, lang, toggle } = useLang();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const getAuthError = (message: string) => {
        if (lang === 'ru' && /[A-Za-z]/.test(message) && !/[А-Яа-я]/.test(message)) {
            return 'Не удалось войти. Проверьте email и пароль.';
        }
        return message;
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: authError } = await getSupabase().auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(getAuthError(authError.message));
            setLoading(false);
            return;
        }

        router.push('/dashboard');
    }

    return (
        <>
            {justRegistered && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/15 text-emerald-400 text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    {t('auth.registered')}
                </div>
            )}

            {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/15 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-1.5">
                        {t('auth.email')}
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-transparent transition-all"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-1.5">
                        {t('auth.password')}
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-transparent transition-all pr-11"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-gold hover:bg-gold-dim text-black font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            {t('auth.signingIn')}
                        </>
                    ) : (
                        t('auth.signInBtn')
                    )}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-600">
                {t('auth.noAccount')}{' '}
                <Link href="/register" className="text-gold hover:text-gold-dim transition-colors font-medium">
                    {t('auth.createOne')}
                </Link>
            </p>

            <div className="mt-4 text-center">
                <button
                    onClick={toggle}
                    className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors uppercase tracking-widest font-bold"
                >
                    {lang === 'ru' ? '🇬🇧 English' : '🇷🇺 Русский'}
                </button>
            </div>
        </>
    );
}

export default function LoginPage() {
    const { t, lang } = useLang();

    return (
        <>
            <div className="text-center mb-8 animate-in">
                <h1 className="font-display text-3xl font-bold text-white tracking-tight">
                    Quick<span className="text-gold">Job</span>
                </h1>
                <p className="text-zinc-500 mt-1 text-sm">{t('auth.subtitle')}</p>
            </div>

            <div className="bg-surface border border-white/[0.04] rounded-2xl p-8 shadow-2xl animate-in" style={{ animationDelay: '0.1s' }}>
                <h2 className="font-display text-xl font-semibold text-white mb-6">{t('auth.welcomeBack')}</h2>
                <Suspense fallback={<div className="text-zinc-600 text-center py-4">{lang === 'ru' ? 'Загрузка...' : 'Loading...'}</div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </>
    );
}
