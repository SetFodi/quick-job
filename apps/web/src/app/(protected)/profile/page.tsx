'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, getCacheEpoch } from '@/lib/api-client';
import { useLang } from '@/lib/i18n';
import Link from 'next/link';
import {
    User, Briefcase, CheckCircle2, Send, TrendingUp,
    Calendar, Mail, Shield, Loader2,
} from 'lucide-react';

type Profile = {
    id: string;
    email: string;
    fullName: string;
    role: string;
    createdAt: string;
    stats: {
        jobsPosted: number;
        jobsWorked: number;
        jobsCompleted: number;
        proposalsSent: number;
        successRate: number;
    };
};

type MyJob = {
    id: string;
    title: string;
    status: string;
    totalBudget: string;
    clientId: string;
};

type ProfileSnapshot = {
    profile: Profile | null;
    recentJobs: MyJob[];
    updatedAt: number;
    epoch: number;
};

const PROFILE_CACHE_TTL_MS = 30_000;
let profileSnapshot: ProfileSnapshot | null = null;

function validSnapshot() {
    return profileSnapshot && profileSnapshot.epoch === getCacheEpoch()
        ? profileSnapshot
        : null;
}

export default function ProfilePage() {
    const { lang } = useLang();
    const snap = validSnapshot();
    const [profile, setProfile] = useState<Profile | null>(snap?.profile ?? null);
    const [recentJobs, setRecentJobs] = useState<MyJob[]>(snap?.recentJobs ?? []);
    const [loading, setLoading] = useState(!snap);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async (background = false) => {
        if (!background) {
            setLoading(true);
        }

        try {
            const [meResult, jobsResult] = await Promise.allSettled([
                api.users.getMe(),
                api.jobs.getMine(),
            ]);

            if (meResult.status !== 'fulfilled') {
                throw meResult.reason;
            }

            const jobsPreview = jobsResult.status === 'fulfilled'
                ? jobsResult.value.slice(0, 5)
                : [];

            profileSnapshot = {
                profile: meResult.value,
                recentJobs: jobsPreview,
                updatedAt: Date.now(),
                epoch: getCacheEpoch(),
            };
            setProfile(meResult.value);
            setRecentJobs(jobsPreview);
            setError(null);
        } catch {
            setError(lang === 'ru' ? 'Не удалось загрузить профиль' : 'Failed to load profile');
        } finally {
            if (!background) {
                setLoading(false);
            }
        }
    }, [lang]);

    useEffect(() => {
        const cached = validSnapshot();
        const shouldBackgroundRefresh = !!cached
            && Date.now() - cached.updatedAt < PROFILE_CACHE_TTL_MS;
        void fetchProfile(shouldBackgroundRefresh || !!cached);
    }, [fetchProfile]);

    const STATUS_COLORS: Record<string, string> = {
        OPEN: 'text-gold bg-gold/10', ASSIGNED: 'text-violet-400 bg-violet-500/10',
        IN_PROGRESS: 'text-blue-400 bg-blue-500/10', COMPLETED: 'text-emerald-400 bg-emerald-500/10',
    };
    const STATUS_LABELS: Record<string, string> = {
        OPEN: lang === 'ru' ? 'Открыт' : 'Open',
        ASSIGNED: lang === 'ru' ? 'Назначен' : 'Assigned',
        IN_PROGRESS: lang === 'ru' ? 'В работе' : 'In Progress',
        REVIEW: lang === 'ru' ? 'На проверке' : 'In Review',
        COMPLETED: lang === 'ru' ? 'Завершен' : 'Completed',
        DISPUTED: lang === 'ru' ? 'Спор' : 'Disputed',
    };

    if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="animate-spin text-gold" size={32} /></div>;
    if (!profile) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-6 text-zinc-500">
                {error || (lang === 'ru' ? 'Профиль недоступен' : 'Profile is unavailable')}
            </div>
        );
    }

    const statCards = [
        { icon: Briefcase, label: lang === 'ru' ? 'Заказов размещено' : 'Jobs Posted', value: profile.stats.jobsPosted, color: 'text-gold' },
        { icon: Shield, label: lang === 'ru' ? 'Работ выполнено' : 'Jobs Worked', value: profile.stats.jobsWorked, color: 'text-blue-400' },
        { icon: CheckCircle2, label: lang === 'ru' ? 'Завершено' : 'Completed', value: profile.stats.jobsCompleted, color: 'text-emerald-400' },
        { icon: Send, label: lang === 'ru' ? 'Заявок подано' : 'Proposals Sent', value: profile.stats.proposalsSent, color: 'text-violet-400' },
        { icon: TrendingUp, label: lang === 'ru' ? 'Успешность' : 'Success Rate', value: `${profile.stats.successRate}%`, color: 'text-gold' },
    ];

    return (
        <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* User card */}
                <div className="bg-surface border border-white/[0.04] rounded-2xl p-8 animate-in">
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/20 to-amber-600/10 border border-gold/20 flex items-center justify-center shrink-0">
                            <User size={28} className="text-gold" />
                        </div>
                        <div className="flex-1">
                            <h1 className="font-display text-2xl font-bold">{profile.fullName}</h1>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                <span className="flex items-center gap-1.5 text-sm text-zinc-500">
                                    <Mail size={14} />{profile.email}
                                </span>
                                <span className="flex items-center gap-1.5 text-sm text-zinc-500">
                                    <Calendar size={14} />{lang === 'ru' ? 'С' : 'Since'} {new Date(profile.createdAt).toLocaleDateString()}
                                </span>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${profile.role === 'CLIENT' ? 'bg-gold/10 text-gold' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {profile.role === 'CLIENT'
                                        ? (lang === 'ru' ? 'Заказчик' : 'Client')
                                        : profile.role === 'ADMIN'
                                            ? (lang === 'ru' ? 'Администратор' : 'Admin')
                                            : (lang === 'ru' ? 'Исполнитель' : 'Worker')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-in" style={{ animationDelay: '0.1s' }}>
                    {statCards.map((s, i) => (
                        <div key={i} className="bg-surface border border-white/[0.04] rounded-xl p-4 text-center hover:border-white/[0.08] transition-all">
                            <s.icon size={20} className={`${s.color} mx-auto mb-2`} />
                            <div className="font-display text-xl font-bold">{s.value}</div>
                            <div className="text-xs text-zinc-600 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Recent jobs */}
                <div className="space-y-3 animate-in" style={{ animationDelay: '0.2s' }}>
                    <h2 className="font-display text-lg font-bold">{lang === 'ru' ? 'Недавние заказы' : 'Recent Jobs'}</h2>
                    {recentJobs.length === 0 ? (
                        <div className="bg-surface border border-white/[0.04] rounded-xl p-8 text-center text-zinc-600 italic">
                            {lang === 'ru' ? 'Пока нет заказов' : 'No jobs yet'}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentJobs.map((j) => (
                                <Link key={j.id} href={`/jobs/${j.id}`}
                                    className="flex items-center justify-between bg-surface border border-white/[0.04] rounded-xl p-4 hover:border-gold/20 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <Briefcase size={16} className="text-zinc-600" />
                                        <span className="font-medium group-hover:text-gold transition-colors">{j.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-gold">${j.totalBudget}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[j.status] || 'text-zinc-500 bg-zinc-500/10'}`}>
                                            {STATUS_LABELS[j.status] || j.status}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
