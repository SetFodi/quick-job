'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { getSupabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Shield,
    Loader2,
    Send,
    DollarSign,
    User,
    XCircle,
    Lock,
} from 'lucide-react';

type Milestone = {
    id: string;
    title: string;
    amount: string;
    status: string;
    order: number;
};

type Proposal = {
    id: string;
    workerId: string;
    proposedAmount: string;
    coverLetter: string | null;
    status: string;
    worker: { fullName: string };
};

type Job = {
    id: string;
    title: string;
    description: string;
    category: string;
    totalBudget: string;
    deadline: string | null;
    status: string;
    clientId: string;
    workerId: string | null;
    client: { fullName: string };
    milestones: Milestone[];
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    PENDING: { color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Pending' },
    FUNDED: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Funded' },
    REVIEW: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'In Review' },
    COMPLETED: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Completed' },
    DISPUTED: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Disputed' },
    IN_PROGRESS: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'In Progress' },
    ASSIGNED: { color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Assigned' },
    OPEN: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Open' },
};

export default function JobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.id as string;

    const [job, setJob] = useState<Job | null>(null);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Proposal form state (for workers)
    const [proposedAmount, setProposedAmount] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [proposalSubmitting, setProposalSubmitting] = useState(false);

    const fetchJob = useCallback(async () => {
        try {
            const data = await api.jobs.getOne(jobId);
            setJob(data);
        } catch (err: any) {
            toast.error(err.message || 'Failed to load job');
        } finally {
            setLoading(false);
        }
    }, [jobId]);

    const fetchProposals = useCallback(async () => {
        try {
            const data = await api.proposals.getForJob(jobId);
            setProposals(data);
        } catch {
            // Non-critical — client may not own this job
        }
    }, [jobId]);

    useEffect(() => {
        async function init() {
            const supabase = getSupabase();
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                setCurrentUserId(session.user.id);
            }
            await fetchJob();
        }
        init();
    }, [fetchJob]);

    // Fetch proposals once job is loaded and we know the user
    useEffect(() => {
        if (job && currentUserId) {
            fetchProposals();
        }
    }, [job, currentUserId, fetchProposals]);

    const isClient = currentUserId === job?.clientId;
    const isWorker = currentUserId === job?.workerId;
    const isVisitor = !isClient && !isWorker;

    // ─── Proposal Actions ───
    async function handleSubmitProposal(e: React.FormEvent) {
        e.preventDefault();
        setProposalSubmitting(true);
        try {
            await api.proposals.create(jobId, {
                proposedAmount,
                coverLetter: coverLetter || undefined,
            });
            toast.success('Proposal sent! 🎯', {
                description: 'The client will review your bid.',
            });
            setProposedAmount('');
            setCoverLetter('');
            await fetchProposals();
        } catch (err: any) {
            toast.error('Failed to submit proposal', { description: err.message });
        } finally {
            setProposalSubmitting(false);
        }
    }

    async function handleAcceptProposal(proposalId: string) {
        setActionLoading(proposalId);
        try {
            await api.proposals.accept(proposalId);
            toast.success('Proposal accepted! 🤝', {
                description: 'Worker assigned. Fund milestones to begin.',
            });
            await fetchJob();
            await fetchProposals();
        } catch (err: any) {
            toast.error('Failed to accept', { description: err.message });
        } finally {
            setActionLoading(null);
        }
    }

    async function handleRejectProposal(proposalId: string) {
        setActionLoading(proposalId);
        try {
            await api.proposals.reject(proposalId);
            toast.success('Proposal rejected');
            await fetchProposals();
        } catch (err: any) {
            toast.error('Failed to reject', { description: err.message });
        } finally {
            setActionLoading(null);
        }
    }

    // ─── Escrow Actions ───
    async function handleFundMilestone(milestoneId: string) {
        setActionLoading(milestoneId);
        try {
            await api.escrow.lockFunds(milestoneId);
            toast.success('Milestone funded! 🔒', {
                description: 'Funds locked in escrow. Worker can begin.',
            });
            await fetchJob();
        } catch (err: any) {
            toast.error('Failed to fund', { description: err.message });
        } finally {
            setActionLoading(null);
        }
    }

    async function handleSubmitWork(milestoneId: string) {
        setActionLoading(milestoneId);
        try {
            await api.escrow.submitWork(milestoneId);
            toast.success('Work submitted! 📤', {
                description: 'The client will review your submission.',
            });
            await fetchJob();
        } catch (err: any) {
            toast.error('Failed to submit', { description: err.message });
        } finally {
            setActionLoading(null);
        }
    }

    async function handleRelease(milestoneId: string) {
        setActionLoading(milestoneId);
        try {
            const result = await api.escrow.releaseFunds(milestoneId);
            toast.success('Payment released! 💸', {
                description: `Worker received $${result.workerReceived}. Fee: $${result.platformFee}.`,
            });
            if (result.jobCompleted) {
                toast.success('🎉 Job completed!');
            }
            await fetchJob();
        } catch (err: any) {
            toast.error('Failed to release', { description: err.message });
        } finally {
            setActionLoading(null);
        }
    }

    // ─── Loading State ───
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-400" size={40} />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center text-gray-400">
                Job not found.
            </div>
        );
    }

    const jobStatus = STATUS_CONFIG[job.status] || STATUS_CONFIG.OPEN;

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back */}
                <button
                    onClick={() => router.push('/jobs')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                    <ArrowLeft size={16} /> Back to Jobs
                </button>

                {/* ═══ Job Header ═══ */}
                <div className="bg-[#141417] border border-white/5 rounded-3xl p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="space-y-2 flex-1">
                            <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
                            <p className="text-gray-400 leading-relaxed">{job.description}</p>
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <span className="text-xs text-gray-500">
                                    Posted by {job.client.fullName}
                                </span>
                                <span className="text-xs text-gray-600 capitalize px-2 py-0.5 bg-white/5 rounded">
                                    {job.category}
                                </span>
                                {job.deadline && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock size={11} />
                                        {new Date(job.deadline).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0">
                            <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${jobStatus.bg} ${jobStatus.color}`}>
                                {jobStatus.label}
                            </span>
                            <div className="text-2xl font-bold text-emerald-400">${job.totalBudget}</div>
                        </div>
                    </div>

                    {(isClient || isWorker) && (
                        <div className="mt-6 pt-4 border-t border-white/5">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isClient ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                                }`}>
                                {isClient ? '👤 You are the Client' : '🔧 You are the Worker'}
                            </span>
                        </div>
                    )}
                </div>

                {/* ═══ PROPOSAL SECTION (only for OPEN jobs) ═══ */}
                {job.status === 'OPEN' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <User size={20} className="text-purple-400" />
                            Proposals
                        </h2>

                        {/* Worker: Submit a bid */}
                        {isVisitor && (
                            <form onSubmit={handleSubmitProposal} className="bg-[#141417] border border-white/5 rounded-2xl p-6 space-y-4">
                                <h3 className="text-sm font-semibold text-gray-300">Submit Your Bid</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Your Price ($)</label>
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            value={proposedAmount}
                                            onChange={(e) => setProposedAmount(e.target.value)}
                                            placeholder="250.00"
                                            className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-gray-500 mb-1 block">Cover Letter (optional)</label>
                                        <input
                                            value={coverLetter}
                                            onChange={(e) => setCoverLetter(e.target.value)}
                                            placeholder="Why are you the best fit?"
                                            className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={proposalSubmitting}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {proposalSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    Send Proposal
                                </button>
                            </form>
                        )}

                        {/* Client: View proposals */}
                        {isClient && (
                            <div className="bg-[#141417] border border-white/5 rounded-2xl overflow-hidden">
                                {proposals.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 italic">
                                        No proposals yet. Workers will bid on your job soon.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {proposals.map((p) => (
                                            <div key={p.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/[0.02] transition-colors">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold">{p.worker.fullName}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'PENDING'
                                                                ? 'bg-amber-500/10 text-amber-400'
                                                                : p.status === 'ACCEPTED'
                                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                                    : 'bg-red-500/10 text-red-400'
                                                            }`}>
                                                            {p.status}
                                                        </span>
                                                    </div>
                                                    {p.coverLetter && (
                                                        <p className="text-gray-400 text-sm">{p.coverLetter}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-bold text-emerald-400">
                                                        ${p.proposedAmount}
                                                    </span>
                                                    {p.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleAcceptProposal(p.id)}
                                                                disabled={actionLoading === p.id}
                                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                                                            >
                                                                {actionLoading === p.id
                                                                    ? <Loader2 size={12} className="animate-spin" />
                                                                    : <CheckCircle2 size={12} />}
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectProposal(p.id)}
                                                                disabled={actionLoading === p.id}
                                                                className="px-4 py-2 bg-red-600/50 hover:bg-red-600 text-white font-semibold rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                                                            >
                                                                <XCircle size={12} />
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ MILESTONES ═══ */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Shield size={20} className="text-blue-400" />
                        Milestones
                    </h2>

                    {job.milestones
                        .sort((a, b) => a.order - b.order)
                        .map((milestone, index) => {
                            const config = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.PENDING;
                            const isLoadingThis = actionLoading === milestone.id;

                            return (
                                <div
                                    key={milestone.id}
                                    className="bg-[#141417] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all"
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-gray-400 text-sm font-bold shrink-0 mt-0.5">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-lg">{milestone.title}</div>
                                                <div className="text-gray-400 text-sm mt-1">${milestone.amount}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                                                {config.label}
                                            </span>

                                            {/* Client: Fund milestone (when PENDING and job is ASSIGNED or IN_PROGRESS) */}
                                            {isClient && milestone.status === 'PENDING' && ['ASSIGNED', 'IN_PROGRESS'].includes(job.status) && (
                                                <button
                                                    onClick={() => handleFundMilestone(milestone.id)}
                                                    disabled={isLoadingThis}
                                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {isLoadingThis ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                                                    Fund
                                                </button>
                                            )}

                                            {/* Worker: Submit work (when FUNDED) */}
                                            {isWorker && milestone.status === 'FUNDED' && (
                                                <button
                                                    onClick={() => handleSubmitWork(milestone.id)}
                                                    disabled={isLoadingThis}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {isLoadingThis ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                                    Submit Work
                                                </button>
                                            )}

                                            {/* Client: Release payment (when REVIEW) */}
                                            {isClient && milestone.status === 'REVIEW' && (
                                                <button
                                                    onClick={() => handleRelease(milestone.id)}
                                                    disabled={isLoadingThis}
                                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {isLoadingThis ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
                                                    Confirm & Pay
                                                </button>
                                            )}

                                            {/* Completed indicator */}
                                            {milestone.status === 'COMPLETED' && (
                                                <CheckCircle2 size={20} className="text-emerald-400" />
                                            )}

                                            {/* Review indicator for worker */}
                                            {milestone.status === 'REVIEW' && isWorker && (
                                                <span className="text-xs text-amber-400 flex items-center gap-1">
                                                    <Clock size={12} /> Awaiting Review
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>

                {/* Job Completed Banner */}
                {job.status === 'COMPLETED' && (
                    <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 border border-emerald-500/20 rounded-2xl p-6 text-center">
                        <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
                        <h3 className="text-xl font-bold text-emerald-300">Job Completed! 🎉</h3>
                        <p className="text-gray-300 mt-1">All milestones fulfilled and payments released.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
