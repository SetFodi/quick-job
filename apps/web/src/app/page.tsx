'use client';

import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import {
    Shield,
    Zap,
    DollarSign,
    ArrowRight,
    CheckCircle2,
    Lock,
    Users,
} from 'lucide-react';

export default function Home() {
    const { t, lang, toggle } = useLang();

    return (
        <div className="min-h-screen bg-[#09090b] text-white overflow-hidden">
            {/* Navbar */}
            <nav className="border-b border-white/[0.04] bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="font-display text-xl font-bold tracking-tight">
                        Quick<span className="text-gold">Job</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggle}
                            className="px-3 py-1.5 text-xs font-bold border border-white/10 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-all text-zinc-400 uppercase tracking-widest"
                        >
                            {lang === 'ru' ? 'EN' : 'RU'}
                        </button>
                        <Link
                            href="/login"
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                            {t('nav.signIn')}
                        </Link>
                        <Link
                            href="/register"
                            className="px-5 py-2 bg-gold hover:bg-gold-dim text-black font-bold rounded-xl text-sm transition-all active:scale-95"
                        >
                            {t('nav.getStarted')}
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative">
                {/* Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gold/[0.07] rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-amber-600/[0.04] rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-4xl mx-auto px-6 pt-28 pb-24 text-center relative z-10">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/[0.08] border border-gold/20 text-gold text-xs font-semibold mb-8 animate-in"
                        style={{ animationDelay: '0.1s' }}
                    >
                        <Shield size={12} />
                        {t('landing.badge')}
                    </div>

                    <h1
                        className="font-display text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6 animate-in"
                        style={{ animationDelay: '0.2s' }}
                    >
                        {t('landing.heroLine1')}
                        <br />
                        <span className="bg-gradient-to-r from-gold via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                            {t('landing.heroLine2')}
                        </span>
                    </h1>

                    <p
                        className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-in"
                        style={{ animationDelay: '0.3s' }}
                    >
                        {t('landing.heroDesc')}
                    </p>

                    <div
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in"
                        style={{ animationDelay: '0.4s' }}
                    >
                        <Link
                            href="/register"
                            className="group px-8 py-3.5 bg-gold hover:bg-gold-dim text-black font-extrabold rounded-2xl text-base transition-all active:scale-95 flex items-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                        >
                            {t('landing.startHiring')}
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/register"
                            className="px-8 py-3.5 bg-white/[0.04] border border-white/[0.08] text-white font-semibold rounded-2xl text-base hover:bg-white/[0.08] transition-all"
                        >
                            {t('landing.findWork')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="border-t border-white/[0.04]">
                <div className="max-w-5xl mx-auto px-6 py-28">
                    <h2 className="font-display text-3xl font-bold text-center mb-3">{t('landing.howItWorks')}</h2>
                    <p className="text-zinc-500 text-center mb-16 max-w-lg mx-auto">
                        {t('landing.howDesc')}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        {[
                            { step: '01', icon: Zap, title: t('landing.step1Title'), desc: t('landing.step1Desc'), accent: 'text-blue-400', accentBg: 'bg-blue-500/10' },
                            { step: '02', icon: Users, title: t('landing.step2Title'), desc: t('landing.step2Desc'), accent: 'text-violet-400', accentBg: 'bg-violet-500/10' },
                            { step: '03', icon: Lock, title: t('landing.step3Title'), desc: t('landing.step3Desc'), accent: 'text-gold', accentBg: 'bg-gold/10' },
                            { step: '04', icon: DollarSign, title: t('landing.step4Title'), desc: t('landing.step4Desc'), accent: 'text-emerald-400', accentBg: 'bg-emerald-500/10' },
                        ].map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.step}
                                    className="bg-surface border border-white/[0.04] rounded-2xl p-6 hover:border-white/[0.08] transition-all group animate-in"
                                    style={{ animationDelay: `${0.5 + i * 0.1}s` }}
                                >
                                    <div className={`w-10 h-10 rounded-xl ${item.accentBg} flex items-center justify-center mb-4`}>
                                        <Icon size={20} className={item.accent} />
                                    </div>
                                    <div className="text-[10px] text-zinc-700 font-mono tracking-widest mb-2">{item.step}</div>
                                    <h3 className="font-display text-base font-semibold mb-2">{item.title}</h3>
                                    <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Trust */}
            <section className="border-t border-white/[0.04]">
                <div className="max-w-4xl mx-auto px-6 py-28">
                    <div className="bg-gradient-to-br from-gold/[0.06] to-amber-600/[0.03] border border-gold/[0.08] rounded-3xl p-10 md:p-16 text-center">
                        <Shield size={36} className="text-gold mx-auto mb-6" />
                        <h2 className="font-display text-3xl font-bold mb-4">{t('landing.trustTitle')}</h2>
                        <p className="text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
                            {t('landing.trustDesc')}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
                            {[t('landing.trustItem1'), t('landing.trustItem2'), t('landing.trustItem3')].map((item) => (
                                <span key={item} className="flex items-center gap-2 text-zinc-300">
                                    <CheckCircle2 size={15} className="text-gold shrink-0" />
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/[0.04] py-8">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <span className="text-sm text-zinc-600">
                        © 2026 Quick<span className="text-gold">Job</span>. {t('landing.footer')}
                    </span>
                    <div className="flex items-center gap-6 text-sm text-zinc-600">
                        <Link href="/jobs" className="hover:text-white transition-colors">{t('nav.browseJobs')}</Link>
                        <Link href="/login" className="hover:text-white transition-colors">{t('nav.signIn')}</Link>
                        <Link href="/register" className="hover:text-white transition-colors">{t('nav.getStarted')}</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
