'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { Wallet, ArrowUpRight, Clock, CheckCircle2, ArrowDownLeft, Shield, AlertTriangle } from 'lucide-react';

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
    RELEASE: { icon: ArrowUpRight, color: 'text-amber-400', sign: '-' },
    PLATFORM_FEE: { icon: CheckCircle2, color: 'text-purple-400', sign: '+' },
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
        <div className="min-h-screen bg-[#0a0a0b] text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                            User Dashboard
                        </h1>
                        <p className="text-gray-400 mt-1">Manage your work and finances in one place.</p>
                    </div>
                    <Link
                        href="/jobs"
                        className="px-5 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all active:scale-95"
                    >
                        Browse Jobs
                    </Link>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Wallet Available */}
                    <div className="bg-[#141417] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Wallet size={80} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-3">
                                <span className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                                    <ArrowUpRight size={14} />
                                </span>
                                Available Balance
                            </div>
                            {loading ? (
                                <div className="h-10 w-32 bg-white/5 animate-pulse rounded-lg" />
                            ) : error ? (
                                <div className="text-red-400 text-sm">{error}</div>
                            ) : (
                                <div className="text-4xl font-bold">${balance?.available || '0.00'}</div>
                            )}
                        </div>
                    </div>

                    {/* Wallet Frozen */}
                    <div className="bg-[#141417] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Clock size={80} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-3">
                                <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                                    <Clock size={14} />
                                </span>
                                Escrow (Frozen)
                            </div>
                            {loading ? (
                                <div className="h-10 w-32 bg-white/5 animate-pulse rounded-lg" />
                            ) : error ? (
                                <div className="text-red-400 text-sm">{error}</div>
                            ) : (
                                <div className="text-4xl font-bold">${balance?.frozen || '0.00'}</div>
                            )}
                        </div>
                    </div>

                    {/* Action Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-emerald-600 p-6 rounded-3xl group cursor-pointer hover:shadow-[0_0_30px_rgba(52,211,153,0.2)] transition-all">
                        <h3 className="text-xl font-bold mb-2">Secure Payments</h3>
                        <p className="text-white/80 text-sm leading-relaxed mb-6">
                            All your funds are held in a secure escrow until work is completed and approved.
                        </p>
                        <div className="flex items-center gap-2 font-semibold">
                            Deposit Funds →
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="bg-[#141417] border border-white/5 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h2 className="text-xl font-bold">Transaction History</h2>
                        <span className="text-sm text-gray-400">{transactions.length} entries</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/5 animate-pulse rounded-2xl" />
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-white/5 animate-pulse rounded" />
                                            <div className="h-3 w-48 bg-white/5 animate-pulse rounded" />
                                        </div>
                                    </div>
                                    <div className="h-5 w-20 bg-white/5 animate-pulse rounded" />
                                </div>
                            ))
                        ) : transactions.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 italic">
                                No transactions yet. Start by depositing funds or accepting a job.
                            </div>
                        ) : (
                            transactions.map((tx) => {
                                const config = TX_ICONS[tx.type] || TX_ICONS.DEPOSIT;
                                const Icon = config.icon;
                                return (
                                    <div
                                        key={tx.id}
                                        className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 bg-white/5 rounded-2xl`}>
                                                <Icon size={24} className={config.color} />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-lg">{formatTxType(tx.type)}</div>
                                                <div className="text-gray-400 text-sm">
                                                    {tx.referenceNote || `Transaction ${tx.id.slice(0, 8)}`}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold text-lg ${config.sign === '+' ? 'text-emerald-400' : 'text-red-400'
                                                }`}>
                                                {config.sign}${tx.amount}
                                            </div>
                                            <div className="text-xs text-gray-500">{formatTimeAgo(tx.createdAt)}</div>
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
