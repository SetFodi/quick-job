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
        <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="font-display text-3xl font-bold tracking-tight">
                            {lang === 'ru' ? 'Админ-панель' : 'Admin Dashboard'}
                        </h1>
                        <p className="text-zinc-500 mt-1">
                            {lang === 'ru'
                                ? 'Ручное пополнение балансов после внешнего перевода.'
                                : 'Manual wallet top-ups after external bank transfer.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void fetchUsers(false)}
                        disabled={usersLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] text-sm text-zinc-300 hover:text-white hover:bg-white/[0.04] disabled:opacity-40"
                    >
                        <RefreshCw size={15} className={usersLoading ? 'animate-spin' : ''} />
                        {lang === 'ru' ? 'Обновить' : 'Refresh'}
                    </button>
                </div>

                <div className="bg-surface border border-white/[0.04] rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[880px]">
                            <thead className="bg-white/[0.02] border-b border-white/[0.04]">
                                <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                                    <th className="px-5 py-4">{lang === 'ru' ? 'Пользователь' : 'User'}</th>
                                    <th className="px-5 py-4">{lang === 'ru' ? 'Роль' : 'Role'}</th>
                                    <th className="px-5 py-4">{lang === 'ru' ? 'Доступно' : 'Available'}</th>
                                    <th className="px-5 py-4">{lang === 'ru' ? 'Заморожено' : 'Frozen'}</th>
                                    <th className="px-5 py-4">{lang === 'ru' ? 'Создан' : 'Created'}</th>
                                    <th className="px-5 py-4 text-right">{lang === 'ru' ? 'Действие' : 'Action'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                                            <span className="inline-flex items-center gap-2">
                                                <Loader2 size={16} className="animate-spin" />
                                                {lang === 'ru' ? 'Загрузка...' : 'Loading...'}
                                            </span>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                                            {lang === 'ru' ? 'Пользователи не найдены' : 'No users found'}
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="border-b border-white/[0.03] last:border-0">
                                            <td className="px-5 py-4">
                                                <div className="font-semibold">{user.fullName}</div>
                                                <div className="text-xs text-zinc-500 mt-0.5">{user.email}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`text-xs px-2 py-1 rounded-md font-semibold ${user.role === 'ADMIN'
                                                    ? 'bg-violet-500/15 text-violet-300'
                                                    : user.role === 'CLIENT'
                                                        ? 'bg-gold/10 text-gold'
                                                        : 'bg-blue-500/10 text-blue-300'
                                                    }`}>
                                                    {ROLE_LABELS[user.role]}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 font-semibold text-emerald-400">
                                                ${user.wallet.available}
                                            </td>
                                            <td className="px-5 py-4 font-semibold text-blue-300">
                                                ${user.wallet.frozen}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-zinc-500">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    type="button"
                                                    disabled={user.role === 'ADMIN'}
                                                    onClick={() => setSelectedUser(user)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gold text-black hover:bg-gold-dim disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    <Wallet size={14} />
                                                    {lang === 'ru' ? 'Пополнить' : 'Deposit Funds'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {selectedUser && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-surface border border-white/[0.08] rounded-2xl p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="font-display text-xl font-bold">
                                    {lang === 'ru' ? 'Ручное пополнение' : 'Manual Deposit'}
                                </h2>
                                <p className="text-zinc-500 text-sm mt-1">
                                    {selectedUser.email}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="text-zinc-500 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form className="mt-5 space-y-4" onSubmit={onDeposit}>
                            <div>
                                <label className="text-sm text-zinc-400 mb-2 block">
                                    {lang === 'ru' ? 'Сумма ($)' : 'Amount ($)'}
                                </label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={amount}
                                    onChange={(event) => setAmount(event.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-gold/30"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-zinc-400 mb-2 block">
                                    {lang === 'ru' ? 'Примечание' : 'Reference Note'}
                                </label>
                                <input
                                    value={referenceNote}
                                    onChange={(event) => setReferenceNote(event.target.value)}
                                    placeholder={lang === 'ru' ? 'Например: Bank Transfer #1234' : 'e.g. Bank Transfer #1234'}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-gold/30"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 rounded-xl border border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.04]"
                                >
                                    {lang === 'ru' ? 'Отмена' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={!canSubmitDeposit || depositLoading}
                                    className="px-4 py-2 rounded-xl bg-gold text-black font-semibold hover:bg-gold-dim disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
                                >
                                    {depositLoading && <Loader2 size={14} className="animate-spin" />}
                                    {lang === 'ru' ? 'Зачислить' : 'Credit Balance'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
