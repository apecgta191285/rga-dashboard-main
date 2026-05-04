# Google Ads Dashboard Data Debug & Fix Guide

## Problem Description
Connected Google Ads account but data doesn't appear on dashboard

## Diagnostic Steps

### Step 1: Run the Diagnostic Script
```bash
cd backend
npx ts-node test-google-ads-metrics.ts
```

This will check:
- ✅ Google Ads accounts in database
- ✅ Campaigns and their external IDs
- ✅ Metrics data
- ✅ Last sync timestamps

### Step 2: Manual Sync Trigger
If diagnostic shows no campaigns or metrics, trigger a manual sync:

```bash
# Option A: Using curl
curl -X POST http://localhost:3000/google-ads/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Option B: Using the dashboard
1. Go to Dashboard > Settings > Google Ads
2. Click "Sync Now" or "Force Resync"
```

### Step 3: Check Sync Logs
Monitor the backend logs during sync to see detailed information:

```bash
# In a separate terminal, watch logs
tail -f backend.log | grep "\[SYNC\]"
```

Look for these patterns:
```
[SYNC] ✅ Fetched X campaigns  // Campaigns found
[SYNC] ✅ Fetched X metric records  // Metrics retrieved
⚠️ No metrics collected for campaign  // Warning - no data
❌ Error fetching metrics  // Error occurred
```

## Common Issues & Solutions

### Issue 1: "No Google Ads accounts found"
**Cause**: OAuth connection was not saved

**Solution**:
1. Disconnect from Google Ads (if connected)
2. Delete Google Ads account from database
3. Reconnect to Google Ads
4. Check that account is saved in database

### Issue 2: "No campaigns found"
**Cause**: Campaigns weren't fetched from API or have no external ID

**Solution**:
1. Check .env for correct GOOGLE_ADS_DEVELOPER_TOKEN
2. Verify the Google Ads account has active campaigns
3. Check logs for API errors:
   - unauthorized_client → OAuth expired, need to reconnect
   - invalid_grant → Refresh token expired
   - permission error → Check Google Cloud project permissions

### Issue 3: "Campaigns found but no metrics"
**Cause**: Metrics API call failed or returned empty

**Solution**:
1. Check if Google Ads account has spend data:
   - Log in to Google Ads → Check campaigns for impressions/clicks/spend
2. Check API errors in logs
3. Verify date range:
   - Metrics are queried for last 30 days by default
   - If campaigns are brand new, they may not have data yet
4. Check Google Ads API quotas:
   - Go to Google Cloud Console
   - Check "Search Campaigns API" quota usage

### Issue 4: "Metrics returned but not in database"
**Cause**: Metrics transformation failed or data format mismatch

**Solution**:
1. Check transformer logs in `google-ads-mapper.service.ts`
2. Look for: `[transformMetrics] Raw metric sample` in logs
3. If data format is unexpected, the metrics will be filtered out
4. Contact support with transformer error details

## How the Data Flow Works

```
1. OAuth Callback
   ↓
2. Save credentials to GoogleAdsAccount table
   ↓
3. Trigger sync: adapter.fetchCampaigns()
   ↓
4. Save campaigns with externalId
   ↓
5. For each campaign: adapter.fetchMetrics(campaignId, dateRange)
   ↓
6. Transform metrics: transformMetrics(rawData)
   ↓
7. Save metrics to Metric table with campaignId
   ↓
8. Dashboard aggregates metrics from Metric table
```

## Metrics Field Mapping

### From Google Ads API Response
```
{
  campaign: { id: "...", name: "..." },
  segments: { date: "YYYY-MM-DD" },
  metrics: {
    impressions: "123",
    clicks: "45",
    cost_micros: "12345000",  // Divide by 1,000,000 to get dollars
    conversions: "10",
    conversions_value: "500"
  }
}
```

### To Dashboard Display
```
{
  date: "2024-01-01",
  impressions: 123,
  clicks: 45,
  spend: 12.345,          // cost_micros / 1,000,000
  conversions: 10,
  revenue: 500            // conversions_value
}
```

## Logging Configuration

### Enable Debug Logging (Verbose)
Edit `backend/.env`:
```
LOG_LEVEL=debug
DEBUG=*  // or specific patterns
```

### Restart backend:
```bash
npm run dev
```

## Manual Database Checks

### Check if accounts exist:
```sql
SELECT id, customerId, accountName, lastSyncAt FROM "GoogleAdsAccount" LIMIT 5;
```

### Check campaigns:
```sql
SELECT id, externalId, name, platform FROM "Campaign" 
WHERE platform = 'GOOGLE_ADS' LIMIT 5;
```

### Check metrics:
```sql
SELECT id, date, impressions, clicks, spend, platform FROM "Metric"
WHERE platform = 'GOOGLE_ADS'
ORDER BY date DESC LIMIT 10;
```

### Check if campaigns are missing externalId:
```sql
SELECT id, name, externalId FROM "Campaign"
WHERE platform = 'GOOGLE_ADS' AND externalId IS NULL;
```

## API Endpoints for Debugging

### Get Google Ads Status
```bash
GET /google-ads/status
Authorization: Bearer JWT_TOKEN
```

### Trigger Manual Sync
```bash
POST /google-ads/sync
Authorization: Bearer JWT_TOKEN
```

### Get Connected Accounts
```bash
GET /google-ads/accounts
Authorization: Bearer JWT_TOKEN
```

### Debug Campaign Fetch (if available)
```bash
GET /google-ads/debug/campaigns/:customerId
Authorization: Bearer JWT_TOKEN
```

## Performance Tips

- **First sync**: May take 2-5 minutes depending on campaign count
- **Subsequent syncs**: Should be faster as only new metrics are added
- **Data available**: Up to 30 days of historical data by default

## Still Not Working?

1. **Gather diagnostic data**:
   ```bash
   npx ts-node test-google-ads-metrics.ts > diagnostic.txt
   cat backend.log | grep -E "\[SYNC\]|ERROR" > sync_logs.txt
   ```

2. **Check environment variables**:
   ```bash
   # Verify these are set in .env
   GOOGLE_ADS_DEVELOPER_TOKEN
   GOOGLE_ADS_CLIENT_ID
   GOOGLE_ADS_CLIENT_SECRET
   DATABASE_URL
   ```

3. **Check Google Cloud project**:
   - Credentials are valid and not expired
   - Google Ads API is enabled
   - Quota limits haven't been exceeded

4. **Contact support with**:
   - diagnostic.txt (output from test script)
   - sync_logs.txt (latest sync errors)
   - .env file (with secrets redacted)
   - Current time and steps taken
