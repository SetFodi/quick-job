'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { Wallet, ArrowUpRight, Clock, CheckCircle2, ArrowDownLeft, Shield } from 'lucide-react';

type Transaction = {
    id: string;
    type: string;
    amount: string;
    referenceNote: string | null;
    milestoneId: string | null;
    createdAt: string;
};

const TX_ICONS: Record<string, { icon: typeof ArrowUpRight; color: string; sign: string }> = {
    DEPOSIT: { icon: ArrowDownLeft, color: 'text-emerald-400', sign: '+' },
    ESCROW_LOCK: { icon: Shield, color: 'text-blue-400', sign: '-' },
    RELEASE: { icon: ArrowUpRight, color: 'text-gold', sign: '+' },
    PLATFORM_FEE: { icon: CheckCircle2, color: 'text-violet-400', sign: '+' },
    REFUND: { icon: ArrowDownLeft, color: 'text-emerald-400', sign: '+' },
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [balanceData, txData] = await Promise.all([
                    api.wallets.getBalance(),
                    api.wallets.getTransactions(),
                ]);
                setBalance(balanceData);
                setTransactions(txData);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in">
                    <div>
                        <h1 className="font-display text-3xl font-bold tracking-tight">
                            {t('dash.title')}
                        </h1>
                        <p className="text-zinc-500 mt-1">{t('dash.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={toggle}
                            className="px-3 py-1.5 text-xs font-bold border border-white/[0.06] rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-all text-zinc-500 uppercase tracking-widest">
                            {lang === 'ru' ? 'EN' : 'RU'}
                        </button>
                        <Link href="/jobs"
                            className="px-5 py-2.5 bg-gold text-black font-bold rounded-xl hover:bg-gold-dim transition-all active:scale-95 text-sm">
                            {t('nav.browseJobs')}
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

                {/* Transactions */}
                <div className="bg-surface border border-white/[0.04] rounded-2xl overflow-hidden animate-in" style={{ animationDelay: '0.25s' }}>
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
