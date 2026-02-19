'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { api, clearApiAuthCache } from '@/lib/api-client';

type AppRole = 'CLIENT' | 'WORKER' | 'ADMIN' | null;

const roleCache = new Map<string, AppRole>();
const roleRequestCache = new Map<string, Promise<AppRole>>();

function normalizeRole(value: unknown): AppRole {
    if (value === 'CLIENT' || value === 'WORKER' || value === 'ADMIN') {
        return value;
    }
    return null;
}

async function resolveUserRole(userId: string, fallbackRole: AppRole): Promise<AppRole> {
    const cached = roleCache.get(userId);
    if (cached) {
        return cached;
    }

    const inFlight = roleRequestCache.get(userId);
    if (inFlight) {
        return inFlight;
    }

    const request = api.users
        .getMe()
        .then((me) => normalizeRole(me.role) ?? fallbackRole)
        .catch(() => fallbackRole)
        .finally(() => {
            roleRequestCache.delete(userId);
        });

    roleRequestCache.set(userId, request);
    const resolved = await request;
    if (resolved) {
        roleCache.set(userId, resolved);
    }
    return resolved;
}

export function useAuth() {
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<AppRole>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let isActive = true;

        async function check() {
            const { data: { session } } = await getSupabase().auth.getSession();
            if (!session) {
                if (!isActive) {
                    return;
                }
                setLoading(false);
                router.replace('/login');
                return;
            }

            if (!isActive) {
                return;
            }

            const metadataRole = normalizeRole(session.user.user_metadata?.role);
            const cachedRole = roleCache.get(session.user.id) ?? metadataRole;

            setUserId(session.user.id);
            setUserEmail(session.user.email ?? null);
            setUserRole(cachedRole);
            setLoading(false);

            void resolveUserRole(session.user.id, metadataRole).then((resolvedRole) => {
                if (!isActive) {
                    return;
                }
                setUserRole(resolvedRole);
            }).catch(() => {
                if (isActive) {
                    setUserRole(metadataRole);
                }
            });
        }

        check();

        return () => {
            isActive = false;
        };
    }, [router]);

    async function logout() {
        if (userId) {
            roleCache.delete(userId);
            roleRequestCache.delete(userId);
        }
        clearApiAuthCache();
        setUserId(null);
        setUserEmail(null);
        setUserRole(null);
        await getSupabase().auth.signOut();
        router.replace('/login');
    }

    return { userId, userEmail, userRole, loading, logout };
}
