'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, Wrench, Loader2, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '@quick-job/shared';
import { getSupabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';

export default function RegisterPage() {
    const router = useRouter();
    const { t, lang, toggle } = useLang();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const getAuthError = (message: string) => {
        if (lang === 'ru' && /[A-Za-z]/.test(message) && !/[А-Яа-я]/.test(message)) {
            return 'Не удалось создать аккаунт. Проверьте данные и попробуйте снова.';
        }
        return message;
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: authError } = await getSupabase().auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName, role },
            },
        });

        if (authError) {
            setError(getAuthError(authError.message));
            setLoading(false);
            return;
        }

        router.push('/login?registered=true');
    }

    return (
        <>
            <div className="text-center mb-8 animate-in">
                <h1 className="font-display text-3xl font-bold text-white tracking-tight">
                    Quick<span className="text-gold">Job</span>
                </h1>
                <p className="text-zinc-500 mt-1 text-sm">{t('auth.subtitle')}</p>
            </div>

            <div className="bg-surface border border-white/[0.04] rounded-2xl p-8 shadow-2xl animate-in" style={{ animationDelay: '0.1s' }}>
                <h2 className="font-display text-xl font-semibold text-white mb-6">{t('auth.createAccount')}</h2>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/15 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Role Selector */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-3">{t('auth.iWantTo')}</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole(UserRole.CLIENT)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${role === UserRole.CLIENT
                                    ? 'border-gold bg-gold/[0.06] text-white'
                                    : 'border-white/[0.06] bg-white/[0.02] text-zinc-600 hover:border-white/[0.1]'
                                    }`}
                            >
                                <Briefcase size={24} />
                                <span className="text-sm font-semibold">{t('auth.hireTalent')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole(UserRole.WORKER)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${role === UserRole.WORKER
                                    ? 'border-gold bg-gold/[0.06] text-white'
                                    : 'border-white/[0.06] bg-white/[0.02] text-zinc-600 hover:border-white/[0.1]'
                                    }`}
                            >
                                <Wrench size={24} />
                                <span className="text-sm font-semibold">{t('auth.findWorkRole')}</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-zinc-400 mb-1.5">{t('auth.fullName')}</label>
                        <input id="fullName" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-1.5">{t('auth.email')}</label>
                        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-1.5">{t('auth.password')}</label>
                        <div className="relative">
                            <input id="password" type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-transparent transition-all pr-11"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                        className="w-full py-2.5 px-4 rounded-xl bg-gold hover:bg-gold-dim text-black font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {loading ? (<><Loader2 size={18} className="animate-spin" />{t('auth.creating')}</>) : t('auth.createBtn')}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-zinc-600">
                    {t('auth.haveAccount')}{' '}
                    <Link href="/login" className="text-gold hover:text-gold-dim transition-colors font-medium">{t('auth.signInLink')}</Link>
                </p>

                <div className="mt-4 text-center">
                    <button onClick={toggle} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors uppercase tracking-widest font-bold">
                        {lang === 'ru' ? '🇬🇧 English' : '🇷🇺 Русский'}
                    </button>
                </div>
            </div>
        </>
    );
}
