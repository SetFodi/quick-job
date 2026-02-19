import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const PLATFORM_EMAIL = 'admin@quick-job24.com';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const DEMO_ACCOUNTS = [
    { email: 'admin@test.com', fullName: 'Demo Admin', role: 'ADMIN' as UserRole, password: 'Test1234!' },
    { email: 'client@test.com', fullName: 'Demo Client', role: 'CLIENT' as UserRole, password: 'Test1234!' },
    { email: 'worker@test.com', fullName: 'Demo Worker', role: 'WORKER' as UserRole, password: 'Test1234!' },
];

const KEEP_EMAILS = [PLATFORM_EMAIL, ...DEMO_ACCOUNTS.map((a) => a.email)];

type AuthUserIdRow = { id: string };

async function findAuthUserIdByEmail(email: string) {
    const rows = await prisma.$queryRaw<AuthUserIdRow[]>`
        select id::text as id from auth.users where email = ${email} limit 1
    `;
    return rows[0]?.id ?? null;
}

async function ensureAuthAccount(
    email: string,
    fullName: string,
    role: UserRole,
    password: string,
) {
    let authUserId = await findAuthUserIdByEmail(email);

    if (!authUserId) {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required for seed auth setup');
        }

        const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                apikey: SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                data: { full_name: fullName, role },
            }),
        });

        if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as { msg?: string };
            const message = payload.msg ?? 'Unknown sign-up error';
            if (!message.toLowerCase().includes('registered')) {
                throw new Error(`Supabase sign-up failed for ${email}: ${message}`);
            }
        }

        authUserId = await findAuthUserIdByEmail(email);
    }

    if (!authUserId) {
        throw new Error(`Unable to resolve auth.users row for ${email}`);
    }

    await prisma.$executeRaw`
        update auth.users
        set encrypted_password = crypt(${password}, gen_salt('bf')),
            email_confirmed_at = coalesce(email_confirmed_at, now()),
            raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
                || jsonb_build_object('full_name', ${fullName}, 'role', ${role}),
            updated_at = now()
        where id = ${authUserId}::uuid
    `;

    const appUser = await prisma.user.upsert({
        where: { id: authUserId },
        update: { email, fullName, role, language: 'en' },
        create: { id: authUserId, email, fullName, role, language: 'en' },
    });

    await prisma.wallet.upsert({
        where: { userId: appUser.id },
        update: { availableBalance: 0, frozenBalance: 0 },
        create: { userId: appUser.id, availableBalance: 0, frozenBalance: 0 },
    });

    return appUser;
}

async function main() {
    console.log('🌱 Seeding Quick-Job database...\n');

    // ── 1. Wipe all transactional data ──
    const txCount = await prisma.transaction.deleteMany();
    const propCount = await prisma.proposal.deleteMany();
    const msCount = await prisma.milestone.deleteMany();
    const jobCount = await prisma.job.deleteMany();
    console.log(`🗑  Cleaned: ${jobCount.count} jobs, ${msCount.count} milestones, ${propCount.count} proposals, ${txCount.count} transactions`);

    // ── 2. Remove extra wallets and users ──
    const deletedWallets = await prisma.wallet.deleteMany({
        where: { user: { email: { notIn: KEEP_EMAILS } } },
    });
    const deletedUsers = await prisma.user.deleteMany({
        where: { email: { notIn: KEEP_EMAILS } },
    });
    console.log(`🗑  Removed: ${deletedUsers.count} extra users, ${deletedWallets.count} extra wallets\n`);

    // ── 3. Platform admin user + wallet ──
    const platformUser = await prisma.user.upsert({
        where: { email: PLATFORM_EMAIL },
        update: { fullName: 'Quick-Job Platform', role: 'ADMIN', language: 'en' },
        create: { email: PLATFORM_EMAIL, fullName: 'Quick-Job Platform', role: 'ADMIN', language: 'en' },
    });
    const platformWallet = await prisma.wallet.upsert({
        where: { userId: platformUser.id },
        update: { availableBalance: 0, frozenBalance: 0 },
        create: { userId: platformUser.id, availableBalance: 0, frozenBalance: 0 },
    });
    console.log(`✅ Platform Wallet`);
    console.log(`   ID: ${platformWallet.id}  (owner: ${PLATFORM_EMAIL})\n`);

    // ── 4. Demo accounts ──
    for (const account of DEMO_ACCOUNTS) {
        const user = await ensureAuthAccount(account.email, account.fullName, account.role, account.password);
        console.log(`✅ ${account.role.padEnd(6)} ${account.email}  (id: ${user.id})`);
    }

    // ── Summary ──
    console.log('\n' + '━'.repeat(50));
    console.log('📋 Add this to your apps/api/.env:\n');
    console.log(`   PLATFORM_WALLET_ID="${platformWallet.id}"`);
    console.log('\n🔐 Demo credentials (all passwords: Test1234!)');
    console.log('   admin@test.com   → ADMIN  (manages deposits)');
    console.log('   client@test.com  → CLIENT (posts jobs)');
    console.log('   worker@test.com  → WORKER (accepts jobs)');
    console.log('━'.repeat(50));
    console.log('\n✨ Database is clean. Ready for demo recording!\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
