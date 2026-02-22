'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, getCacheEpoch } from '@/lib/api-client';
import { getSupabase } from '@/lib/supabase';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { useAuth } from '@/lib/useAuth';
import {
    Wallet, ArrowUpRight, Clock, CheckCircle2, ArrowDownLeft,
    Shield, Briefcase, ChevronRight,
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
    _count?: { proposals: number };
};

type DashboardSnapshot = {
    balance: { available: string; frozen: string } | null;
    transactions: Transaction[];
    myJobs: MyJob[];
    currentUserId: string | null;
    updatedAt: number;
    epoch: number;
};

const DASHBOARD_CACHE_TTL_MS = 30_000;
let dashboardSnapshot: DashboardSnapshot | null = null;

function validSnapshot() {
    return dashboardSnapshot && dashboardSnapshot.epoch === getCacheEpoch()
        ? dashboardSnapshot
        : null;
}

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

function formatTimeAgo(dateString: string, lang: 'ru' | 'en'): string {
    const now = new Date();
    const then = new Date(dateString);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return lang === 'ru' ? 'только что' : 'just now';
    if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        return lang === 'ru' ? `${minutes} мин назад` : `${minutes}m ago`;
    }
    if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return lang === 'ru' ? `${hours} ч назад` : `${hours}h ago`;
    }
    const days = Math.floor(diff / 86400);
    return lang === 'ru' ? `${days} дн назад` : `${days}d ago`;
}

