'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { Search, DollarSign, Loader2, MapPin } from 'lucide-react';

type Job = {
    id: string;
    title: string;
    description: string;
    category: string;
    totalBudget: string;
    deadline: string | null;
    status: string;
    client: { fullName: string };
    createdAt?: string;
};

const CATEGORIES = ['all', 'construction', 'digital', 'household', 'other'] as const;

function timeAgo(dateStr: string | undefined, lang: string) {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 3600) return lang === 'ru' ? `${Math.floor(diff / 60)} мин` : `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return lang === 'ru' ? `${Math.floor(diff / 3600)} ч` : `${Math.floor(diff / 3600)}h`;
    return lang === 'ru' ? `${Math.floor(diff / 86400)} дн` : `${Math.floor(diff / 86400)}d`;
}

export default function JobsPage() {
    const { t, lang } = useLang();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    useEffect(() => {
        api.jobs.getAll()
            .then(setJobs)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const catLabels: Record<string, string> = {
        all: t('jobsList.all'),
        construction: t('jobsList.construction'),
        digital: t('jobsList.digital'),
        household: t('jobsList.household'),
        other: t('jobsList.other'),
    };

    const filtered = jobs.filter((job) => {
        const matchCat = activeCategory === 'all' || job.category.toLowerCase() === activeCategory;
        const matchSearch = !searchQuery ||
            job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
    });

    return (
        <div className="min-h-screen bg-[#09090b] text-white px-4 py-4 md:px-12 md:py-10">
            <div className="max-w-5xl mx-auto space-y-3">

                {/* Search */}
                <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('jobsList.search')}
                        className="w-full pl-10 pr-4 py-3 rounded-full bg-surface border border-white/[0.04] text-sm placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all"
                    />
                </div>

                {/* Category pills */}
                <div className="flex gap-2 overflow-x-auto -mx-4 px-4 scrollbar-hide">
                    {CATEGORIES.map((cat) => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat
                                ? 'bg-gold text-black font-bold'
                                : 'bg-surface border border-white/[0.04] text-zinc-500 active:bg-white/[0.04]'
                            }`}>
                            {catLabels[cat]}
                        </button>
                    ))}
                </div>

                {/* Feed */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="animate-spin text-gold" size={28} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-zinc-600 text-sm">{t('jobsList.noJobs')}</div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((job) => (
                            <Link key={job.id} href={`/jobs/${job.id}`}
                                className="block bg-surface border border-white/[0.04] rounded-xl p-4 active:scale-[0.98] transition-all">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <h3 className="font-semibold text-[15px] leading-snug">{job.title}</h3>
                                    <span className="text-base font-bold text-gold shrink-0">${job.totalBudget}</span>
                                </div>
                                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-2">{job.description}</p>
                                <div className="flex items-center gap-3 text-[11px] text-zinc-600">
                                    <span className="px-2 py-0.5 bg-white/[0.03] rounded-full capitalize">{catLabels[job.category.toLowerCase()] || job.category}</span>
                                    <span>{job.client.fullName}</span>
                                    {job.createdAt && <span>{timeAgo(job.createdAt, lang)}</span>}
                                    {job.deadline && (
                                        <span>{lang === 'ru' ? 'до' : 'by'} {new Date(job.deadline).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
