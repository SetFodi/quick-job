'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api, getCacheEpoch } from '@/lib/api-client';
import { useLang } from '@/lib/i18n';
import { useAuth } from '@/lib/useAuth';
import { Loader2, Wallet, X, RefreshCw } from 'lucide-react';

type AdminUser = {
    id: string;
    email: string;
    fullName: string;
    role: 'CLIENT' | 'WORKER' | 'ADMIN';
    createdAt: string;
    wallet: {
        available: string;
        frozen: string;
    };
};

type AdminUsersSnapshot = {
    users: AdminUser[];
    updatedAt: number;
    epoch: number;
};

const ADMIN_USERS_CACHE_TTL_MS = 20_000;
let adminUsersSnapshot: AdminUsersSnapshot | null = null;

function validSnapshot() {
    return adminUsersSnapshot && adminUsersSnapshot.epoch === getCacheEpoch()
        ? adminUsersSnapshot
        : null;
}

export default function AdminPage() {
    const router = useRouter();
    const { lang } = useLang();
    const { userRole, loading: authLoading } = useAuth();

    const snap = validSnapshot();
    const [isInitializing, setIsInitializing] = useState(!snap);
    const [usersLoading, setUsersLoading] = useState(false);
    const [users, setUsers] = useState<AdminUser[]>(snap?.users ?? []);

    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [amount, setAmount] = useState('');
    const [referenceNote, setReferenceNote] = useState('');
    const [depositLoading, setDepositLoading] = useState(false);
    const getErrorMessage = (message: string | undefined, ruFallback: string, enFallback: string) => {
        if (!message) {
            return lang === 'ru' ? ruFallback : enFallback;
        }
        if (lang === 'ru' && /[A-Za-z]/.test(message) && !/[А-Яа-я]/.test(message)) {
            return ruFallback;
        }
        return message;
    };

    const canSubmitDeposit = useMemo(() => {
        const parsed = Number(amount);
        return Number.isFinite(parsed) && parsed > 0 && !!selectedUser;
    }, [amount, selectedUser]);
    const ROLE_LABELS: Record<'CLIENT' | 'WORKER' | 'ADMIN', string> = {
        CLIENT: lang === 'ru' ? 'Заказчик' : 'Client',
        WORKER: lang === 'ru' ? 'Исполнитель' : 'Worker',
        ADMIN: lang === 'ru' ? 'Администратор' : 'Admin',
    };

    const fetchUsers = useCallback(async (background = false) => {
        if (!background) {
            setUsersLoading(true);
        }
        try {
            const allUsers = await api.users.getAll();
            adminUsersSnapshot = {
                users: allUsers,
                updatedAt: Date.now(),
                epoch: getCacheEpoch(),
            };
            setUsers(allUsers);
        } catch (err: any) {
            toast.error(getErrorMessage(err?.message, 'Не удалось загрузить пользователей', 'Failed to load users'));
        } finally {
            if (!background) {
                setUsersLoading(false);
            }
        }
    }, [lang]);

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (userRole !== 'ADMIN') {
            setIsInitializing(false);
            router.replace('/dashboard');
            return;
        }

        const cached = validSnapshot();
        if (cached) {
            setUsers(cached.users);
            setIsInitializing(false);
            void fetchUsers(true);
        } else {
            void fetchUsers(false).finally(() => {
                setIsInitializing(false);
            });
        }

        const onFocus = () => {
            const fresh = validSnapshot();
            const hasFreshCache = !!fresh
                && Date.now() - fresh.updatedAt < ADMIN_USERS_CACHE_TTL_MS;
            if (!hasFreshCache) {
                void fetchUsers(true);
            }
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [authLoading, userRole, fetchUsers, router]);

    const closeModal = () => {
        setSelectedUser(null);
        setAmount('');
        setReferenceNote('');
    };

    const onDeposit = async (event: FormEvent) => {
        event.preventDefault();
        if (!selectedUser || !canSubmitDeposit) {
            return;
        }

        setDepositLoading(true);
        try {
            await api.wallets.deposit(
                selectedUser.id,
                amount,
                referenceNote.trim() || (lang === 'ru' ? 'Ручной банковский перевод' : 'Manual bank transfer'),
            );
            toast.success(
                lang === 'ru'
                    ? `Баланс ${selectedUser.email} пополнен на $${amount}`
                    : `${selectedUser.email} credited by $${amount}`,
            );
            closeModal();
            await fetchUsers(true);
        } catch (err: any) {
            toast.error(getErrorMessage(err?.message, 'Не удалось выполнить пополнение', 'Deposit failed'));
        } finally {
            setDepositLoading(false);
        }
    };

    if (isInitializing) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <Loader2 className="animate-spin text-gold" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-white px-4 py-5 md:px-12 md:py-10">
            <div className="max-w-5xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-xl md:text-2xl font-bold">
                            {lang === 'ru' ? 'Админ-панель' : 'Admin Panel'}
                        </h1>
                        <p className="text-zinc-500 text-xs mt-0.5">
                            {lang === 'ru' ? 'Пополнение балансов' : 'Manual top-ups'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void fetchUsers(false)}
                        disabled={usersLoading}
                        className="p-2 rounded-lg border border-white/[0.08] text-zinc-400 active:text-white disabled:opacity-40"
                    >
                        <RefreshCw size={16} className={usersLoading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Mobile card layout + desktop table */}
                {usersLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={24} className="animate-spin text-gold" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-16 text-zinc-600 text-sm">
                        {lang === 'ru' ? 'Пользователи не найдены' : 'No users found'}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {users.map((user) => (
                            <div key={user.id} className="bg-surface border border-white/[0.04] rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="min-w-0">
                                        <div className="font-semibold text-sm truncate">{user.fullName}</div>
                                        <div className="text-[11px] text-zinc-500">{user.email}</div>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 ${user.role === 'ADMIN'
                                        ? 'bg-violet-500/15 text-violet-300'
                                        : user.role === 'CLIENT'
                                            ? 'bg-gold/10 text-gold'
                                            : 'bg-blue-500/10 text-blue-300'
                                    }`}>
                                        {ROLE_LABELS[user.role]}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs mb-3">
                                    <span className="text-emerald-400 font-semibold">${user.wallet.available} <span className="text-zinc-600 font-normal">{lang === 'ru' ? 'доступно' : 'available'}</span></span>
                                    <span className="text-blue-300 font-semibold">${user.wallet.frozen} <span className="text-zinc-600 font-normal">{lang === 'ru' ? 'заморож.' : 'frozen'}</span></span>
                                </div>
                                <button
                                    type="button"
                                    disabled={user.role === 'ADMIN'}
                                    onClick={() => setSelectedUser(user)}
                                    className="w-full py-2.5 rounded-xl text-sm font-bold bg-gold text-black active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Wallet size={14} />
                                    {lang === 'ru' ? 'Пополнить' : 'Deposit'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Deposit modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center">
                    <div className="w-full max-w-md bg-surface border border-white/[0.08] rounded-t-2xl md:rounded-2xl p-5 md:p-6 safe-area-bottom">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <h2 className="font-display text-lg font-bold">
                                    {lang === 'ru' ? 'Пополнение' : 'Deposit'}
                                </h2>
                                <p className="text-zinc-500 text-xs mt-0.5">{selectedUser.email}</p>
                            </div>
                            <button type="button" onClick={closeModal} className="text-zinc-500 active:text-white p-1">
                                <X size={18} />
                            </button>
                        </div>

                        <form className="space-y-3" onSubmit={onDeposit}>
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">
                                    {lang === 'ru' ? 'Сумма ($)' : 'Amount ($)'}
                                </label>
                                <input required type="number" step="0.01" min="0.01" value={amount}
                                    onChange={(event) => setAmount(event.target.value)} placeholder="0.00"
                                    className="w-full px-3.5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-gold/30 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">
                                    {lang === 'ru' ? 'Примечание' : 'Note'}
                                </label>
                                <input value={referenceNote} onChange={(event) => setReferenceNote(event.target.value)}
                                    placeholder={lang === 'ru' ? 'Bank Transfer #1234' : 'Bank Transfer #1234'}
                                    className="w-full px-3.5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-gold/30 text-sm" />
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={closeModal}
                                    className="flex-1 py-3 rounded-xl border border-white/[0.08] text-zinc-300 text-sm font-medium active:bg-white/[0.04]">
                                    {lang === 'ru' ? 'Отмена' : 'Cancel'}
                                </button>
                                <button type="submit" disabled={!canSubmitDeposit || depositLoading}
                                    className="flex-1 py-3 rounded-xl bg-gold text-black font-bold text-sm disabled:opacity-40 active:scale-95 flex items-center justify-center gap-2">
                                    {depositLoading && <Loader2 size={14} className="animate-spin" />}
                                    {lang === 'ru' ? 'Зачислить' : 'Credit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
