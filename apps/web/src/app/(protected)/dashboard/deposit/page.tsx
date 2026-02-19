'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { getSupabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, DollarSign, Shield } from 'lucide-react';

export default function DepositPage() {
    const router = useRouter();
    const { lang } = useLang();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingRole, setCheckingRole] = useState(true);
    const getErrorMessage = (message: string | undefined, ruFallback: string, enFallback: string) => {
        if (!message) {
            return lang === 'ru' ? ruFallback : enFallback;
        }
        if (lang === 'ru' && /[A-Za-z]/.test(message) && !/[А-Яа-я]/.test(message)) {
            return ruFallback;
        }
        return message;
    };

    const presets = ['50', '100', '250', '500', '1000'];

    useEffect(() => {
        async function checkRole() {
            try {
                const me = await api.users.getMe();
                setIsAdmin(me.role === 'ADMIN');
            } catch {
                setIsAdmin(false);
            } finally {
                setCheckingRole(false);
            }
        }
        checkRole();
    }, []);

    async function handleDeposit(e: React.FormEvent) {
        e.preventDefault();
        if (!isAdmin || !amount || parseFloat(amount) <= 0) return;
        setLoading(true);
        try {
            const { data: { session } } = await getSupabase().auth.getSession();
            if (!session?.user?.id) throw new Error(lang === 'ru' ? 'Требуется авторизация' : 'Not authenticated');
            await api.wallets.deposit(
                session.user.id,
                amount,
                lang === 'ru' ? 'Пополнение администратором из панели' : 'Admin deposit from dashboard',
            );
            toast.success(lang === 'ru' ? `$${amount} зачислено! 💰` : `$${amount} deposited! 💰`);
            router.push('/dashboard');
        } catch (err: any) {
            toast.error(getErrorMessage(err?.message, 'Не удалось выполнить пополнение', 'Failed to deposit'));
        } finally {
            setLoading(false);
        }
    }

    const inputStyle = 'w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-lg font-bold text-center placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-transparent transition-all';

    return (
        <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12">
            <div className="max-w-md mx-auto space-y-6">
                <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm animate-in">
                    <ArrowLeft size={16} />{lang === 'ru' ? 'К панели' : 'Back to Dashboard'}
                </button>

                <div className="animate-in" style={{ animationDelay: '0.1s' }}>
                    <h1 className="font-display text-3xl font-bold">{lang === 'ru' ? 'Пополнить счёт' : 'Deposit Funds'}</h1>
                    <p className="text-zinc-500 mt-1">
                        {lang === 'ru'
                            ? 'В MVP пополнение обрабатывается администратором вручную.'
                            : 'In MVP, top-ups are processed manually by an admin.'}
                    </p>
                </div>

                <form onSubmit={handleDeposit} className="bg-surface border border-white/[0.04] rounded-2xl p-8 space-y-6 animate-in" style={{ animationDelay: '0.2s' }}>
                    {checkingRole ? (
                        <div className="text-zinc-500 text-sm flex items-center gap-2">
                            <Loader2 size={15} className="animate-spin" />
                            {lang === 'ru' ? 'Проверяем доступ...' : 'Checking access...'}
                        </div>
                    ) : isAdmin ? (
                        <>
                            <div>
                                <label className="text-sm text-zinc-400 mb-2 block">{lang === 'ru' ? 'Сумма ($)' : 'Amount ($)'}</label>
                                <div className="relative">
                                    <DollarSign size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" />
                                    <input required type="number" min="1" step="0.01" value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className={`${inputStyle} pl-10`} />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {presets.map(p => (
                                    <button key={p} type="button" onClick={() => setAmount(p)}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${amount === p
                                            ? 'bg-gold text-black'
                                            : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] border border-white/[0.06]'
                                            }`}>
                                        ${p}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm text-zinc-400 leading-relaxed">
                            {lang === 'ru'
                                ? 'Для пополнения переведите средства по реквизитам администратора и укажите номер перевода. После подтверждения администратор зачислит сумму на ваш баланс.'
                                : 'To top up, transfer funds using admin payment details and provide your transfer reference. After verification, the admin will credit your balance.'}
                        </div>
                    )}

                    <div className="flex items-start gap-3 p-4 bg-gold/[0.04] border border-gold/10 rounded-xl">
                        <Shield size={18} className="text-gold shrink-0 mt-0.5" />
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            {lang === 'ru'
                                ? 'Средства хранятся на вашем внутреннем счёте. При оплате заказа они замораживаются в эскроу до подтверждения работы.'
                                : 'Funds are held in your internal account. When you pay for a job, they are locked in escrow until work is confirmed.'}
                        </p>
                    </div>

                    <button type="submit" disabled={!isAdmin || checkingRole || loading || !amount}
                        className="w-full py-3.5 bg-gold hover:bg-gold-dim text-black font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base active:scale-[0.98]">
                        {loading ? <><Loader2 size={18} className="animate-spin" />{lang === 'ru' ? 'Зачисляем...' : 'Depositing...'}</> :
                            isAdmin
                                ? (lang === 'ru' ? `Пополнить ${amount ? `$${amount}` : ''}` : `Deposit ${amount ? `$${amount}` : ''}`)
                                : (lang === 'ru' ? 'Ожидание зачисления админом' : 'Waiting for admin credit')}
                    </button>
                </form>
            </div>
        </div>
    );
}
