// prisma/seed.ts (Sprint 4 - Schema v2.0 Compatible - 90 Days Logic)
import {
  PrismaClient,
  UserRole,
  CampaignStatus,
  NotificationChannel,
  AdPlatform,
  AlertSeverity,
  SyncStatus,
  AlertStatus,
  AlertRuleType,
  SubscriptionPlan,
  SubscriptionStatus,
  Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ==========================================
// 1. Embedded Mock Data & Generators
// ==========================================

interface MockCampaign {
  externalId: string;
  name: string;
  status: CampaignStatus;
  budget: number;
  platform: AdPlatform;
  campaignType: string;
}

const MOCK_CAMPAIGNS: MockCampaign[] = [
  // Google Ads
  {
    externalId: 'gads-001',
    name: 'Google Search - Brand Keywords',
    status: CampaignStatus.ACTIVE,
    budget: 50000,
    platform: AdPlatform.GOOGLE_ADS,
    campaignType: 'search',
  },
  {
    externalId: 'gads-002',
    name: 'Google Search - Generic Keywords',
    status: CampaignStatus.ACTIVE,
    budget: 80000,
    platform: AdPlatform.GOOGLE_ADS,
    campaignType: 'search',
  },
  {
    externalId: 'gads-003',
    name: 'Display Remarketing',
    status: CampaignStatus.ACTIVE,
    budget: 30000,
    platform: AdPlatform.GOOGLE_ADS,
    campaignType: 'display',
  },
  {
    externalId: 'gads-004',
    name: 'Google Shopping',
    status: CampaignStatus.PAUSED,
    budget: 45000,
    platform: AdPlatform.GOOGLE_ADS,
    campaignType: 'shopping',
  },
  // Facebook
  {
    externalId: 'fb-001',
    name: 'Facebook Lead Gen - Form',
    status: CampaignStatus.ACTIVE,
    budget: 35000,
    platform: AdPlatform.FACEBOOK,
    campaignType: 'lead_generation',
  },
  {
    externalId: 'fb-002',
    name: 'Facebook Video Views',
    status: CampaignStatus.ACTIVE,
    budget: 25000,
    platform: AdPlatform.FACEBOOK,
    campaignType: 'video',
  },
  {
    externalId: 'fb-003',
    name: 'Facebook Conversions - Website',
    status: CampaignStatus.PAUSED,
    budget: 60000,
    platform: AdPlatform.FACEBOOK,
    campaignType: 'conversions',
  },
  // TikTok
  {
    externalId: 'tiktok-001',
    name: 'TikTok Awareness - Reach',
    status: CampaignStatus.ACTIVE,
    budget: 40000,
    platform: AdPlatform.TIKTOK,
    campaignType: 'reach',
  },
  {
    externalId: 'tiktok-002',
    name: 'TikTok Traffic - Website Visits',
    status: CampaignStatus.ACTIVE,
    budget: 55000,
    platform: AdPlatform.TIKTOK,
    campaignType: 'traffic',
  },
  // LINE Ads
  {
    externalId: 'line-001',
    name: 'LINE Ads - Brand Awareness',
    status: CampaignStatus.ACTIVE,
    budget: 50000,
    platform: AdPlatform.LINE_ADS,
    campaignType: 'brand_awareness',
  },
  {
    externalId: 'line-002',
    name: 'LINE Ads - Lead Generation',
    status: CampaignStatus.ACTIVE,
    budget: 75000,
    platform: AdPlatform.LINE_ADS,
    campaignType: 'website_conversions',
  },
  {
    externalId: 'line-003',
    name: 'LINE Ads - Retargeting',
    status: CampaignStatus.PAUSED,
    budget: 30000,
    platform: AdPlatform.LINE_ADS,
    campaignType: 'website_conversions',
  },
];

// Helper to generate realistic daily fluctuation
function generateDailyMetrics(platform: AdPlatform) {
  // Variance factors
  const isWeekend = Math.random() > 0.7; // Simulate weekend dip
  const performanceFactor = isWeekend ? 0.8 : 1.0 + (Math.random() * 0.2 - 0.1); // +/- 10%

  // Platform multipliers (Google/FB usually higher volume than Line/TikTok for this demo)
  let volumeMultiplier = 1;
  if (platform === AdPlatform.TIKTOK) volumeMultiplier = 0.8;
  if (platform === AdPlatform.LINE_ADS) volumeMultiplier = 0.6;

  const baseImpressions = Math.floor((Math.random() * 5000 + 1000) * volumeMultiplier * performanceFactor);

  // CTR varies by platform
  let ctrRate = 0.02 + Math.random() * 0.03; // Default 2-5%
  if (platform === AdPlatform.FACEBOOK) ctrRate = 0.01 + Math.random() * 0.02; // 1-3%

  const clicks = Math.floor(baseImpressions * ctrRate);

  // CPC varies
  let avgCpc = 5 + Math.random() * 5; // 5-10 THB
  if (platform === AdPlatform.GOOGLE_ADS) avgCpc = 10 + Math.random() * 15; // 10-25 THB

  const spend = Math.floor(clicks * avgCpc);

  // Conversion Rate
  const cvr = 0.02 + Math.random() * 0.04; // 2-6%
  const conversions = Math.floor(clicks * cvr);

  // Revenue (ROAS 2.0 - 5.0)
  const roasTarget = 2 + Math.random() * 3;
  const revenue = Math.floor(spend * roasTarget);

  return {
    impressions: baseImpressions,
    clicks,
    spend,
    conversions,
    revenue,
    roas: spend > 0 ? revenue / spend : 0,
    orders: conversions,
    averageOrderValue: conversions > 0 ? revenue / conversions : 0,
  };
}

async function main() {
  console.log('🌱 Starting Robust Seed (90 Days Data)...');

  // 1. Clean up old data
  try {
    console.log('🧹 Cleaning up existing data...');
    // Delete in order to avoid Foreign Key constraints
    await prisma.notification.deleteMany();
    await prisma.alertHistory.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.alertRule.deleteMany();
    await prisma.syncLog.deleteMany();
    await prisma.report.deleteMany();
    await prisma.metric.deleteMany();
    await prisma.webAnalyticsDaily.deleteMany();
    await prisma.adGroup.deleteMany(); // Added AdGroup cleanup
    await prisma.campaign.deleteMany();
    await prisma.integration.deleteMany();
    await prisma.platformToken.deleteMany();
    // Delete accounts
    await prisma.googleAdsAccount.deleteMany();
    await prisma.googleAnalyticsAccount.deleteMany();
    await prisma.facebookAdsAccount.deleteMany();
    await prisma.tikTokAdsAccount.deleteMany();
    await prisma.lineAdsAccount.deleteMany();

    await prisma.auditLog.deleteMany();
    await prisma.session.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();
    console.log('✅ Cleanup complete');
  } catch (e) {
    console.error('⚠️ Cleanup warning (ignore if first run):', e);
  }

  // 2. Create Tenant
  console.log('🏢 Creating tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      name: 'RGA Demo Company',
      slug: 'rga-demo',
      domain: 'demo.rga.com',
      logoUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', // Generic logo
      subscriptionPlan: SubscriptionPlan.ENTERPRISE,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    },
  });

  // 3. Create Users
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@rga.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      tenantId: tenant.id,
      isActive: true,
      emailVerified: true,
    },
  });

  const client = await prisma.user.create({
    data: {
      email: 'demo@example.com', // As requested
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: UserRole.CLIENT,
      tenantId: tenant.id,
      isActive: true,
      emailVerified: true,
    },
  });

  // 4. Create Integrations & Accounts (Required for Campaigns)
  console.log('🔗 Creating integrations...');

  // Google
  const googleIntegration = await prisma.integration.create({
    data: {
      tenantId: tenant.id,
      type: AdPlatform.GOOGLE_ADS,
      name: 'Google Ads Main',
      provider: 'google',
      isActive: true,
    },
  });
  const googleAccount = await prisma.googleAdsAccount.create({
    data: {
      tenantId: tenant.id,
      customerId: '123-456-7890',
      accountName: 'RGA Main Account',
      accessToken: 'mock_token',
      refreshToken: 'mock_refresh',
    },
  });

  // Facebook
  const fbIntegration = await prisma.integration.create({
    data: {
      tenantId: tenant.id,
      type: AdPlatform.FACEBOOK,
      name: 'Facebook Ads Main',
      provider: 'meta',
      isActive: true,
    },
  });
  const fbAccount = await prisma.facebookAdsAccount.create({
    data: {
      tenantId: tenant.id,
      accountId: 'act_123456789',
      accountName: 'RGA Facebook Main',
      accessToken: 'mock_token',
    },
  });

  // TikTok
  const tiktokAccount = await prisma.tikTokAdsAccount.create({
    data: {
      tenantId: tenant.id,
      advertiserId: '7123456789012345678',
      accountName: 'RGA TikTok Ads',
      accessToken: 'mock_token',
    },
  });

  // Line
  const lineAccount = await prisma.lineAdsAccount.create({
    data: {
      tenantId: tenant.id,
      channelId: '1654321098',
      channelName: 'RGA LINE Official',
      accessToken: 'mock_token',
    },
  });


  // 5. Create Campaigns & Metrics
  console.log(`📢 Creating ${MOCK_CAMPAIGNS.length} campaigns and generating 90 days of metrics...`);

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 90);

  let totalMetrics = 0;

  for (const mockCampaign of MOCK_CAMPAIGNS) {
    // Determine integration/account based on platform
    let integrationId = null;
    let googleAdsAccountId = null;
    let facebookAdsAccountId = null;
    let tiktokAdsAccountId = null;
    let lineAdsAccountId = null;

    if (mockCampaign.platform === AdPlatform.GOOGLE_ADS) {
      integrationId = googleIntegration.id;
      googleAdsAccountId = googleAccount.id;
    } else if (mockCampaign.platform === AdPlatform.FACEBOOK) {
      integrationId = fbIntegration.id;
      facebookAdsAccountId = fbAccount.id;
    } else if (mockCampaign.platform === AdPlatform.TIKTOK) {
      tiktokAdsAccountId = tiktokAccount.id;
    } else if (mockCampaign.platform === AdPlatform.LINE_ADS) {
      lineAdsAccountId = lineAccount.id;
    }

    const campaign = await prisma.campaign.create({
      data: {
        tenantId: tenant.id,
        name: mockCampaign.name,
        platform: mockCampaign.platform,
        status: mockCampaign.status,
        budget: mockCampaign.budget,
        campaignType: mockCampaign.campaignType,
        externalId: mockCampaign.externalId,
        currency: 'THB',
        integrationId,
        googleAdsAccountId,
        facebookAdsAccountId,
        tiktokAdsAccountId,
        lineAdsAccountId,
        startDate: startDate,
        lastSyncedAt: new Date(),
        syncStatus: SyncStatus.SUCCESS,
      },
    });

    // Generate 90 days of metrics
    const campaignMetrics = [];
    let currentDate = new Date(startDate);

    while (currentDate <= today) {
      const dailyData = generateDailyMetrics(mockCampaign.platform);

      // Zero out future data if campaign is ended, or low data if paused (simulate residual attribution)
      if (mockCampaign.status === CampaignStatus.PAUSED && Math.random() > 0.2) {
        dailyData.spend = 0;
        dailyData.impressions = 0;
        dailyData.clicks = 0;
      }

      campaignMetrics.push({
        tenantId: tenant.id,
        campaignId: campaign.id,
        date: new Date(currentDate), // Clone date
        platform: mockCampaign.platform,
        source: 'platform_api',
        impressions: dailyData.impressions,
        clicks: dailyData.clicks,
        spend: new Prisma.Decimal(dailyData.spend),
        conversions: dailyData.conversions,
        revenue: new Prisma.Decimal(dailyData.revenue),
        roas: new Prisma.Decimal(dailyData.roas),
        orders: dailyData.orders,
        averageOrderValue: new Prisma.Decimal(dailyData.averageOrderValue),
        costPerClick: new Prisma.Decimal(dailyData.clicks > 0 ? dailyData.spend / dailyData.clicks : 0),
        costPerMille: new Prisma.Decimal(dailyData.impressions > 0 ? (dailyData.spend / dailyData.impressions) * 1000 : 0),
        costPerAction: new Prisma.Decimal(dailyData.conversions > 0 ? dailyData.spend / dailyData.conversions : 0),
        ctr: new Prisma.Decimal(dailyData.impressions > 0 ? (dailyData.clicks / dailyData.impressions) * 100 : 0),
        conversionRate: new Prisma.Decimal(dailyData.clicks > 0 ? (dailyData.conversions / dailyData.clicks) * 100 : 0),
        isMockData: true,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    await prisma.metric.createMany({
      data: campaignMetrics,
    });
    totalMetrics += campaignMetrics.length;
    process.stdout.write('.'); // Progress indicator
  }

  console.log(`\n✅ Created ${MOCK_CAMPAIGNS.length} campaigns and ${totalMetrics} metric records.`);

  // 6. Create Web Analytics (GA4) - 90 Days
  console.log('📈 Creating Google Analytics data (90 Days)...');
  const gaMetrics = [];
  let currentDate = new Date(startDate);

  while (currentDate <= today) {
    const sessions = Math.floor(Math.random() * 5000) + 2000;
    const activeUsers = Math.floor(sessions * 0.8);

    gaMetrics.push({
      tenantId: tenant.id,
      propertyId: 'GA4-123456789',
      date: new Date(currentDate),
      activeUsers,
      newUsers: Math.floor(activeUsers * 0.3),
      sessions,
      screenPageViews: sessions * 3,
      engagementRate: new Prisma.Decimal(0.6 + Math.random() * 0.2),
      bounceRate: new Prisma.Decimal(0.3 + Math.random() * 0.1),
      avgSessionDuration: new Prisma.Decimal(120 + Math.random() * 60),
      isMockData: true,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  await prisma.webAnalyticsDaily.createMany({
    data: gaMetrics,
  });
  console.log(`✅ Created ${gaMetrics.length} GA4 records.`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });