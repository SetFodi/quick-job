'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import {
    Search,
    MapPin,
    Clock,
    DollarSign,
    ChevronRight,
    Briefcase,
    Hammer,
    Monitor,
    Home,
    Sparkles,
    Filter,
} from 'lucide-react';

const CATEGORIES = [
    { id: 'all', label: 'All Jobs', icon: Briefcase },
    { id: 'construction', label: 'Construction', icon: Hammer },
    { id: 'digital', label: 'Digital', icon: Monitor },
    { id: 'household', label: 'Household', icon: Home },
    { id: 'other', label: 'Other', icon: Sparkles },
];

type Job = {
    id: string;
    title: string;
    description: string;
    category: string;
    totalBudget: string;
    deadline: string | null;
    status: string;
    client: { fullName: string };
    milestones: { id: string; title: string; amount: string; status: string }[];
};

function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'No deadline';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetch() {
            try {
                const data = await api.jobs.getAll();
                setJobs(data);
            } catch (err) {
                console.error('Failed to fetch jobs', err);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    const filtered = jobs.filter((job) => {
        const matchesCategory =
            activeCategory === 'all' || job.category.toLowerCase() === activeCategory;
        const matchesSearch =
            !searchQuery ||
            job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white">
            {/* Header */}
            <div className="border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Job Board
                        </h1>
                        <p className="text-gray-400 text-sm mt-0.5">
                            {filtered.length} {filtered.length === 1 ? 'job' : 'jobs'} available
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-72">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search jobs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-[#141417] border border-white/10 rounded-xl text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                        <Link
                            href="/jobs/new"
                            className="px-5 py-2.5 bg-white text-black font-semibold rounded-xl text-sm hover:bg-gray-200 transition-all active:scale-95 shrink-0"
                        >
                            + Post Job
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Category Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-6 mb-2 scrollbar-hide">
                    <Filter size={14} className="text-gray-500 shrink-0" />
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const active = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${active
                                        ? 'bg-white text-black'
                                        : 'bg-[#141417] text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                                    }`}
                            >
                                <Icon size={14} />
                                {cat.label}
                            </button>
                        );
                    })}
                </div>

                {/* Jobs Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-[#141417] border border-white/5 rounded-2xl p-6 animate-pulse">
                                <div className="h-5 w-48 bg-white/5 rounded mb-3" />
                                <div className="h-4 w-full bg-white/5 rounded mb-2" />
                                <div className="h-4 w-3/4 bg-white/5 rounded mb-6" />
                                <div className="flex gap-4">
                                    <div className="h-8 w-20 bg-white/5 rounded-lg" />
                                    <div className="h-8 w-20 bg-white/5 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Briefcase size={48} className="text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-300">No jobs found</h3>
                        <p className="text-gray-500 mt-1">
                            {searchQuery ? 'Try a different search term.' : 'Check back soon or post your own!'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filtered.map((job) => (
                            <Link
                                key={job.id}
                                href={`/jobs/${job.id}`}
                                className="group bg-[#141417] border border-white/5 rounded-2xl p-6 hover:border-white/15 hover:bg-[#18181c] transition-all"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-lg font-semibold group-hover:text-blue-400 transition-colors line-clamp-1 pr-4">
                                        {job.title}
                                    </h3>
                                    <ChevronRight size={18} className="text-gray-600 group-hover:text-blue-400 transition-colors shrink-0 mt-1" />
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-5">
                                    {job.description}
                                </p>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                                        <DollarSign size={14} />
                                        {job.totalBudget}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                                        <Clock size={12} />
                                        {formatDate(job.deadline)}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-gray-400 capitalize">
                                        {job.category}
                                    </span>
                                    <span className="text-xs text-gray-600 ml-auto">
                                        {job.milestones.length} milestone{job.milestones.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        Posted by {job.client.fullName}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
