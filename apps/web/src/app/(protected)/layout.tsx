'use client';

import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/useAuth';
import { Loader2 } from 'lucide-react';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const { userRole, loading, logout } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <Loader2 className="animate-spin text-gold" size={32} />
            </div>
        );
    }

    return (
        <>
            <Navbar userRole={userRole} loading={loading} logout={logout} />
            <main className="pt-14">
                {children}
            </main>
        </>
    );
}
