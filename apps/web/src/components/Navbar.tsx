'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import {
    LayoutDashboard, Briefcase, PlusCircle, User, LogOut, ShieldCheck,
} from 'lucide-react';

type NavbarProps = {
    userRole: 'CLIENT' | 'WORKER' | 'ADMIN' | null;
    loading: boolean;
    logout: () => Promise<void>;
};

export default function Navbar({ userRole, loading, logout }: NavbarProps) {
    const { lang, toggle } = useLang();
    const pathname = usePathname();

    const links = [
        { href: '/dashboard', label: lang === 'ru' ? 'Панель' : 'Dashboard', icon: LayoutDashboard },
        { href: '/jobs', label: lang === 'ru' ? 'Заказы' : 'Jobs', icon: Briefcase },
        { href: '/jobs/new', label: lang === 'ru' ? 'Создать' : 'Post', icon: PlusCircle },
        { href: '/profile', label: lang === 'ru' ? 'Профиль' : 'Profile', icon: User },
    ];

    if (userRole === 'ADMIN') {
        links.push({
            href: '/admin',
            label: lang === 'ru' ? 'Админ' : 'Admin',
            icon: ShieldCheck,
        });
    }

    if (loading) return null;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.04]">
            <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                {/* Logo */}
                <Link href="/dashboard" className="font-display font-bold text-lg text-white tracking-tight">
                    Quick<span className="text-gold">Job</span>
                </Link>

                {/* Nav links */}
                <div className="flex items-center gap-1">
                    {links.map((l) => {
                        const active = pathname === l.href || pathname.startsWith(l.href + '/');
                        return (
                            <Link key={l.href} href={l.href}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${active
                                    ? 'bg-gold/10 text-gold'
                                    : 'text-zinc-500 hover:text-white hover:bg-white/[0.04]'
                                    }`}>
                                <l.icon size={16} />
                                <span className="hidden md:inline">{l.label}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    <button onClick={toggle}
                        className="px-2.5 py-1 text-[10px] font-bold border border-white/[0.06] rounded-md bg-white/[0.02] text-zinc-600 uppercase tracking-widest hover:text-white transition-colors">
                        {lang === 'ru' ? 'EN' : 'RU'}
                    </button>
                    <button onClick={logout}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:text-red-400 hover:bg-red-500/5 transition-all">
                        <LogOut size={15} />
                        <span className="hidden md:inline">{lang === 'ru' ? 'Выйти' : 'Logout'}</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
