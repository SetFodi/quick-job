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
        if (!background) setLoading(true);
        try {
            const [meResult, jobsResult] = await Promise.allSettled([
                api.users.getMe(),
                api.jobs.getMine(),
            ]);
            if (meResult.status !== 'fulfilled') throw meResult.reason;
            const jobsPreview = jobsResult.status === 'fulfilled' ? jobsResult.value.slice(0, 5) : [];
            profileSnapshot = { profile: meResult.value, recentJobs: jobsPreview, updatedAt: Date.now(), epoch: getCacheEpoch() };
            setProfile(meResult.value);
            setRecentJobs(jobsPreview);
            setError(null);
        } catch {
            setError(lang === 'ru' ? 'Не удалось загрузить профиль' : 'Failed to load profile');
        } finally {
            if (!background) setLoading(false);
        }
    }, [lang]);

    useEffect(() => {
        const cached = validSnapshot();
        const shouldBg = !!cached && Date.now() - cached.updatedAt < PROFILE_CACHE_TTL_MS;
        void fetchProfile(shouldBg || !!cached);
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
    };

    if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="animate-spin text-gold" size={28} /></div>;
    if (!profile) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-6 text-zinc-500 text-sm">{error || (lang === 'ru' ? 'Профиль недоступен' : 'Profile is unavailable')}</div>;

    const statCards = [
        { icon: Briefcase, label: lang === 'ru' ? 'Размещено' : 'Posted', value: profile.stats.jobsPosted, color: 'text-gold' },
        { icon: Shield, label: lang === 'ru' ? 'Выполнено' : 'Worked', value: profile.stats.jobsWorked, color: 'text-blue-400' },
        { icon: CheckCircle2, label: lang === 'ru' ? 'Завершено' : 'Done', value: profile.stats.jobsCompleted, color: 'text-emerald-400' },
        { icon: Send, label: lang === 'ru' ? 'Заявок' : 'Bids', value: profile.stats.proposalsSent, color: 'text-violet-400' },
        { icon: TrendingUp, label: lang === 'ru' ? 'Успех' : 'Rate', value: `${profile.stats.successRate}%`, color: 'text-gold' },
    ];

    return (
        <div className="min-h-screen bg-[#09090b] text-white px-4 py-5 md:px-12 md:py-10">
            <div className="max-w-3xl mx-auto space-y-5">

                {/* User card */}
                <div className="bg-surface border border-white/[0.04] rounded-xl p-4 md:p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/20 to-amber-600/10 border border-gold/20 flex items-center justify-center shrink-0">
                            <User size={22} className="text-gold" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-display text-lg font-bold truncate">{profile.fullName}</h1>
                            <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap mt-0.5">
                                <span className="flex items-center gap-1"><Mail size={11} />{profile.email}</span>
                                <span className="flex items-center gap-1"><Calendar size={11} />{new Date(profile.createdAt).toLocaleDateString()}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${profile.role === 'CLIENT' ? 'bg-gold/10 text-gold' : profile.role === 'ADMIN' ? 'bg-violet-500/10 text-violet-300' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {profile.role === 'CLIENT' ? (lang === 'ru' ? 'Заказчик' : 'Client') : profile.role === 'ADMIN' ? (lang === 'ru' ? 'Админ' : 'Admin') : (lang === 'ru' ? 'Исполнитель' : 'Worker')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {statCards.map((s, i) => (
                        <div key={i} className="bg-surface border border-white/[0.04] rounded-xl p-3 text-center">
                            <s.icon size={16} className={`${s.color} mx-auto mb-1`} />
                            <div className="font-display text-lg font-bold">{s.value}</div>
                            <div className="text-[10px] text-zinc-600">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Recent jobs */}
                <div className="space-y-2">
                    <h2 className="font-display text-base font-bold">{lang === 'ru' ? 'Недавние заказы' : 'Recent Jobs'}</h2>
                    {recentJobs.length === 0 ? (
                        <div className="bg-surface border border-white/[0.04] rounded-xl p-6 text-center text-zinc-600 text-sm italic">
                            {lang === 'ru' ? 'Пока нет заказов' : 'No jobs yet'}
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {recentJobs.map((j) => (
                                <Link key={j.id} href={`/jobs/${j.id}`}
                                    className="flex items-center justify-between bg-surface border border-white/[0.04] rounded-xl p-3.5 active:scale-[0.98] transition-all">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Briefcase size={14} className="text-zinc-600 shrink-0" />
                                        <span className="text-sm font-medium truncate">{j.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <span className="text-xs font-bold text-gold">${j.totalBudget}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${STATUS_COLORS[j.status] || 'text-zinc-500 bg-zinc-500/10'}`}>
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
