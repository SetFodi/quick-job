'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useLang } from '@/lib/i18n';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Plus, X, CheckCircle2, AlertTriangle } from 'lucide-react';

const CATEGORIES = ['Construction', 'Digital', 'Household', 'Other'];

export default function CreateJobPage() {
    const router = useRouter();
    const { t, lang, toggle } = useLang();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [description, setDescription] = useState('');
    const [totalBudget, setTotalBudget] = useState('');
    const [deadline, setDeadline] = useState('');
    const [milestones, setMilestones] = useState([{ title: '', amount: '' }]);
    const [submitting, setSubmitting] = useState(false);

    function addMilestone() { setMilestones([...milestones, { title: '', amount: '' }]); }
    function removeMilestone(i: number) { setMilestones(milestones.filter((_, idx) => idx !== i)); }
    function updateMilestone(i: number, field: 'title' | 'amount', val: string) {
        const updated = [...milestones];
        updated[i][field] = val;
        setMilestones(updated);
    }

    const milestoneSum = milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);
    const budgetNum = parseFloat(totalBudget) || 0;
    const budgetMatch = budgetNum > 0 && Math.abs(milestoneSum - budgetNum) < 0.01;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!budgetMatch) return;
        setSubmitting(true);
        try {
            const job = await api.jobs.create({
                title, category, description, totalBudget, deadline,
                milestones: milestones.map((m, i) => ({ title: m.title, amount: m.amount, order: i + 1 })),
            });
            toast.success(lang === 'ru' ? 'Заказ создан! 🎯' : 'Job posted! 🎯');
            router.push(`/jobs/${job.id}`);
        } catch (err: any) {
            toast.error(err.message || 'Failed');
        } finally {
            setSubmitting(false);
        }
    }

    const inputStyle = 'w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-transparent transition-all text-sm';

    return (
        <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between animate-in">
                    <button onClick={() => router.push('/jobs')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm">
                        <ArrowLeft size={16} />{t('jobDetail.backToJobs')}
                    </button>
                    <button onClick={toggle} className="px-3 py-1.5 text-xs font-bold border border-white/[0.06] rounded-lg bg-white/[0.02] text-zinc-500 uppercase tracking-widest">
                        {lang === 'ru' ? 'EN' : 'RU'}
                    </button>
                </div>

                <div className="animate-in" style={{ animationDelay: '0.1s' }}>
                    <h1 className="font-display text-3xl font-bold">{t('createJob.title')}</h1>
                    <p className="text-zinc-500 mt-1">{t('createJob.subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-surface border border-white/[0.04] rounded-2xl p-8 space-y-6 animate-in" style={{ animationDelay: '0.2s' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('createJob.jobTitle')}</label>
                            <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputStyle} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('createJob.category')}</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)}
                                className={`${inputStyle} appearance-none`}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('createJob.description')}</label>
                        <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                            className={`${inputStyle} resize-none`} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('createJob.totalBudget')}</label>
                            <input required type="number" min="1" step="0.01" value={totalBudget}
                                onChange={(e) => setTotalBudget(e.target.value)} className={inputStyle} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('createJob.deadlineLabel')}</label>
                            <input required type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputStyle} />
                        </div>
                    </div>

                    {/* Milestones */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-zinc-400">{t('createJob.milestones')}</label>
                            <button type="button" onClick={addMilestone}
                                className="text-xs text-gold hover:text-gold-dim flex items-center gap-1 font-semibold">
                                <Plus size={14} />{t('createJob.addMilestone')}
                            </button>
                        </div>
                        <div className="space-y-3">
                            {milestones.map((m, i) => (
                                <div key={i} className="grid grid-cols-[1fr_120px_auto] gap-3 items-center">
                                    <input required value={m.title} onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                                        placeholder={t('createJob.milestoneName')}
                                        className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-transparent transition-all min-w-0" />
                                    <input required type="number" min="1" step="0.01" value={m.amount}
                                        onChange={(e) => updateMilestone(i, 'amount', e.target.value)}
                                        placeholder="$"
                                        className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-transparent transition-all" />
                                    {milestones.length > 1 ? (
                                        <button type="button" onClick={() => removeMilestone(i)}
                                            className="text-zinc-600 hover:text-red-400 transition-colors p-1">
                                            <X size={16} />
                                        </button>
                                    ) : <div className="w-6" />}
                                </div>
                            ))}
                        </div>

                        {budgetNum > 0 && (
                            <div className={`mt-3 flex items-center gap-2 text-sm ${budgetMatch ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {budgetMatch ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                {budgetMatch ? t('createJob.budgetMatch') : `${t('createJob.budgetMismatch')} ($${milestoneSum} / $${budgetNum})`}
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={submitting || !budgetMatch}
                        className="w-full py-3 px-4 rounded-xl bg-gold hover:bg-gold-dim text-black font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base">
                        {submitting ? (<><Loader2 size={18} className="animate-spin" />{t('createJob.submitting')}</>) : t('createJob.submit')}
                    </button>
                </form>
            </div>
        </div>
    );
}
