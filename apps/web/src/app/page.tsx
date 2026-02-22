'use client';

import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import {
    Shield, Zap, DollarSign, ArrowRight, CheckCircle2, Lock, Users,
} from 'lucide-react';

export default function Home() {
    const { t, lang, toggle } = useLang();

    return (
        <div className="min-h-screen bg-[#09090b] text-white overflow-hidden">
            {/* Navbar */}
            <nav className="border-b border-white/[0.04] bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
                    <Link href="/" className="font-display text-lg font-bold tracking-tight">
                        Quick<span className="text-gold">Job</span>
                    </Link>
                    <div className="flex items-center gap-2 md:gap-3">
                        <button onClick={toggle}
                            className="px-2 py-1 text-[10px] font-bold border border-white/10 rounded bg-white/[0.03] text-zinc-400 uppercase tracking-widest">
                            {lang === 'ru' ? 'EN' : 'RU'}
                        </button>
                        <Link href="/login" className="px-3 py-2 text-sm text-zinc-400 active:text-white">
                            {t('nav.signIn')}
                        </Link>
                        <Link href="/register"
                            className="px-4 py-2 bg-gold text-black font-bold rounded-xl text-sm active:scale-95">
                            {t('nav.getStarted')}
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero — simple & impactful */}
            <section className="relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-gold/[0.06] rounded-full blur-[120px] pointer-events-none" />
                <div className="max-w-4xl mx-auto px-5 pt-16 pb-16 md:pt-28 md:pb-24 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/[0.08] border border-gold/20 text-gold text-xs font-semibold mb-6">
                        <Shield size={12} />
                        {t('landing.badge')}
                    </div>

                    <h1 className="font-display text-3xl md:text-6xl font-black tracking-tight leading-[1.1] mb-5">
                        {t('landing.heroLine1')}<br />
                        <span className="bg-gradient-to-r from-gold via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                            {t('landing.heroLine2')}
                        </span>
                    </h1>

                    <p className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed px-2">
                        {t('landing.heroDesc')}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link href="/register"
                            className="w-full sm:w-auto px-8 py-3.5 bg-gold text-black font-extrabold rounded-2xl text-base active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                            {t('landing.startHiring')}
                            <ArrowRight size={18} />
                        </Link>
                        <Link href="/register"
                            className="w-full sm:w-auto px-8 py-3.5 bg-white/[0.04] border border-white/[0.08] text-white font-semibold rounded-2xl text-base text-center active:bg-white/[0.08]">
                            {t('landing.findWork')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="border-t border-white/[0.04]">
                <div className="max-w-5xl mx-auto px-5 py-16 md:py-28">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-2">{t('landing.howItWorks')}</h2>
                    <p className="text-zinc-500 text-center mb-10 text-sm md:text-base max-w-lg mx-auto">
                        {t('landing.howDesc')}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                        {[
                            { step: '01', icon: Zap, title: t('landing.step1Title'), desc: t('landing.step1Desc'), accent: 'text-blue-400', accentBg: 'bg-blue-500/10' },
                            { step: '02', icon: Users, title: t('landing.step2Title'), desc: t('landing.step2Desc'), accent: 'text-violet-400', accentBg: 'bg-violet-500/10' },
                            { step: '03', icon: Lock, title: t('landing.step3Title'), desc: t('landing.step3Desc'), accent: 'text-gold', accentBg: 'bg-gold/10' },
                            { step: '04', icon: DollarSign, title: t('landing.step4Title'), desc: t('landing.step4Desc'), accent: 'text-emerald-400', accentBg: 'bg-emerald-500/10' },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.step} className="bg-surface border border-white/[0.04] rounded-xl p-4 md:p-6">
                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${item.accentBg} flex items-center justify-center mb-3`}>
                                        <Icon size={18} className={item.accent} />
                                    </div>
                                    <div className="text-[10px] text-zinc-700 font-mono tracking-widest mb-1">{item.step}</div>
                                    <h3 className="font-display text-sm md:text-base font-semibold mb-1">{item.title}</h3>
                                    <p className="text-xs text-zinc-500 leading-relaxed hidden md:block">{item.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Trust */}
            <section className="border-t border-white/[0.04]">
                <div className="max-w-4xl mx-auto px-5 py-16 md:py-28">
                    <div className="bg-gradient-to-br from-gold/[0.06] to-amber-600/[0.03] border border-gold/[0.08] rounded-2xl p-8 md:p-16 text-center">
                        <Shield size={28} className="text-gold mx-auto mb-4" />
                        <h2 className="font-display text-xl md:text-3xl font-bold mb-3">{t('landing.trustTitle')}</h2>
                        <p className="text-zinc-400 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
                            {t('landing.trustDesc')}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                            {[t('landing.trustItem1'), t('landing.trustItem2'), t('landing.trustItem3')].map((item) => (
                                <span key={item} className="flex items-center gap-2 text-zinc-300 text-xs md:text-sm">
                                    <CheckCircle2 size={14} className="text-gold shrink-0" />
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/[0.04] py-6">
                <div className="max-w-5xl mx-auto px-5 flex flex-col md:flex-row justify-between items-center gap-3">
                    <span className="text-xs text-zinc-600">
                        © 2026 Quick<span className="text-gold">Job</span>. {t('landing.footer')}
                    </span>
                    <div className="flex items-center gap-5 text-xs text-zinc-600">
                        <Link href="/login" className="active:text-white">{t('nav.signIn')}</Link>
                        <Link href="/register" className="active:text-white">{t('nav.getStarted')}</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
