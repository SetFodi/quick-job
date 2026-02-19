'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { getSupabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';
import { toast } from 'sonner';
import {
    ArrowLeft, CheckCircle2, Clock, Shield, Loader2, Send,
    DollarSign, User, XCircle, Lock, Trash2,
} from 'lucide-react';

type Milestone = { id: string; title: string; amount: string; status: string; order: number };
type Proposal = { id: string; workerId: string; proposedAmount: string; coverLetter: string | null; status: string; worker: { fullName: string } };
type Job = {
    id: string; title: string; description: string; category: string;
    totalBudget: string; deadline: string | null; status: string;
    clientId: string; workerId: string | null;
    client: { fullName: string }; milestones: Milestone[];
};

export default function JobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { t, lang, toggle } = useLang();
    const jobId = params.id as string;

    const [job, setJob] = useState<Job | null>(null);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

    const [proposedAmount, setProposedAmount] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [proposalSubmitting, setProposalSubmitting] = useState(false);

    function startLoading(id: string) { setActionLoading((p) => new Set(p).add(id)); }
    function stopLoading(id: string) { setActionLoading((p) => { const n = new Set(p); n.delete(id); return n; }); }

    const fetchJob = useCallback(async () => {
        try { setJob(await api.jobs.getOne(jobId)); } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
    }, [jobId]);

    const fetchProposals = useCallback(async () => {
        try { setProposals(await api.proposals.getForJob(jobId)); } catch { }
    }, [jobId]);

    useEffect(() => {
        async function init() {
            const { data: { session } } = await getSupabase().auth.getSession();
            if (session?.user?.id) setCurrentUserId(session.user.id);
            await fetchJob();
        }
        init();
    }, [fetchJob]);

    useEffect(() => { if (job && currentUserId) fetchProposals(); }, [job, currentUserId, fetchProposals]);

    const isClient = currentUserId === job?.clientId;
    const isWorker = currentUserId === job?.workerId;
    const isVisitor = !isClient && !isWorker;

    async function handleSubmitProposal(e: React.FormEvent) {
        e.preventDefault();
        setProposalSubmitting(true);
        try {
            await api.proposals.create(jobId, { proposedAmount, coverLetter: coverLetter || undefined });
            toast.success(lang === 'ru' ? 'Заявка отправлена! 🎯' : 'Proposal sent! 🎯');
            setProposedAmount(''); setCoverLetter('');
            await fetchProposals();
        } catch (err: any) { toast.error(err.message); } finally { setProposalSubmitting(false); }
    }

    async function handleAccept(id: string) { startLoading(id); try { await api.proposals.accept(id); toast.success(lang === 'ru' ? 'Заявка принята! 🤝' : 'Accepted! 🤝'); await fetchJob(); await fetchProposals(); } catch (err: any) { toast.error(err.message); } finally { stopLoading(id); } }
    async function handleReject(id: string) { startLoading(id); try { await api.proposals.reject(id); toast.success(lang === 'ru' ? 'Отклонено' : 'Rejected'); await fetchProposals(); } catch (err: any) { toast.error(err.message); } finally { stopLoading(id); } }
    async function handleFund(id: string) { startLoading(id); try { await api.escrow.lockFunds(id); toast.success(lang === 'ru' ? 'Этап профинансирован! 🔒' : 'Funded! 🔒'); await fetchJob(); } catch (err: any) { toast.error(err.message); } finally { stopLoading(id); } }
    async function handleSubmitWork(id: string) { startLoading(id); try { await api.escrow.submitWork(id); toast.success(lang === 'ru' ? 'Работа сдана! 📤' : 'Submitted! 📤'); await fetchJob(); } catch (err: any) { toast.error(err.message); } finally { stopLoading(id); } }
    async function handleRelease(id: string) {
        startLoading(id);
        try {
            const r = await api.escrow.releaseFunds(id);
            toast.success(lang === 'ru' ? `Оплачено! 💸 Исполнитель: $${r.workerReceived}, Комиссия: $${r.platformFee}` : `Released! 💸 Worker: $${r.workerReceived}, Fee: $${r.platformFee}`);
            if (r.jobCompleted) toast.success(lang === 'ru' ? '🎉 Заказ завершён!' : '🎉 Job completed!');
            await fetchJob();
        } catch (err: any) { toast.error(err.message); } finally { stopLoading(id); }
    }

    const STATUS: Record<string, { color: string; bg: string; label: string }> = {
        PENDING: { color: 'text-zinc-400', bg: 'bg-zinc-500/10', label: t('status.pending') },
        FUNDED: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: t('status.funded') },
        REVIEW: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: t('status.review') },
        COMPLETED: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: t('status.completed') },
        DISPUTED: { color: 'text-red-400', bg: 'bg-red-500/10', label: t('status.disputed') },
        IN_PROGRESS: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: t('status.inProgress') },
        ASSIGNED: { color: 'text-violet-400', bg: 'bg-violet-500/10', label: t('status.assigned') },
        OPEN: { color: 'text-gold', bg: 'bg-gold/10', label: t('status.open') },
    };

    if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="animate-spin text-gold" size={40} /></div>;
    if (!job) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-600">{lang === 'ru' ? 'Заказ не найден' : 'Job not found'}</div>;

    const jobStatus = STATUS[job.status] || STATUS.OPEN;
    const inputStyle = 'w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-transparent transition-all';

    return (
        <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between animate-in">
                    <button onClick={() => router.push('/jobs')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm">
                        <ArrowLeft size={16} />{t('jobDetail.backToJobs')}
                    </button>
                    <button onClick={toggle} className="px-3 py-1.5 text-xs font-bold border border-white/[0.06] rounded-lg bg-white/[0.02] text-zinc-500 uppercase tracking-widest">
                        {lang === 'ru' ? 'EN' : 'RU'}
                    </button>
                </div>

                {/* Header */}
                <div className="bg-surface border border-white/[0.04] rounded-2xl p-8 animate-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="space-y-2 flex-1">
                            <h1 className="font-display text-3xl font-bold tracking-tight">{job.title}</h1>
                            <p className="text-zinc-400 leading-relaxed">{job.description}</p>
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <span className="text-xs text-zinc-600">{t('jobDetail.postedBy')} {job.client.fullName}</span>
                                <span className="text-xs text-zinc-700 capitalize px-2 py-0.5 bg-white/[0.03] rounded">{job.category}</span>
                                {job.deadline && <span className="text-xs text-zinc-600 flex items-center gap-1"><Clock size={11} />{new Date(job.deadline).toLocaleDateString()}</span>}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0">
                            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${jobStatus.bg} ${jobStatus.color}`}>{jobStatus.label}</span>
                            <div className="font-display text-2xl font-bold text-gold">${job.totalBudget}</div>
                        </div>
                    </div>
                    {(isClient || isWorker) && (
                        <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isClient ? 'bg-gold/10 text-gold' : 'bg-blue-500/10 text-blue-400'}`}>
                                {isClient ? t('jobDetail.youAreClient') : t('jobDetail.youAreWorker')}
                            </span>
                            {isClient && job.status === 'OPEN' && (
                                <button
                                    onClick={async () => {
                                        if (!window.confirm(lang === 'ru' ? 'Удалить этот заказ?' : 'Delete this job?')) return;
                                        try {
                                            await api.jobs.delete(jobId);
                                            toast.success(lang === 'ru' ? 'Заказ удалён' : 'Job deleted');
                                            router.push('/jobs');
                                        } catch (err: any) { toast.error(err.message); }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all"
                                >
                                    <Trash2 size={14} />{lang === 'ru' ? 'Удалить заказ' : 'Delete Job'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Proposals */}
                {job.status === 'OPEN' && (
                    <div className="space-y-4 animate-in" style={{ animationDelay: '0.2s' }}>
                        <h2 className="font-display text-xl font-bold flex items-center gap-2"><User size={20} className="text-violet-400" />{t('jobDetail.proposals')}</h2>

                        {isVisitor && (
                            <form onSubmit={handleSubmitProposal} className="bg-surface border border-white/[0.04] rounded-2xl p-6 space-y-4">
                                <h3 className="text-sm font-semibold text-zinc-300">{t('jobDetail.submitBid')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs text-zinc-600 mb-1 block">{t('jobDetail.yourPrice')}</label>
                                        <input required type="number" min="1" step="0.01" value={proposedAmount}
                                            onChange={(e) => setProposedAmount(e.target.value)} className={inputStyle} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-zinc-600 mb-1 block">{t('jobDetail.coverLetter')}</label>
                                        <input value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} className={inputStyle} />
                                    </div>
                                </div>
                                <button type="submit" disabled={proposalSubmitting}
                                    className="px-6 py-2.5 bg-gold hover:bg-gold-dim text-black font-bold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
                                    {proposalSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}{t('jobDetail.sendProposal')}
                                </button>
                            </form>
                        )}

                        {isClient && (
                            <div className="bg-surface border border-white/[0.04] rounded-2xl overflow-hidden">
                                {proposals.length === 0 ? (
                                    <div className="p-8 text-center text-zinc-600 italic">{t('jobDetail.noProposals')}</div>
                                ) : (
                                    <div className="divide-y divide-white/[0.03]">
                                        {proposals.map((p) => (
                                            <div key={p.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/[0.01] transition-colors">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold">{p.worker.fullName}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' : p.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{p.status}</span>
                                                    </div>
                                                    {p.coverLetter && <p className="text-zinc-500 text-sm">{p.coverLetter}</p>}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-bold text-gold">${p.proposedAmount}</span>
                                                    {p.status === 'PENDING' && (<>
                                                        <button onClick={() => handleAccept(p.id)} disabled={actionLoading.has(p.id)}
                                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5">
                                                            {actionLoading.has(p.id) ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}{t('jobDetail.accept')}
                                                        </button>
                                                        <button onClick={() => handleReject(p.id)} disabled={actionLoading.has(p.id)}
                                                            className="px-4 py-2 bg-red-600/40 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5">
                                                            <XCircle size={12} />{t('jobDetail.reject')}
                                                        </button>
                                                    </>)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Milestones */}
                <div className="space-y-4 animate-in" style={{ animationDelay: '0.3s' }}>
                    <h2 className="font-display text-xl font-bold flex items-center gap-2"><Shield size={20} className="text-gold" />{t('jobDetail.milestonesTitle')}</h2>
                    {job.milestones.sort((a, b) => a.order - b.order).map((ms, i) => {
                        const cfg = STATUS[ms.status] || STATUS.PENDING;
                        const isL = actionLoading.has(ms.id);
                        return (
                            <div key={ms.id} className="bg-surface border border-white/[0.04] rounded-2xl p-6 hover:border-white/[0.08] transition-all">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.03] text-zinc-500 text-sm font-bold shrink-0">{i + 1}</div>
                                        <div>
                                            <div className="font-semibold text-lg">{ms.title}</div>
                                            <div className="text-zinc-500 text-sm mt-0.5">${ms.amount}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                                        {isClient && ms.status === 'PENDING' && ['ASSIGNED', 'IN_PROGRESS'].includes(job.status) && (
                                            <button onClick={() => handleFund(ms.id)} disabled={isL}
                                                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50">
                                                {isL ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}{t('jobDetail.fund')}
                                            </button>
                                        )}
                                        {isWorker && ms.status === 'FUNDED' && (
                                            <button onClick={() => handleSubmitWork(ms.id)} disabled={isL}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50">
                                                {isL ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}{t('jobDetail.submitWork')}
                                            </button>
                                        )}
                                        {isClient && ms.status === 'REVIEW' && (
                                            <button onClick={() => handleRelease(ms.id)} disabled={isL}
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50">
                                                {isL ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}{t('jobDetail.confirmPay')}
                                            </button>
                                        )}
                                        {ms.status === 'COMPLETED' && <CheckCircle2 size={20} className="text-emerald-400" />}
                                        {ms.status === 'REVIEW' && isWorker && <span className="text-xs text-amber-400 flex items-center gap-1"><Clock size={12} />{t('jobDetail.awaitingReview')}</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Job Complete */}
                {job.status === 'COMPLETED' && (
                    <div className="bg-gradient-to-r from-gold/[0.08] to-amber-600/[0.04] border border-gold/[0.1] rounded-2xl p-8 text-center animate-in">
                        <CheckCircle2 size={40} className="text-gold mx-auto mb-3" />
                        <h3 className="font-display text-xl font-bold text-gold">{t('jobDetail.jobCompleted')}</h3>
                        <p className="text-zinc-400 mt-1">{t('jobDetail.allMilestonesDone')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
