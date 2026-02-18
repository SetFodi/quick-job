import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PLATFORM_EMAIL = 'admin@quick-job24.com';

async function main() {
    console.log('🌱 Seeding Quick-Job database...\n');

    // 1. Upsert the platform admin user
    const adminUser = await prisma.user.upsert({
        where: { email: PLATFORM_EMAIL },
        update: {},
        create: {
            email: PLATFORM_EMAIL,
            fullName: 'Quick-Job Platform',
            role: 'ADMIN',
            language: 'en',
        },
    });

    console.log(`✅ Platform Admin User`);
    console.log(`   ID:    ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}\n`);

    // 2. Upsert the platform wallet
    const platformWallet = await prisma.wallet.upsert({
        where: { userId: adminUser.id },
        update: {},
        create: {
            userId: adminUser.id,
            availableBalance: 0,
            frozenBalance: 0,
        },
    });

    console.log(`✅ Platform Wallet`);
    console.log(`   Wallet ID: ${platformWallet.id}`);
    console.log(`   User ID:   ${platformWallet.userId}\n`);

    console.log('━'.repeat(50));
    console.log('📋 Add this to your apps/api/.env:\n');
    console.log(`   PLATFORM_WALLET_ID="${platformWallet.id}"`);
    console.log('━'.repeat(50));
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
