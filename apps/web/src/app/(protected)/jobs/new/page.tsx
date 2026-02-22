'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useLang } from '@/lib/i18n';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const CATEGORIES = ['Construction', 'Digital', 'Household', 'Other'] as const;

export default function CreateJobPage() {
    const router = useRouter();
    const { t, lang } = useLang();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [description, setDescription] = useState('');
    const [totalBudget, setTotalBudget] = useState('');
    const [deadline, setDeadline] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const budget = parseFloat(totalBudget);
        if (!budget || budget <= 0) return;
        setSubmitting(true);
        try {
            const job = await api.jobs.create({
                title, category, description, totalBudget, deadline,
                milestones: [{ title: title, amount: totalBudget, order: 1 }],
            });
            toast.success(lang === 'ru' ? 'Заказ создан!' : 'Job posted!');
            router.push(`/jobs/${job.id}`);
        } catch (e: any) {
            const msg = e?.message;
            toast.error(msg && /[А-Яа-я]/.test(msg) ? msg : (lang === 'ru' ? 'Не удалось создать заказ' : 'Failed'));
        } finally {
            setSubmitting(false);
        }
    }

    const inputStyle = 'w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all text-base';

    return (
        <div className="min-h-screen bg-[#09090b] text-white px-4 py-5 md:px-12 md:py-10">
            <div className="max-w-lg mx-auto space-y-5">

                <h1 className="font-display text-xl font-bold text-center">
                    {lang === 'ru' ? 'Новый заказ' : 'New Job'}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder={lang === 'ru' ? 'Что нужно сделать?' : 'What needs to be done?'}
                        className={inputStyle} />

                    <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder={lang === 'ru' ? 'Опишите задачу подробнее...' : 'Describe the task in detail...'}
                        className={`${inputStyle} resize-none`} />

                    {/* Category pills */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {CATEGORIES.map((c) => {
                            const key = c.toLowerCase() as 'construction' | 'digital' | 'household' | 'other';
                            return (
                                <button key={c} type="button" onClick={() => setCategory(c)}
                                    className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${category === c
                                        ? 'bg-gold text-black font-bold'
                                        : 'bg-surface border border-white/[0.04] text-zinc-500 active:bg-white/[0.04]'
                                    }`}>
                                    {t(`jobsList.${key}`)}
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-bold text-sm">$</span>
                            <input required type="number" min="1" step="0.01" value={totalBudget}
                                onChange={(e) => setTotalBudget(e.target.value)}
                                placeholder={lang === 'ru' ? 'Бюджет' : 'Budget'}
                                className={`${inputStyle} pl-8`} />
                        </div>
                        <input required type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                            className={inputStyle} />
                    </div>

                    <button type="submit" disabled={submitting || !totalBudget || !title}
                        className="w-full py-4 rounded-2xl bg-gold text-black font-bold text-base transition-all disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.97]">
                        {submitting
                            ? <><Loader2 size={18} className="animate-spin" />{lang === 'ru' ? 'Размещаем...' : 'Posting...'}</>
                            : (lang === 'ru' ? 'Разместить заказ' : 'Post Job')}
                    </button>
                </form>
            </div>
        </div>
    );
}
