'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { Search, Clock, DollarSign, Plus } from 'lucide-react';

type Job = {
    id: string;
    title: string;
    description: string;
    category: string;
    totalBudget: string;
    deadline: string | null;
    status: string;
    client: { fullName: string };
};

const CATEGORIES = ['all', 'construction', 'digital', 'household', 'other'] as const;

export default function JobsPage() {
    const { t, lang, toggle } = useLang();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    useEffect(() => {
        async function fetchJobs() {
            try {
                const data = await api.jobs.getAll();
                setJobs(data);
            } catch { }
            finally { setLoading(false); }
        }
        fetchJobs();
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
        <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in">
                    <div>
                        <h1 className="font-display text-3xl font-bold tracking-tight">{t('jobsList.title')}</h1>
                        <p className="text-zinc-500 mt-1">{t('jobsList.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={toggle}
                            className="px-3 py-1.5 text-xs font-bold border border-white/[0.06] rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-all text-zinc-500 uppercase tracking-widest">
                            {lang === 'ru' ? 'EN' : 'RU'}
                        </button>
                        <Link href="/dashboard" className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">{t('nav.dashboard')}</Link>
                        <Link href="/jobs/new"
                            className="px-5 py-2.5 bg-gold text-black font-bold rounded-xl hover:bg-gold-dim transition-all active:scale-95 text-sm flex items-center gap-2">
                            <Plus size={16} />{t('nav.postJob')}
                        </Link>
                    </div>
                </div>

                {/* Search + Filter */}
                <div className="flex flex-col md:flex-row gap-4 animate-in" style={{ animationDelay: '0.1s' }}>
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('jobsList.search')}
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-surface border border-white/[0.04] text-sm placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-transparent transition-all"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {CATEGORIES.map((cat) => (
                            <button key={cat} onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === cat
                                    ? 'bg-gold text-black font-bold'
                                    : 'bg-surface border border-white/[0.04] text-zinc-500 hover:text-white hover:border-white/[0.08]'
                                    }`}>
                                {catLabels[cat]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Jobs Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-surface border border-white/[0.04] rounded-2xl p-6 space-y-4 animate-pulse">
                                <div className="h-5 w-3/4 bg-white/[0.03] rounded" />
                                <div className="h-3 w-full bg-white/[0.03] rounded" />
                                <div className="h-3 w-2/3 bg-white/[0.03] rounded" />
                                <div className="flex gap-4 mt-4">
                                    <div className="h-4 w-20 bg-white/[0.03] rounded" />
                                    <div className="h-4 w-24 bg-white/[0.03] rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-zinc-600 italic animate-in">{t('jobsList.noJobs')}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map((job, i) => (
                            <Link key={job.id} href={`/jobs/${job.id}`}
                                className="bg-surface border border-white/[0.04] rounded-2xl p-6 hover:border-gold/20 hover:shadow-[0_0_30px_rgba(245,158,11,0.04)] transition-all group animate-in"
                                style={{ animationDelay: `${0.15 + i * 0.05}s` }}>
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-display font-semibold text-lg group-hover:text-gold transition-colors leading-tight">
                                        {job.title}
                                    </h3>
                                    <span className="text-xs text-zinc-700 capitalize px-2 py-0.5 bg-white/[0.03] rounded shrink-0 ml-2">
                                        {job.category}
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-500 line-clamp-2 mb-4 leading-relaxed">{job.description}</p>
                                <div className="flex items-center gap-4 text-sm text-zinc-600">
                                    <span className="flex items-center gap-1.5 font-semibold text-gold">
                                        <DollarSign size={14} />${job.totalBudget}
                                    </span>
                                    {job.deadline && (
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={13} />{new Date(job.deadline).toLocaleDateString()}
                                        </span>
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
