'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const JOB_CATEGORIES = [
    { value: 'construction', label: 'Construction' },
    { value: 'digital', label: 'Digital / IT' },
    { value: 'household', label: 'Household' },
    { value: 'other', label: 'Other' },
];

type MilestoneRow = { title: string; amount: string };

export default function CreateJobPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [totalBudget, setTotalBudget] = useState('');
    const [deadline, setDeadline] = useState('');
    const [milestones, setMilestones] = useState<MilestoneRow[]>([
        { title: '', amount: '' },
    ]);

    const milestoneSum = milestones.reduce(
        (sum, m) => sum + (parseFloat(m.amount) || 0),
        0,
    );
    const budgetNum = parseFloat(totalBudget) || 0;
    const budgetMatch = budgetNum > 0 && Math.abs(milestoneSum - budgetNum) < 0.01;

    function addMilestone() {
        setMilestones([...milestones, { title: '', amount: '' }]);
    }

    function removeMilestone(index: number) {
        if (milestones.length <= 1) return;
        setMilestones(milestones.filter((_, i) => i !== index));
    }

    function updateMilestone(index: number, field: keyof MilestoneRow, value: string) {
        const updated = [...milestones];
        updated[index] = { ...updated[index], [field]: value };
        setMilestones(updated);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!budgetMatch) {
            toast.error('Milestone amounts must equal the total budget');
            return;
        }

        setSubmitting(true);
        try {
            const job = await api.jobs.create({
                title,
                category,
                description,
                totalBudget,
                deadline,
                milestones: milestones.map((m, i) => ({
                    title: m.title,
                    amount: m.amount,
                    order: i + 1,
                })),
            });
            toast.success('Job posted! 🎉', {
                description: 'Workers can now see and bid on your job.',
            });
            router.push(`/jobs/${job.id}`);
        } catch (err: any) {
            toast.error('Failed to create job', { description: err.message });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white p-6 md:p-12">
            <div className="max-w-2xl mx-auto">
                <Link
                    href="/jobs"
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-8"
                >
                    <ArrowLeft size={16} /> Back to Job Board
                </Link>

                <h1 className="text-3xl font-bold tracking-tight mb-2">Post a New Job</h1>
                <p className="text-gray-400 mb-8">Describe the work, set milestones, and find your worker.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
                        <input
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Fix my apartment roof"
                            className="w-full px-4 py-3 bg-[#141417] border border-white/10 rounded-xl text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                        <select
                            required
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-[#141417] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                        >
                            <option value="">Select a category</option>
                            {JOB_CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                        <textarea
                            required
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the work in detail..."
                            className="w-full px-4 py-3 bg-[#141417] border border-white/10 rounded-xl text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                        />
                    </div>

                    {/* Budget + Deadline */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Total Budget ($)</label>
                            <input
                                required
                                type="number"
                                min="1"
                                step="0.01"
                                value={totalBudget}
                                onChange={(e) => setTotalBudget(e.target.value)}
                                placeholder="500.00"
                                className="w-full px-4 py-3 bg-[#141417] border border-white/10 rounded-xl text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Deadline</label>
                            <input
                                required
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full px-4 py-3 bg-[#141417] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Milestones */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-medium text-gray-300">
                                Milestones
                            </label>
                            <button
                                type="button"
                                onClick={addMilestone}
                                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                <Plus size={14} /> Add Milestone
                            </button>
                        </div>

                        <div className="space-y-3">
                            {milestones.map((m, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-600 font-mono w-6 text-center shrink-0">
                                        {i + 1}
                                    </span>
                                    <input
                                        required
                                        value={m.title}
                                        onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                                        placeholder="Milestone title"
                                        className="flex-1 px-4 py-2.5 bg-[#141417] border border-white/10 rounded-xl text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                    <input
                                        required
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={m.amount}
                                        onChange={(e) => updateMilestone(i, 'amount', e.target.value)}
                                        placeholder="$"
                                        className="w-28 px-4 py-2.5 bg-[#141417] border border-white/10 rounded-xl text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeMilestone(i)}
                                        disabled={milestones.length <= 1}
                                        className="p-2 text-gray-600 hover:text-red-400 transition-colors disabled:opacity-20"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Budget Validation */}
                        {totalBudget && (
                            <div className={`mt-3 text-xs font-medium ${budgetMatch ? 'text-emerald-400' : 'text-amber-400'
                                }`}>
                                Milestone total: ${milestoneSum.toFixed(2)} / ${budgetNum.toFixed(2)}
                                {budgetMatch ? ' ✓' : ' — must match budget'}
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting || !budgetMatch}
                        className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Posting...
                            </>
                        ) : (
                            'Post Job →'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
