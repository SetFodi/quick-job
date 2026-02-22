'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/useAuth';
import { isChatRead } from '@/app/(protected)/messages/page';
import {
    LayoutDashboard, Briefcase, PlusCircle, User, LogOut, ShieldCheck, MessageCircle,
} from 'lucide-react';

type NavbarProps = {
    userRole: 'CLIENT' | 'WORKER' | 'ADMIN' | null;
    loading: boolean;
    logout: () => Promise<void>;
};

export default function Navbar({ userRole, loading, logout }: NavbarProps) {
    const { lang, toggle } = useLang();
    const { userId } = useAuth();
    const pathname = usePathname();
    const [hasUnread, setHasUnread] = useState(false);

    const checkUnread = useCallback(async () => {
        if (!userId) return;
        try {
            const convos = await api.messages.getConversations();
            const unread = convos.some(
                (c: { jobId: string; lastMessage: { senderId: string; createdAt: string } | null }) =>
                    c.lastMessage &&
                    c.lastMessage.senderId !== userId &&
                    !isChatRead(c.jobId, c.lastMessage.createdAt),
            );
            setHasUnread(unread);
        } catch { }
    }, [userId]);

    useEffect(() => {
        void checkUnread();
        const interval = setInterval(checkUnread, 15_000);
        const onFocus = () => void checkUnread();
        window.addEventListener('focus', onFocus);
        return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); };
    }, [checkUnread]);

    useEffect(() => {
        if (pathname.startsWith('/messages')) setHasUnread(false);
    }, [pathname]);

    const tabs = [
        { href: '/dashboard', label: lang === 'ru' ? 'Главная' : 'Home', icon: LayoutDashboard },
        { href: '/jobs', label: lang === 'ru' ? 'Заказы' : 'Jobs', icon: Briefcase },
        { href: '/jobs/new', label: lang === 'ru' ? 'Создать' : 'Post', icon: PlusCircle, accent: true },
        { href: '/messages', label: lang === 'ru' ? 'Чат' : 'Chat', icon: MessageCircle, badge: hasUnread },
        { href: '/profile', label: lang === 'ru' ? 'Профиль' : 'Profile', icon: User },
        ...(userRole === 'ADMIN' ? [{
            href: '/admin',
            label: lang === 'ru' ? 'Админ' : 'Admin',
            icon: ShieldCheck,
        }] : []),
    ];

    if (loading) return null;

    return (
        <>
            {/* Desktop top bar */}
            <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link href="/dashboard" className="font-display font-bold text-lg text-white tracking-tight">
                        Quick<span className="text-gold">Job</span>
                    </Link>

                    <div className="flex items-center gap-1">
                        {tabs.map((tab) => {
                            const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
                            const hasBadge = 'badge' in tab && tab.badge;
                            return (
                                <Link key={tab.href} href={tab.href}
                                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${active
                                        ? 'bg-gold/10 text-gold'
                                        : 'text-zinc-500 hover:text-white hover:bg-white/[0.04]'
                                    }`}>
                                    <tab.icon size={17} />
                                    {tab.label}
                                    {hasBadge && (
                                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#09090b]" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={toggle}
                            className="px-2.5 py-1 text-[10px] font-bold border border-white/[0.06] rounded-md bg-white/[0.02] text-zinc-600 uppercase tracking-widest hover:text-white transition-colors">
                            {lang === 'ru' ? 'EN' : 'RU'}
                        </button>
                        <button onClick={logout}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:text-red-400 hover:bg-red-500/5 transition-all">
                            <LogOut size={15} />
                            {lang === 'ru' ? 'Выйти' : 'Logout'}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile top bar */}
            <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="px-4 h-12 flex items-center justify-between">
                    <Link href="/dashboard" className="font-display font-bold text-base text-white tracking-tight">
                        Quick<span className="text-gold">Job</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <button onClick={toggle}
                            className="px-2 py-0.5 text-[9px] font-bold border border-white/[0.06] rounded bg-white/[0.02] text-zinc-600 uppercase tracking-widest">
                            {lang === 'ru' ? 'EN' : 'RU'}
                        </button>
                        <button onClick={logout} className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile bottom tab bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/95 backdrop-blur-xl border-t border-white/[0.06] safe-area-bottom">
                <div className="flex items-center justify-around px-2 h-16 pb-1">
                    {tabs.map((tab) => {
                        const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
                        const isAccent = 'accent' in tab && tab.accent;
                        const hasBadge = 'badge' in tab && tab.badge;
                        return (
                            <Link key={tab.href} href={tab.href}
                                className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 rounded-xl transition-all ${
                                    isAccent
                                        ? 'text-black'
                                        : active
                                            ? 'text-gold'
                                            : 'text-zinc-600'
                                }`}>
                                {isAccent ? (
                                    <span className="w-10 h-10 rounded-full bg-gold flex items-center justify-center -mt-4 shadow-lg shadow-gold/20">
                                        <tab.icon size={20} className="text-black" />
                                    </span>
                                ) : (
                                    <tab.icon size={22} />
                                )}
                                <span className={`text-[10px] font-medium ${isAccent ? 'text-gold' : ''}`}>
                                    {tab.label}
                                </span>
                                {hasBadge && (
                                    <span className="absolute top-0 right-2 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#09090b]" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
