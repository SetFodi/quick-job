'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { getSupabase } from '@/lib/supabase';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import {
    Wallet, ArrowUpRight, Clock, CheckCircle2, ArrowDownLeft,
    Shield, Briefcase, Plus,
} from 'lucide-react';

type Transaction = {
    id: string;
    type: string;
    amount: string;
    referenceNote: string | null;
    milestoneId: string | null;
    createdAt: string;
};

type Milestone = { id: string; status: string };
type MyJob = {
    id: string;
    title: string;
    status: string;
    totalBudget: string;
    category: string;
    clientId: string;
    workerId: string | null;
    client: { fullName: string };
    worker: { fullName: string } | null;
    milestones: Milestone[];
};

const TX_ICONS: Record<string, { icon: typeof ArrowUpRight; color: string; sign: string }> = {
    DEPOSIT: { icon: ArrowDownLeft, color: 'text-emerald-400', sign: '+' },
    ESCROW_LOCK: { icon: Shield, color: 'text-blue-400', sign: '-' },
    RELEASE: { icon: ArrowUpRight, color: 'text-gold', sign: '+' },
    PLATFORM_FEE: { icon: CheckCircle2, color: 'text-violet-400', sign: '+' },
    REFUND: { icon: ArrowDownLeft, color: 'text-emerald-400', sign: '+' },
};

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    OPEN: { color: 'text-gold', bg: 'bg-gold/10' },
    ASSIGNED: { color: 'text-violet-400', bg: 'bg-violet-500/10' },
    IN_PROGRESS: { color: 'text-blue-400', bg: 'bg-blue-500/10' },
    COMPLETED: { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    DISPUTED: { color: 'text-red-400', bg: 'bg-red-500/10' },
};

