/**
 * Test script to diagnose Google Ads metrics sync issues
 * Run: npx ts-node test-google-ads-metrics.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Google Ads Metrics Diagnostic Tool\n');

    try {
        // 1. Check if Google Ads accounts exist
        console.log('1️⃣ Checking Google Ads accounts...');
        const accounts = await prisma.googleAdsAccount.findMany({
            include: { campaigns: true },
            take: 5,
        });

        if (accounts.length === 0) {
            console.log('❌ No Google Ads accounts found in database');
            return;
        }

        console.log(`✅ Found ${accounts.length} Google Ads account(s)\n`);

        for (const account of accounts) {
            console.log(`Account: ${account.customerId} (${account.accountName})`);
            console.log(`  Campaigns: ${account.campaigns.length}`);
        }

        // 2. Check if campaigns have externalId
        console.log('\n2️⃣ Checking campaigns...');
        const campaigns = await prisma.campaign.findMany({
            where: { platform: 'GOOGLE_ADS' },
            include: { metrics: { take: 1 } },
            take: 5,
        });

        if (campaigns.length === 0) {
            console.log('❌ No Google Ads campaigns found in database');
            console.log('   -> Campaigns may not have been synced yet');
            return;
        }

        console.log(`✅ Found ${campaigns.length} campaign(s)\n`);

        for (const campaign of campaigns) {
            console.log(`Campaign: ${campaign.name}`);
            console.log(`  External ID: ${campaign.externalId || '❌ MISSING!'}`);
            console.log(`  Metrics count: ${campaign.metrics.length}`);
            console.log(`  Status: ${campaign.status}`);
        }

        // 3. Check metrics
        console.log('\n3️⃣ Checking metrics...');
        const metrics = await prisma.metric.findMany({
            where: { platform: 'GOOGLE_ADS' },
            orderBy: { date: 'desc' },
            take: 10,
        });

        if (metrics.length === 0) {
            console.log('❌ No metrics found in database');
            console.log('   -> Metrics may not have been synced yet');
            console.log('   -> Check if sync process completed successfully');
        } else {
            console.log(`✅ Found ${metrics.length} metric(s)\n`);
            const sample = metrics[0];
            console.log('Latest metric sample:');
            console.log(`  Date: ${sample.date}`);
            console.log(`  Impressions: ${sample.impressions}`);
            console.log(`  Clicks: ${sample.clicks}`);
            console.log(`  Spend: ${sample.spend}`);
            console.log(`  Conversions: ${sample.conversions}`);
        }

        // 4. Check for sync logs
        console.log('\n4️⃣ Checking recent sync activity...');
        const syncedAccounts = await prisma.googleAdsAccount.findMany({
            where: { lastSyncAt: { not: null } },
            orderBy: { lastSyncAt: 'desc' },
            take: 3,
        });

        if (syncedAccounts.length === 0) {
            console.log('❌ No accounts have been synced yet');
        } else {
            console.log(`✅ Sync history (last 3 accounts):\n`);
            for (const account of syncedAccounts) {
                const lastSync = account.lastSyncAt ? new Date(account.lastSyncAt).toISOString() : 'Never';
                console.log(`  ${account.customerId}: Last sync at ${lastSync}`);
            }
        }

        // 5. Check total aggregated metrics
        console.log('\n5️⃣ Total metrics aggregation...');
        const aggregated = await prisma.metric.aggregate({
            where: { platform: 'GOOGLE_ADS' },
            _sum: {
                impressions: true,
                clicks: true,
                spend: true,
                conversions: true,
            },
        });

        console.log(`Total aggregated metrics:`);
        console.log(`  Impressions: ${aggregated._sum.impressions || 0}`);
        console.log(`  Clicks: ${aggregated._sum.clicks || 0}`);
        console.log(`  Spend: ${aggregated._sum.spend || 0}`);
        console.log(`  Conversions: ${aggregated._sum.conversions || 0}`);

        if (!aggregated._sum.impressions && !aggregated._sum.clicks) {
            console.log('\n⚠️  No metrics data found. This explains why dashboard is empty!');
            console.log('\nPossible solutions:');
            console.log('1. Manually trigger sync via: POST /auth/google/ads/sync');
            console.log('2. Check sync logs for errors');
            console.log('3. Verify Google Ads account has campaigns with data');
            console.log('4. Check .env file for correct GOOGLE_ADS_* credentials');
        }
    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(console.error);
