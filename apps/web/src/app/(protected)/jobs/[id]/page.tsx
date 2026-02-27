'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { getSupabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';
import { toast } from 'sonner';
import {
    ArrowLeft, CheckCircle2, Clock, Shield, Loader2, Send,
    DollarSign, User, XCircle, Lock, Trash2, MessageCircle, Star,
} from 'lucide-react';
import Link from 'next/link';

type Milestone = { id: string; title: string; amount: string; status: string; order: number };
type Proposal = { id: string; workerId: string; proposedAmount: string; coverLetter: string | null; status: string; worker: { fullName: string } };
type Review = { id: string; rating: number; comment: string | null; reviewer: { fullName: string; role: string } };
type Job = {
    id: string; title: string; description: string; category: string;
    totalBudget: string; deadline: string | null; status: string;
    clientId: string; workerId: string | null;
    client: { fullName: string }; milestones: Milestone[];
};

export default function JobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { t, lang } = useLang();
    const jobId = params.id as string;

    const [job, setJob] = useState<Job | null>(null);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

    const [proposedAmount, setProposedAmount] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [proposalSubmitting, setProposalSubmitting] = useState(false);

    const [hasReviewed, setHasReviewed] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [jobReviews, setJobReviews] = useState<Review[]>([]);

    const err = (message: string | undefined, ru: string, en: string) => {
        if (!message) return lang === 'ru' ? ru : en;
        if (lang === 'ru' && /[A-Za-z]/.test(message) && !/[А-Яа-я]/.test(message)) return ru;
        return message;
    };

    function startL(id: string) { setActionLoading((p) => new Set(p).add(id)); }
    function stopL(id: string) { setActionLoading((p) => { const n = new Set(p); n.delete(id); return n; }); }

    const fetchJob = useCallback(async () => {
        try { setJob(await api.jobs.getOne(jobId)); } catch (e: any) { toast.error(err(e?.message, 'Не удалось загрузить заказ', 'Failed to load job')); } finally { setLoading(false); }
    }, [jobId, lang]);

    const fetchProposals = useCallback(async () => {
        try { setProposals(await api.proposals.getForJob(jobId)); } catch { }
    }, [jobId]);

    const fetchReviews = useCallback(async () => {
        try {
            const [reviewsData, checkData] = await Promise.all([
                api.reviews.getForJob(jobId),
                api.reviews.hasReviewed(jobId),
            ]);
            setJobReviews(reviewsData);
            setHasReviewed(checkData.hasReviewed);
        } catch { }
    }, [jobId]);

    useEffect(() => {
        async function init() {
            const [sessionResult] = await Promise.all([
                getSupabase().auth.getSession(),
                fetchJob(),
            ]);
            const { data: { session } } = sessionResult;
            if (session?.user?.id) setCurrentUserId(session.user.id);
            void fetchProposals();
            void fetchReviews();
        }
        init();
        const onFocus = () => { void fetchJob(); void fetchProposals(); void fetchReviews(); };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [fetchJob, fetchProposals, fetchReviews]);

    const isClient = currentUserId === job?.clientId;
    const isWorker = currentUserId === job?.workerId;
    const isVisitor = !isClient && !isWorker;

    async function handleSubmitReview(e: React.FormEvent) {
        e.preventDefault();
        if (reviewRating < 1 || reviewSubmitting) return;
        setReviewSubmitting(true);
        try {
            await api.reviews.submit(jobId, reviewRating, reviewComment || undefined);
            toast.success(lang === 'ru' ? 'Отзыв оставлен!' : 'Review submitted!');
            setHasReviewed(true);
            setReviewRating(0);
            setReviewComment('');
            void fetchReviews();
        } catch (e: any) {
            toast.error(err(e?.message, 'Не удалось отправить отзыв', 'Failed to submit review'));
        } finally { setReviewSubmitting(false); }
    }

    async function handleSubmitProposal(e: React.FormEvent) {
        e.preventDefault();
        setProposalSubmitting(true);
        try {
            await api.proposals.create(jobId, { proposedAmount, coverLetter: coverLetter || undefined });
            toast.success(lang === 'ru' ? 'Заявка отправлена!' : 'Proposal sent!');
            setProposedAmount(''); setCoverLetter('');
            await fetchProposals();
        } catch (e: any) { toast.error(err(e?.message, 'Не удалось отправить заявку', 'Failed to send proposal')); } finally { setProposalSubmitting(false); }
    }

    async function handleAccept(id: string) { startL(id); try { await api.proposals.accept(id); toast.success(lang === 'ru' ? 'Заявка принята!' : 'Accepted!'); await fetchJob(); await fetchProposals(); } catch (e: any) { toast.error(err(e?.message, 'Ошибка', 'Error')); } finally { stopL(id); } }
    async function handleReject(id: string) { startL(id); try { await api.proposals.reject(id); toast.success(lang === 'ru' ? 'Отклонено' : 'Rejected'); await fetchProposals(); } catch (e: any) { toast.error(err(e?.message, 'Ошибка', 'Error')); } finally { stopL(id); } }
    async function handleFund(id: string) { startL(id); try { await api.escrow.lockFunds(id); toast.success(lang === 'ru' ? 'Этап профинансирован!' : 'Funded!'); await fetchJob(); } catch (e: any) { toast.error(err(e?.message, 'Ошибка', 'Error')); } finally { stopL(id); } }
    async function handleSubmitWork(id: string) { startL(id); try { await api.escrow.submitWork(id); toast.success(lang === 'ru' ? 'Работа сдана!' : 'Submitted!'); await fetchJob(); } catch (e: any) { toast.error(err(e?.message, 'Ошибка', 'Error')); } finally { stopL(id); } }
    async function handleRelease(id: string) {
        startL(id);
        try {
            const r = await api.escrow.releaseFunds(id);
            toast.success(lang === 'ru' ? `Оплачено! Исполнитель: $${r.workerReceived}, Комиссия: $${r.platformFee}` : `Released! Worker: $${r.workerReceived}, Fee: $${r.platformFee}`);
            if (r.jobCompleted) toast.success(lang === 'ru' ? 'Заказ завершён!' : 'Job completed!');
            await fetchJob();
        } catch (e: any) { toast.error(err(e?.message, 'Ошибка', 'Error')); } finally { stopL(id); }
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

    if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="animate-spin text-gold" size={28} /></div>;
    if (!job) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-600 text-sm">{lang === 'ru' ? 'Заказ не найден' : 'Job not found'}</div>;

    const jobStatus = STATUS[job.status] || STATUS.OPEN;
    const inputStyle = 'w-full px-3.5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all';

    return (
        <div className="min-h-screen bg-[#09090b] text-white px-4 py-5 md:px-12 md:py-10">
            <div className="max-w-3xl mx-auto space-y-4">

                {/* Back */}
                <button onClick={() => router.push('/jobs')} className="flex items-center gap-1.5 text-zinc-500 text-sm active:text-white">
                    <ArrowLeft size={16} />{t('jobDetail.backToJobs')}
                </button>

                {/* Header card */}
                <div className="bg-surface border border-white/[0.04] rounded-xl p-4 md:p-6">
                    <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                            <h1 className="font-display text-xl md:text-2xl font-bold leading-tight">{job.title}</h1>
                            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{job.description}</p>
                            <div className="flex items-center gap-2 mt-3 text-xs text-zinc-600 flex-wrap">
                                <span>{t('jobDetail.postedBy')} {job.client.fullName}</span>
                                {job.deadline && <span className="flex items-center gap-1"><Clock size={11} />{new Date(job.deadline).toLocaleDateString()}</span>}
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${jobStatus.bg} ${jobStatus.color}`}>{jobStatus.label}</span>
                            <div className="font-display text-xl font-bold text-gold mt-2">${job.totalBudget}</div>
                        </div>
                    </div>

                    {(isClient || isWorker) && (
                        <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isClient ? 'bg-gold/10 text-gold' : 'bg-blue-500/10 text-blue-400'}`}>
                                {isClient ? t('jobDetail.youAreClient') : t('jobDetail.youAreWorker')}
                            </span>
                            <div className="flex items-center gap-2">
                            {job.workerId && (
                                <Link href={`/messages?job=${job.id}`}
                                    onClick={() => {}}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gold bg-gold/10 rounded-lg active:bg-gold/20">
                                    <MessageCircle size={13} />{t('msgs.chat')}
                                </Link>
                            )}
                            {isClient && job.status === 'OPEN' && (
                                <button
                                    onClick={async () => {
                                        if (!window.confirm(lang === 'ru' ? 'Удалить этот заказ?' : 'Delete this job?')) return;
                                        try { await api.jobs.delete(jobId); toast.success(lang === 'ru' ? 'Заказ удалён' : 'Job deleted'); router.push('/jobs'); } catch (e: any) { toast.error(err(e?.message, 'Ошибка', 'Error')); }
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-500/10 rounded-lg active:bg-red-500/20">
                                    <Trash2 size={13} />{lang === 'ru' ? 'Удалить' : 'Delete'}
                                </button>
                            )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Proposals section */}
                {job.status === 'OPEN' && (
                    <div className="space-y-3">
                        <h2 className="font-display text-base font-bold flex items-center gap-2"><User size={16} className="text-violet-400" />{t('jobDetail.proposals')}</h2>

                        {isVisitor && (
                            <form onSubmit={handleSubmitProposal} className="bg-surface border border-white/[0.04] rounded-xl p-4 space-y-3">
                                <h3 className="text-sm font-semibold text-zinc-300">{t('jobDetail.submitBid')}</h3>
                                <div>
                                    <label className="text-xs text-zinc-600 mb-1 block">{t('jobDetail.yourPrice')}</label>
                                    <input required type="number" min="1" step="0.01" value={proposedAmount}
                                        onChange={(e) => setProposedAmount(e.target.value)} className={inputStyle} />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-600 mb-1 block">{t('jobDetail.coverLetter')}</label>
                                    <input value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} className={inputStyle} />
                                </div>
                                <button type="submit" disabled={proposalSubmitting}
                                    className="w-full py-3 bg-gold hover:bg-gold-dim text-black font-bold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {proposalSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}{t('jobDetail.sendProposal')}
                                </button>
                            </form>
                        )}

                        {isClient && (
                            <div className="bg-surface border border-white/[0.04] rounded-xl overflow-hidden">
                                {proposals.length === 0 ? (
                                    <div className="p-6 text-center text-zinc-600 text-sm italic">{t('jobDetail.noProposals')}</div>
                                ) : (
                                    <div className="divide-y divide-white/[0.03]">
                                        {proposals.map((p) => (
                                            <div key={p.id} className="p-4 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="font-semibold text-sm">{p.worker.fullName}</span>
                                                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${p.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' : p.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                            {p.status === 'PENDING' ? (lang === 'ru' ? 'Ожидает' : 'Pending') : p.status === 'ACCEPTED' ? (lang === 'ru' ? 'Принята' : 'Accepted') : (lang === 'ru' ? 'Отклонена' : 'Rejected')}
                                                        </span>
                                                    </div>
                                                    <span className="text-base font-bold text-gold">${p.proposedAmount}</span>
                                                </div>
                                                {p.coverLetter && <p className="text-zinc-500 text-xs">{p.coverLetter}</p>}
                                                {p.status === 'PENDING' && (
                                                    <div className="flex gap-2 pt-1">
                                                        <button onClick={() => handleAccept(p.id)} disabled={actionLoading.has(p.id)}
                                                            className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5">
                                                            {actionLoading.has(p.id) ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}{t('jobDetail.accept')}
                                                        </button>
                                                        <button onClick={() => handleReject(p.id)} disabled={actionLoading.has(p.id)}
                                                            className="flex-1 py-2.5 bg-red-600/30 text-white font-bold rounded-xl text-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5">
                                                            <XCircle size={13} />{t('jobDetail.reject')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Milestones */}
                <div className="space-y-2">
                    <h2 className="font-display text-base font-bold flex items-center gap-2"><Shield size={16} className="text-gold" />{t('jobDetail.milestonesTitle')}</h2>
                    {job.milestones.sort((a, b) => a.order - b.order).map((ms, i) => {
                        const cfg = STATUS[ms.status] || STATUS.PENDING;
                        const isL = actionLoading.has(ms.id);
                        return (
                            <div key={ms.id} className="bg-surface border border-white/[0.04] rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="w-6 h-6 rounded-full bg-white/[0.03] text-zinc-500 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-sm truncate">{ms.title}</div>
                                            <div className="text-xs text-zinc-500">${ms.amount}</div>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                                </div>

                                {/* Action buttons — full width on mobile */}
                                {isClient && ms.status === 'PENDING' && ['ASSIGNED', 'IN_PROGRESS'].includes(job.status) && (
                                    <button onClick={() => handleFund(ms.id)} disabled={isL}
                                        className="w-full mt-2 py-2.5 bg-violet-600 text-white font-bold rounded-xl text-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                        {isL ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}{t('jobDetail.fund')}
                                    </button>
                                )}
                                {isWorker && ms.status === 'FUNDED' && (
                                    <button onClick={() => handleSubmitWork(ms.id)} disabled={isL}
                                        className="w-full mt-2 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                        {isL ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}{t('jobDetail.submitWork')}
                                    </button>
                                )}
                                {isClient && ms.status === 'REVIEW' && (
                                    <button onClick={() => handleRelease(ms.id)} disabled={isL}
                                        className="w-full mt-2 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                        {isL ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}{t('jobDetail.confirmPay')}
                                    </button>
                                )}
                                {ms.status === 'COMPLETED' && <div className="flex items-center gap-1.5 mt-2 text-emerald-400 text-xs"><CheckCircle2 size={14} />{t('status.completed')}</div>}
                                {ms.status === 'REVIEW' && isWorker && <div className="flex items-center gap-1.5 mt-2 text-amber-400 text-xs"><Clock size={12} />{t('jobDetail.awaitingReview')}</div>}
                            </div>
                        );
                    })}
                </div>

                {/* Job Complete banner */}
                {job.status === 'COMPLETED' && (
                    <div className="bg-gradient-to-r from-gold/[0.08] to-amber-600/[0.04] border border-gold/[0.1] rounded-xl p-6 text-center">
                        <CheckCircle2 size={32} className="text-gold mx-auto mb-2" />
                        <h3 className="font-display text-lg font-bold text-gold">{t('jobDetail.jobCompleted')}</h3>
                        <p className="text-zinc-400 text-sm mt-1">{t('jobDetail.allMilestonesDone')}</p>
                    </div>
                )}

                {/* Review section — only on completed jobs for participants */}
                {job.status === 'COMPLETED' && (isClient || isWorker) && (
                    <div className="space-y-3">
                        <h2 className="font-display text-base font-bold flex items-center gap-2">
                            <Star size={16} className="text-gold" />
                            {lang === 'ru' ? 'Отзывы' : 'Reviews'}
                        </h2>

                        {!hasReviewed && (
                            <form onSubmit={handleSubmitReview} className="bg-surface border border-white/[0.04] rounded-xl p-4 space-y-3">
                                <p className="text-sm text-zinc-400">
                                    {lang === 'ru' ? 'Оцените работу:' : 'Rate your experience:'}
                                </p>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button key={star} type="button" onClick={() => setReviewRating(star)}
                                            className="p-1 active:scale-110 transition-transform">
                                            <Star size={28} className={star <= reviewRating ? 'text-gold fill-gold' : 'text-zinc-700'} />
                                        </button>
                                    ))}
                                </div>
                                <input
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder={lang === 'ru' ? 'Комментарий (необязательно)' : 'Comment (optional)'}
                                    className={inputStyle}
                                />
                                <button type="submit" disabled={reviewSubmitting || reviewRating < 1}
                                    className="w-full py-3 bg-gold text-black font-bold rounded-xl text-sm active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2">
                                    {reviewSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                                    {lang === 'ru' ? 'Оставить отзыв' : 'Submit Review'}
                                </button>
                            </form>
                        )}

                        {hasReviewed && (
                            <div className="bg-surface border border-white/[0.04] rounded-xl p-4 text-center text-emerald-400 text-sm flex items-center justify-center gap-2">
                                <CheckCircle2 size={14} />
                                {lang === 'ru' ? 'Вы уже оставили отзыв' : 'You already left a review'}
                            </div>
                        )}

                        {jobReviews.length > 0 && (
                            <div className="space-y-2">
                                {jobReviews.map((review) => (
                                    <div key={review.id} className="bg-surface border border-white/[0.04] rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-sm">{review.reviewer.fullName}</span>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star key={s} size={12} className={s <= review.rating ? 'text-gold fill-gold' : 'text-zinc-800'} />
                                                ))}
                                            </div>
                                        </div>
                                        {review.comment && (
                                            <p className="text-xs text-zinc-500 mt-1">{review.comment}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
