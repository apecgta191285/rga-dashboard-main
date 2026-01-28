# Audit Report: Google Ads OAuth Implementation

**Date:** 2026-01-26
**Topic:** Fix `invalid_grant` Loop & Ensure Refresh Token Update

## 1. Executive Summary
The audit of `backend/src/modules/integrations/google-ads/google-ads-oauth.service.ts` confirms that the **critical OAuth configurations are currently present in the codebase**. The `generateAuthUrl` method correctly requests `offline` access and `consent` prompt, and the `completeConnection` method contains logic to update the `refreshToken` in the database.

However, since the `invalid_grant` issue persists despite "reconnection via UI", the root cause may lie in **data duplication (ambiguous record resolution)** or **race conditions** rather than missing code logic.

---

## 2. Detailed Findings

### 2.1. URL Generation (The Request)
**Check:** Does the authorization URL include `access_type: 'offline'` AND `prompt: 'consent'`?
**Status:** ✅ **PASS**
**Evidence:** `google-ads-oauth.service.ts` Lines 45-50
```typescript
const authUrl = this.oauth2Client.generateAuthUrl({
  access_type: 'offline', // Get refresh token
  scope: scopes,
  state: state,
  prompt: 'consent', // Force consent screen to get refresh token
});
```
**Conclusion:** The application correctly forces Google to issue a new `refresh_token` on every connection attempt.

### 2.2. Callback & Token Persistence (The Save)
**Check:** Does the code handle token updates correctly?
**Status:** ✅ **PASS** (with caveats on targeting)
**Evidence:** `google-ads-oauth.service.ts` Lines 156-165 (Handling Updates)
```typescript
if (existing) {
  await this.prisma.googleAdsAccount.update({
    where: { id: existing.id },
    data: {
      refreshToken: this.encryptionService.encrypt(refreshToken), // Correctly saving new token
      accountName,
      status: 'ENABLED',
      updatedAt: new Date()
    }
  });
}
```
**Observation:**
- The code uses `findFirst` to locate the account by `tenantId` and `customerId`.
- If multiple records exist for the same `customerId` (dirty data), the code might update Record A, while the background sync service reads Record B (which still has the old/invalid token).

---

## 3. Root Cause Analysis (Why `invalid_grant` persists)

If the logic is correct but the error persists, the following are the likely culprits:

1.  **Duplicate Records (Most Likely):**
    - usage of `.findFirst()` suggests the schema might not strictly enforce a composite unique constraint on `[tenantId, customerId]`.
    - **Scenario:** The DB contains two rows for the same `customerId`. The UI updates Row 1 (New Token). The Sync job queries via `.findFirst()` and happens to grab Row 2 (Old Token).

2.  **Encryption Key State:**
    - If `EncryptionService` keys are rotated or inconsistent (e.g., based on a non-persisted random seed at startup), decrypted tokens will be garbage.

3.  **Scope Mismatches:**
    - If the user grants permissions but unchecks specific boxes, the token might be valid but lack scope (though usually this throws `insufficient_scope`, not `invalid_grant`).

---

## 4. Action Plan

### Step 1: Enforce Unique Constraint & Clean Data (Crucial)
Prevent the "Ghost Record" scenario.

```sql
-- Check for duplicates
SELECT "tenantId", "customerId", COUNT(*)
FROM "GoogleAdsAccount"
GROUP BY "tenantId", "customerId"
HAVING COUNT(*) > 1;
```

**Recommendation:** Delete duplicates and add a strict unique index in `schema.prisma`.

### Step 2: Add Trace Logging
Add logging to confirm exactly WHICH record is being updated and WHICH is being used.

### Step 3: Hardened Code Snippets (For Reference)

Ensure your `google-ads-oauth.service.ts` maintains this structure:

**URL Generation:**
```typescript
const authUrl = this.oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  state: state,
  prompt: 'consent', // CRITICAL: Forces new refresh_token
  include_granted_scopes: true // Optional: good practice
});
```

**Persistence (Update Logic):**
```typescript
// Ensure we are updating the exact record we expect
const existing = await this.prisma.googleAdsAccount.findFirst({
  where: { tenantId, customerId: cleanCustomerId }
});

if (existing) {
  this.logger.log(`Updating OAuth Token for Account ID: ${existing.id}`); // Log ID
  await this.prisma.googleAdsAccount.update({
    where: { id: existing.id },
    data: {
      refreshToken: this.encryptionService.encrypt(refreshToken),
      updatedAt: new Date(),
      // ...
    }
  });
}
```
