'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';

const inputStyle = 'w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all text-base';

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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { data, error: authError } = await getSupabase().auth.signInWithPassword({ email, password });
        if (authError) {
            setError(lang === 'ru' ? 'Не удалось войти. Проверьте email и пароль.' : authError.message);
            setLoading(false);
            return;
        }
        const role = data.user?.user_metadata?.role;
        router.push(role === 'WORKER' ? '/jobs' : '/dashboard');
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

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('auth.email')}</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com" className={inputStyle} />
                </div>

                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('auth.password')}</label>
                    <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} required value={password}
                            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                            className={`${inputStyle} pr-12`} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 p-1">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gold text-black font-bold text-base active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 size={18} className="animate-spin" />{t('auth.signingIn')}</> : t('auth.signInBtn')}
                </button>
            </form>

            <p className="mt-5 text-center text-sm text-zinc-600">
                {t('auth.noAccount')}{' '}
                <Link href="/register" className="text-gold font-medium">{t('auth.createOne')}</Link>
            </p>

            <div className="mt-3 text-center">
                <button onClick={toggle} className="text-[10px] text-zinc-700 uppercase tracking-widest font-bold active:text-zinc-400">
                    {lang === 'ru' ? 'English' : 'Русский'}
                </button>
            </div>
        </>
    );
}

export default function LoginPage() {
    const { t, lang } = useLang();

    return (
        <>
            <div className="text-center mb-6">
                <h1 className="font-display text-2xl font-bold text-white">
                    Quick<span className="text-gold">Job</span>
                </h1>
                <p className="text-zinc-500 mt-0.5 text-xs">{t('auth.subtitle')}</p>
            </div>

            <div className="bg-surface border border-white/[0.04] rounded-xl p-5 md:p-8">
                <h2 className="font-display text-lg font-semibold text-white mb-5">{t('auth.welcomeBack')}</h2>
                <Suspense fallback={<div className="text-zinc-600 text-center py-4">{lang === 'ru' ? 'Загрузка...' : 'Loading...'}</div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </>
    );
}