export default function DashboardPage() {
    const { t, lang } = useLang();
    const { userRole } = useAuth();
    const snap = validSnapshot();
    const [balance, setBalance] = useState<{ available: string; frozen: string } | null>(
        snap?.balance ?? null,
    );
    const [transactions, setTransactions] = useState<Transaction[]>(
        snap?.transactions ?? [],
    );
    const [myJobs, setMyJobs] = useState<MyJob[]>(
        snap?.myJobs ?? [],
    );
    const [currentUserId, setCurrentUserId] = useState<string | null>(
        snap?.currentUserId ?? null,
    );
    const [loading, setLoading] = useState(!snap);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async (background = false) => {
        if (!background) setLoading(true);
        try {
            const { data: { session } } = await getSupabase().auth.getSession();
            const nextUserId = session?.user?.id ?? null;
            setCurrentUserId(nextUserId);

            const [balanceResult, txResult, jobsResult] = await Promise.allSettled([
                api.wallets.getBalance(),
                api.wallets.getTransactions(),
                api.jobs.getMine(),
            ]);

            const nextBalance = balanceResult.status === 'fulfilled'
                ? balanceResult.value
                : { available: '0.00', frozen: '0.00' };
            const nextTransactions = txResult.status === 'fulfilled' ? txResult.value : [];
            const nextJobs = jobsResult.status === 'fulfilled' ? jobsResult.value : [];

            dashboardSnapshot = {
                balance: nextBalance,
                transactions: nextTransactions,
                myJobs: nextJobs,
                currentUserId: nextUserId,
                updatedAt: Date.now(),
                epoch: getCacheEpoch(),
            };

            setBalance(nextBalance);
            setTransactions(nextTransactions);
            setMyJobs(nextJobs);

            const hasRealFailure = [balanceResult, txResult, jobsResult]
                .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
                .some((r) => !/wallet not found/i.test(r.reason instanceof Error ? r.reason.message : ''));
            setError(hasRealFailure ? (lang === 'ru' ? 'Часть данных временно недоступна' : 'Some data is temporarily unavailable') : null);
        } catch {
            setError(lang === 'ru' ? 'Не удалось загрузить данные' : 'Failed to fetch data');
        } finally {
            if (!background) setLoading(false);
        }
    }, [lang]);

    useEffect(() => {
        const cached = validSnapshot();
        const shouldBg = !!cached && Date.now() - cached.updatedAt < DASHBOARD_CACHE_TTL_MS;
        void fetchAll(shouldBg || !!cached);
        const onFocus = () => void fetchAll(true);
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [fetchAll]);

    const STATUS_LABELS: Record<string, string> = {
        OPEN: t('status.open'), ASSIGNED: t('status.assigned'),
        IN_PROGRESS: t('status.inProgress'), COMPLETED: t('status.completed'),
        DISPUTED: t('status.disputed'),
    };
    const TX_LABELS: Record<string, string> = {
        DEPOSIT: lang === 'ru' ? 'Пополнение' : 'Deposit',
        ESCROW_LOCK: lang === 'ru' ? 'Эскроу' : 'Escrow Lock',
        RELEASE: lang === 'ru' ? 'Выплата' : 'Release',
        PLATFORM_FEE: lang === 'ru' ? 'Комиссия' : 'Fee',
        REFUND: lang === 'ru' ? 'Возврат' : 'Refund',
    };

    const Skeleton = ({ className }: { className: string }) => (
        <div className={`bg-white/[0.03] animate-pulse rounded-lg ${className}`} />
    );

    return (
        <div className="min-h-screen bg-[#09090b] text-white px-4 py-5 md:px-12 md:py-10">
            <div className="max-w-5xl mx-auto space-y-5">

                {/* Balance — single clean card */}
                <div className="bg-surface border border-white/[0.04] rounded-xl p-4">
                    {loading ? <Skeleton className="h-10 w-32" /> : error ? (
                        <div className="text-red-400 text-sm">{error}</div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-zinc-500 text-xs mb-1">{t('dash.available')}</div>
                                <div className="font-display text-3xl font-bold">${balance?.available || '0.00'}</div>
                                {parseFloat(balance?.frozen || '0') > 0 && (
                                    <div className="text-xs text-blue-400 mt-1">{t('dash.frozen')}: ${balance?.frozen}</div>
                                )}
                            </div>
                            <Link href="/dashboard/deposit"
                                className="px-4 py-2.5 bg-gold text-black font-bold rounded-xl text-sm active:scale-95">
                                {lang === 'ru' ? 'Пополнить' : 'Top up'}
                            </Link>
                        </div>
                    )}
                </div>

                {/* My Jobs */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-display text-lg md:text-xl font-bold flex items-center gap-2">
                            <Briefcase size={18} className="text-gold" />
                            {t('dash.myJobs')}
                        </h2>
                        <Link href="/jobs" className="text-xs text-gold font-semibold">
                            {lang === 'ru' ? 'Все заказы' : 'Browse all'} →
                        </Link>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[0, 1].map(i => (
                                <div key={i} className="bg-surface border border-white/[0.04] rounded-xl p-4 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : myJobs.length === 0 ? (
                        <div className="bg-surface border border-white/[0.04] rounded-xl p-8 text-center">
                            <Briefcase size={28} className="text-zinc-700 mx-auto mb-2" />
                            <p className="text-zinc-600 text-sm">{t('dash.noJobs')}</p>
                            <div className="flex items-center justify-center gap-4 mt-3">
                                <Link href="/jobs" className="text-sm text-gold font-semibold">{t('nav.browseJobs')}</Link>
                                <Link href="/jobs/new" className="text-sm text-gold font-semibold">{t('nav.postJob')}</Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {myJobs.map((job) => {
                                const isMyClient = currentUserId === job.clientId;
                                const st = STATUS_COLORS[job.status] || STATUS_COLORS.OPEN;
                                const completedMs = job.milestones.filter(m => m.status === 'COMPLETED').length;
                                const totalMs = job.milestones.length;
                                const proposalCount = job._count?.proposals ?? 0;

                                return (
                                    <Link key={job.id} href={`/jobs/${job.id}`}
                                        className="flex items-center gap-3 bg-surface border border-white/[0.04] rounded-xl p-3.5 md:p-4 active:scale-[0.98] transition-all">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${isMyClient ? 'bg-gold/10 text-gold' : 'bg-blue-500/10 text-blue-400'}`}>
                                                    {isMyClient ? t('dash.asClient') : t('dash.asWorker')}
                                                </span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${st.bg} ${st.color}`}>
                                                    {STATUS_LABELS[job.status] || job.status}
                                                </span>
                                                {isMyClient && job.status === 'OPEN' && proposalCount > 0 && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-violet-500/10 text-violet-400">
                                                        {proposalCount} {lang === 'ru' ? 'заявок' : 'bids'}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-zinc-600">{completedMs}/{totalMs}</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-sm font-bold text-gold">${job.totalBudget}</div>
                                        </div>
                                        <ChevronRight size={16} className="text-zinc-700 shrink-0" />
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Transactions */}
                <div className="bg-surface border border-white/[0.04] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 md:px-6 md:py-4 border-b border-white/[0.04] flex justify-between items-center">
                        <h2 className="font-display text-base md:text-lg font-bold">{t('dash.txHistory')}</h2>
                        <span className="text-xs text-zinc-600">{transactions.length}</span>
                    </div>
                    <div className="divide-y divide-white/[0.03]">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-9 h-9 !rounded-lg" />
                                        <div className="space-y-1.5">
                                            <Skeleton className="h-3.5 w-20" />
                                            <Skeleton className="h-2.5 w-32" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-4 w-14" />
                                </div>
                            ))
                        ) : transactions.length === 0 ? (
                            <div className="px-4 py-10 text-center text-zinc-600 text-sm italic">{t('dash.noTx')}</div>
                        ) : (
                            transactions.slice(0, 20).map((tx) => {
                                const config = TX_ICONS[tx.type] || TX_ICONS.DEPOSIT;
                                const Icon = config.icon;
                                return (
                                    <div key={tx.id} className="px-4 py-3 md:px-5 md:py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2 bg-white/[0.03] rounded-lg shrink-0">
                                                <Icon size={16} className={config.color} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold">{TX_LABELS[tx.type] || tx.type}</div>
                                                <div className="text-zinc-600 text-xs truncate max-w-[200px] md:max-w-none">
                                                    {tx.referenceNote || `#${tx.id.slice(0, 8)}`}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <div className={`text-sm font-bold ${config.sign === '+' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {config.sign}${tx.amount}
                                            </div>
                                            <div className="text-[10px] text-zinc-700">{formatTimeAgo(tx.createdAt, lang)}</div>
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
