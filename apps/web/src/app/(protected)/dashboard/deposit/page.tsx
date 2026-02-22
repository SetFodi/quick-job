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

    const presets = ['50', '100', '250', '500', '1000'];

    useEffect(() => {
        api.users.getMe()
            .then((me) => setIsAdmin(me.role === 'ADMIN'))
            .catch(() => setIsAdmin(false))
            .finally(() => setCheckingRole(false));
    }, []);

    async function handleDeposit(e: React.FormEvent) {
        e.preventDefault();
        if (!isAdmin || !amount || parseFloat(amount) <= 0) return;
        setLoading(true);
        try {
            const { data: { session } } = await getSupabase().auth.getSession();
            if (!session?.user?.id) throw new Error(lang === 'ru' ? 'Требуется авторизация' : 'Not authenticated');
            await api.wallets.deposit(
                session.user.id, amount,
                lang === 'ru' ? 'Пополнение администратором' : 'Admin deposit',
            );
            toast.success(lang === 'ru' ? `$${amount} зачислено!` : `$${amount} deposited!`);
            router.push('/dashboard');
        } catch (err: any) {
            toast.error(err?.message || (lang === 'ru' ? 'Не удалось пополнить' : 'Failed'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-white px-4 py-5 md:px-12 md:py-10">
            <div className="max-w-md mx-auto space-y-4">
                <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 text-zinc-500 text-sm active:text-white">
                    <ArrowLeft size={16} />{lang === 'ru' ? 'К панели' : 'Back'}
                </button>

                <div>
                    <h1 className="font-display text-xl font-bold">{lang === 'ru' ? 'Пополнить счёт' : 'Deposit Funds'}</h1>
                    <p className="text-zinc-500 text-xs mt-0.5">
                        {lang === 'ru'
                            ? 'Пополнение обрабатывается администратором.'
                            : 'Top-ups are processed by an admin.'}
                    </p>
                </div>

                <form onSubmit={handleDeposit} className="bg-surface border border-white/[0.04] rounded-xl p-5 space-y-4">
                    {checkingRole ? (
                        <div className="text-zinc-500 text-sm flex items-center gap-2">
                            <Loader2 size={15} className="animate-spin" />
                            {lang === 'ru' ? 'Проверяем доступ...' : 'Checking access...'}
                        </div>
                    ) : isAdmin ? (
                        <>
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">{lang === 'ru' ? 'Сумма ($)' : 'Amount ($)'}</label>
                                <div className="relative">
                                    <DollarSign size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold" />
                                    <input required type="number" min="1" step="0.01" value={amount}
                                        onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                                        className="w-full pl-10 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-lg font-bold text-center placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all" />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {presets.map(p => (
                                    <button key={p} type="button" onClick={() => setAmount(p)}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex-1 min-w-[60px] transition-all ${amount === p
                                            ? 'bg-gold text-black'
                                            : 'bg-white/[0.03] text-zinc-400 border border-white/[0.06] active:bg-white/[0.06]'
                                        }`}>
                                        ${p}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm text-zinc-400 leading-relaxed">
                            {lang === 'ru'
                                ? 'Переведите средства по реквизитам администратора. После подтверждения администратор зачислит сумму на ваш баланс.'
                                : 'Transfer funds to admin and provide your transfer reference. Admin will credit your balance.'}
                        </div>
                    )}

                    <div className="flex items-start gap-2.5 p-3 bg-gold/[0.04] border border-gold/10 rounded-xl">
                        <Shield size={16} className="text-gold shrink-0 mt-0.5" />
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                            {lang === 'ru'
                                ? 'Средства замораживаются в эскроу при оплате заказа.'
                                : 'Funds are locked in escrow when you pay for a job.'}
                        </p>
                    </div>

                    <button type="submit" disabled={!isAdmin || checkingRole || loading || !amount}
                        className="w-full py-3.5 bg-gold text-black font-bold rounded-xl text-sm disabled:opacity-40 active:scale-95 flex items-center justify-center gap-2">
                        {loading ? <><Loader2 size={16} className="animate-spin" />{lang === 'ru' ? 'Зачисляем...' : 'Depositing...'}</> :
                            isAdmin
                                ? (lang === 'ru' ? `Пополнить ${amount ? `$${amount}` : ''}` : `Deposit ${amount ? `$${amount}` : ''}`)
                                : (lang === 'ru' ? 'Ожидание зачисления' : 'Waiting for admin')}
                    </button>
                </form>
            </div>
        </div>
    );
}
