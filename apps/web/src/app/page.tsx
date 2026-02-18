import { JobStatus } from '@quick-job/shared';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8">
            <h1 className="text-4xl font-bold text-brand-700 mb-4">Quick-Job</h1>
            <p className="text-lg text-gray-600 mb-8">
                Secure freelance marketplace with escrow-protected payments.
            </p>
            <div className="flex gap-2 flex-wrap justify-center">
                {Object.values(JobStatus).map((status) => (
                    <span
                        key={status}
                        className="px-3 py-1 rounded-full text-sm font-medium bg-brand-100 text-brand-800"
                    >
                        {status}
                    </span>
                ))}
            </div>
        </main>
    );
}
