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
    AlertTriangle,
    Loader2,
    Send,
    DollarSign,
} from 'lucide-react';

type Milestone = {
    id: string;
    title: string;
    amount: string;
    status: string;
    orderIndex: number;
};

type Job = {
    id: string;
    title: string;
    description: string;
    budget: string;
    status: string;
    clientId: string;
    workerId: string | null;
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
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

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

    const isClient = currentUserId === job?.clientId;
    const isWorker = currentUserId === job?.workerId;

    async function handleSubmitWork(milestoneId: string) {
        setActionLoading(milestoneId);
        try {
            await api.escrow.submitWork(milestoneId);
            toast.success('Work submitted for review!', {
                description: 'The client will review your submission.',
            });
            await fetchJob();
        } catch (err: any) {
            toast.error('Failed to submit work', { description: err.message });
        } finally {
            setActionLoading(null);
        }
    }

    async function handleRelease(milestoneId: string) {
        setActionLoading(milestoneId);
        try {
            const result = await api.escrow.releaseFunds(milestoneId);
            toast.success('Payment released! 💸', {
                description: `Worker received $${result.workerReceived}. Platform fee: $${result.platformFee}.`,
            });
            if (result.jobCompleted) {
                toast.success('🎉 Job completed!', {
                    description: 'All milestones are done. Great work!',
                });
            }
            await fetchJob();
        } catch (err: any) {
            toast.error('Failed to release payment', { description: err.message });
        } finally {
            setActionLoading(null);
        }
    }

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
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                {/* Job Header */}
                <div className="bg-[#141417] border border-white/5 rounded-3xl p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
                            <p className="text-gray-400 leading-relaxed max-w-2xl">{job.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${jobStatus.bg} ${jobStatus.color}`}>
                                {jobStatus.label}
                            </span>
                            <div className="text-2xl font-bold text-emerald-400">${job.budget}</div>
                        </div>
                    </div>

                    {/* Role Badge */}
                    {(isClient || isWorker) && (
                        <div className="mt-6 pt-6 border-t border-white/5">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isClient
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-blue-500/10 text-blue-400'
                                }`}>
                                {isClient ? '👤 You are the Client' : '🔧 You are the Worker'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Milestones */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Shield size={20} className="text-blue-400" />
                        Milestones
                    </h2>

                    {job.milestones
                        .sort((a, b) => a.orderIndex - b.orderIndex)
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

                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                                                {config.label}
                                            </span>

                                            {/* Worker: Submit Work (when FUNDED) */}
                                            {isWorker && milestone.status === 'FUNDED' && (
                                                <button
                                                    onClick={() => handleSubmitWork(milestone.id)}
                                                    disabled={isLoadingThis}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {isLoadingThis ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Send size={14} />
                                                    )}
                                                    Submit Work
                                                </button>
                                            )}

                                            {/* Client: Confirm & Pay (when REVIEW) */}
                                            {isClient && milestone.status === 'REVIEW' && (
                                                <button
                                                    onClick={() => handleRelease(milestone.id)}
                                                    disabled={isLoadingThis}
                                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {isLoadingThis ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <DollarSign size={14} />
                                                    )}
                                                    Confirm & Pay
                                                </button>
                                            )}

                                            {/* Completed indicator */}
                                            {milestone.status === 'COMPLETED' && (
                                                <CheckCircle2 size={20} className="text-emerald-400" />
                                            )}

                                            {/* Review indicator for non-client */}
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
                        <p className="text-gray-300 mt-1">All milestones have been fulfilled and payments released.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