function formatTimeAgo(dateString: string): string {
    const now = new Date();
    const then = new Date(dateString);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function formatTxType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function DashboardPage() {
    const { t, lang, toggle } = useLang();
    const [balance, setBalance] = useState<{ available: string; frozen: string } | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [myJobs, setMyJobs] = useState<MyJob[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: { session } } = await getSupabase().auth.getSession();
                if (session?.user?.id) setCurrentUserId(session.user.id);

                const [balanceData, txData, jobsData] = await Promise.all([
                    api.wallets.getBalance(),
                    api.wallets.getTransactions(),
                    api.jobs.getMine(),
                ]);
                setBalance(balanceData);
                setTransactions(txData);
                setMyJobs(jobsData);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const STATUS_LABELS: Record<string, string> = {
        OPEN: t('status.open'), ASSIGNED: t('status.assigned'),
        IN_PROGRESS: t('status.inProgress'), COMPLETED: t('status.completed'),
        DISPUTED: t('status.disputed'),
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in">
                    <div>
                        <h1 className="font-display text-3xl font-bold tracking-tight">{t('dash.title')}</h1>
                        <p className="text-zinc-500 mt-1">{t('dash.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={toggle}
                            className="px-3 py-1.5 text-xs font-bold border border-white/[0.06] rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-all text-zinc-500 uppercase tracking-widest">
                            {lang === 'ru' ? 'EN' : 'RU'}
                        </button>
                        <Link href="/jobs" className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                            {t('nav.browseJobs')}
                        </Link>
                        <Link href="/jobs/new"
                            className="px-5 py-2.5 bg-gold text-black font-bold rounded-xl hover:bg-gold-dim transition-all active:scale-95 text-sm flex items-center gap-2">
                            <Plus size={16} />{t('nav.postJob')}
                        </Link>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-surface border border-white/[0.04] p-6 rounded-2xl relative overflow-hidden group animate-in" style={{ animationDelay: '0.1s' }}>
                        <div className="absolute top-0 right-0 p-4 opacity-[0.04] group-hover:scale-110 transition-transform">
                            <Wallet size={80} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium mb-3">
                                <span className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg"><ArrowUpRight size={14} /></span>
                                {t('dash.available')}
                            </div>
                            {loading ? (
                                <div className="h-10 w-32 bg-white/[0.03] animate-pulse rounded-lg" />
                            ) : error ? (
                                <div className="text-red-400 text-sm">{error}</div>
                            ) : (
                                <div className="font-display text-4xl font-bold">${balance?.available || '0.00'}</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-surface border border-white/[0.04] p-6 rounded-2xl relative overflow-hidden group animate-in" style={{ animationDelay: '0.15s' }}>
                        <div className="absolute top-0 right-0 p-4 opacity-[0.04] group-hover:scale-110 transition-transform">
                            <Clock size={80} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium mb-3">
                                <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg"><Clock size={14} /></span>
                                {t('dash.frozen')}
                            </div>
                            {loading ? (
                                <div className="h-10 w-32 bg-white/[0.03] animate-pulse rounded-lg" />
                            ) : (
                                <div className="font-display text-4xl font-bold">${balance?.frozen || '0.00'}</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gold/[0.08] to-amber-700/[0.04] border border-gold/[0.08] p-6 rounded-2xl group cursor-pointer hover:shadow-[0_0_40px_rgba(245,158,11,0.08)] transition-all animate-in" style={{ animationDelay: '0.2s' }}>
                        <h3 className="font-display text-lg font-bold mb-2">{t('dash.secureTitle')}</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-6">{t('dash.secureDesc')}</p>
                        <div className="flex items-center gap-2 font-semibold text-gold">{t('dash.depositFunds')}</div>
                    </div>
                </div>

                {/* My Jobs */}
                <div className="space-y-4 animate-in" style={{ animationDelay: '0.25s' }}>
                    <h2 className="font-display text-xl font-bold flex items-center gap-2">
                        <Briefcase size={20} className="text-gold" />
                        {t('dash.myJobs')}
                    </h2>
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[0, 1].map(i => (
                                <div key={i} className="bg-surface border border-white/[0.04] rounded-2xl p-6 animate-pulse space-y-3">
                                    <div className="h-5 w-3/4 bg-white/[0.03] rounded" />
                                    <div className="h-3 w-1/2 bg-white/[0.03] rounded" />
                                    <div className="h-2 w-full bg-white/[0.03] rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : myJobs.length === 0 ? (
                        <div className="bg-surface border border-white/[0.04] rounded-2xl p-10 text-center">
                            <Briefcase size={32} className="text-zinc-700 mx-auto mb-3" />
                            <p className="text-zinc-600 italic">{t('dash.noJobs')}</p>
                            <div className="flex items-center justify-center gap-3 mt-4">
                                <Link href="/jobs" className="text-sm text-gold hover:text-gold-dim transition-colors font-semibold">{t('nav.browseJobs')}</Link>
                                <span className="text-zinc-700">·</span>
                                <Link href="/jobs/new" className="text-sm text-gold hover:text-gold-dim transition-colors font-semibold">{t('nav.postJob')}</Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myJobs.map((job) => {
                                const isMyClient = currentUserId === job.clientId;
                                const st = STATUS_COLORS[job.status] || STATUS_COLORS.OPEN;
                                const completedMs = job.milestones.filter(m => m.status === 'COMPLETED').length;
                                const totalMs = job.milestones.length;
                                const progress = totalMs > 0 ? (completedMs / totalMs) * 100 : 0;

                                return (
                                    <Link key={job.id} href={`/jobs/${job.id}`}
                                        className="bg-surface border border-white/[0.04] rounded-2xl p-6 hover:border-gold/20 hover:shadow-[0_0_30px_rgba(245,158,11,0.04)] transition-all group">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-display font-semibold text-base group-hover:text-gold transition-colors truncate">
                                                    {job.title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isMyClient ? 'bg-gold/10 text-gold' : 'bg-blue-500/10 text-blue-400'}`}>
                                                        {isMyClient ? t('dash.asClient') : t('dash.asWorker')}
                                                    </span>
                                                    <span className="text-xs text-zinc-700 capitalize">{job.category}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${st.bg} ${st.color}`}>
                                                    {STATUS_LABELS[job.status] || job.status}
                                                </span>
                                                <span className="text-sm font-bold text-gold">${job.totalBudget}</span>
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="mt-4">
                                            <div className="flex justify-between text-xs text-zinc-600 mb-1.5">
                                                <span>{completedMs}/{totalMs} {t('dash.milestonesDone')}</span>
                                                <span className="text-gold font-medium group-hover:translate-x-1 transition-transform">{t('dash.viewJob')}</span>
                                            </div>
                                            <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-gold to-amber-400 rounded-full transition-all duration-500"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Transactions */}
                <div className="bg-surface border border-white/[0.04] rounded-2xl overflow-hidden animate-in" style={{ animationDelay: '0.3s' }}>
                    <div className="p-6 border-b border-white/[0.04] flex justify-between items-center">
                        <h2 className="font-display text-lg font-bold">{t('dash.txHistory')}</h2>
                        <span className="text-sm text-zinc-600">{transactions.length} {t('dash.entries')}</span>
                    </div>
                    <div className="divide-y divide-white/[0.03]">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/[0.03] animate-pulse rounded-xl" />
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-white/[0.03] animate-pulse rounded" />
                                            <div className="h-3 w-48 bg-white/[0.03] animate-pulse rounded" />
                                        </div>
                                    </div>
                                    <div className="h-5 w-20 bg-white/[0.03] animate-pulse rounded" />
                                </div>
                            ))
                        ) : transactions.length === 0 ? (
                            <div className="p-12 text-center text-zinc-600 italic">{t('dash.noTx')}</div>
                        ) : (
                            transactions.map((tx) => {
                                const config = TX_ICONS[tx.type] || TX_ICONS.DEPOSIT;
                                const Icon = config.icon;
                                return (
                                    <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white/[0.03] rounded-xl">
                                                <Icon size={20} className={config.color} />
                                            </div>
                                            <div>
                                                <div className="font-semibold">{formatTxType(tx.type)}</div>
                                                <div className="text-zinc-600 text-sm">{tx.referenceNote || `Transaction ${tx.id.slice(0, 8)}`}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold ${config.sign === '+' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {config.sign}${tx.amount}
                                            </div>
                                            <div className="text-xs text-zinc-700">{formatTimeAgo(tx.createdAt)}</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
