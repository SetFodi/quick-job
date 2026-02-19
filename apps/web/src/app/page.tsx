import Link from 'next/link';
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
    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white overflow-hidden">
            {/* Navbar */}
            <nav className="border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="text-xl font-bold tracking-tight">
                        Quick<span className="text-emerald-400">Job</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/register"
                            className="px-5 py-2 bg-white text-black font-semibold rounded-xl text-sm hover:bg-gray-200 transition-all active:scale-95"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative">
                {/* Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-8">
                        <Shield size={12} />
                        Escrow-protected payments
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                        Work gets done.
                        <br />
                        <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            Payment guaranteed.
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Post a job, freeze the funds, get it done. Workers get paid only after you confirm.
                        No risk. No scams. Just results.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="group px-8 py-3.5 bg-white text-black font-bold rounded-2xl text-base hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-2"
                        >
                            Start Hiring
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/register"
                            className="px-8 py-3.5 bg-white/5 border border-white/10 text-white font-semibold rounded-2xl text-base hover:bg-white/10 transition-all"
                        >
                            Find Work
                        </Link>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="border-t border-white/5 bg-[#0c0c0e]">
                <div className="max-w-5xl mx-auto px-6 py-24">
                    <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
                    <p className="text-gray-400 text-center mb-16 max-w-lg mx-auto">
                        Simple, transparent, and secure. From posting to payout in 4 steps.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            {
                                step: '01',
                                icon: Zap,
                                title: 'Post a Job',
                                desc: 'Describe the work, set milestones and your budget.',
                                color: 'text-blue-400',
                                bg: 'bg-blue-500/10',
                            },
                            {
                                step: '02',
                                icon: Users,
                                title: 'Choose a Worker',
                                desc: 'Workers bid on your job. Pick the best fit.',
                                color: 'text-purple-400',
                                bg: 'bg-purple-500/10',
                            },
                            {
                                step: '03',
                                icon: Lock,
                                title: 'Freeze Funds',
                                desc: 'Money is locked in escrow. Worker can start safely.',
                                color: 'text-amber-400',
                                bg: 'bg-amber-500/10',
                            },
                            {
                                step: '04',
                                icon: DollarSign,
                                title: 'Confirm & Pay',
                                desc: 'Approve the work — payment releases instantly.',
                                color: 'text-emerald-400',
                                bg: 'bg-emerald-500/10',
                            },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.step}
                                    className="bg-[#141417] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group"
                                >
                                    <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                                        <Icon size={20} className={item.color} />
                                    </div>
                                    <div className="text-xs text-gray-600 font-mono mb-2">{item.step}</div>
                                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Trust section */}
            <section className="border-t border-white/5">
                <div className="max-w-4xl mx-auto px-6 py-24">
                    <div className="bg-gradient-to-br from-emerald-600/10 to-cyan-600/10 border border-emerald-500/10 rounded-3xl p-10 md:p-16 text-center">
                        <Shield size={40} className="text-emerald-400 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold mb-4">Built on trust</h2>
                        <p className="text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
                            Workers don&apos;t work without money on the table. Clients don&apos;t pay without results.
                            Our escrow system guarantees both sides are protected.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
                            {[
                                'Funds frozen until work is done',
                                'Only 5% platform commission',
                                'Full transaction history',
                            ].map((item) => (
                                <span key={item} className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-8">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <span className="text-sm text-gray-500">
                        © 2026 Quick<span className="text-emerald-500">Job</span>. All rights reserved.
                    </span>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                        <Link href="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link>
                        <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
                        <Link href="/register" className="hover:text-white transition-colors">Register</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
