# Audit Report: Seeder & Schema Validation
**Date:** 2026-01-20
**Scope:** Database Schema & Seeding Logic for Dashboard Requirements

## 1. Schema Analysis (`schema.prisma`)
*   **Status:** ✅ **Approved** (Version 2.0.0)
*   **Key Models Verified:**
    *   `Campaign`: Correctly implemented with `status`, `platform`, `budget` (Decimal).
    *   `Metric`: Robust time-series model with `date`, `platform`, `impressions`, `clicks`, `spend`.
    *   `AdPlatform` Enum: Support for `GOOGLE_ADS`, `FACEBOOK`, `TIKTOK`, `LINE_ADS`.
*   **Relations:**
    *   `Campaign` -> `Metric`: One-to-Many (Correct).
    *   `Tenant` -> `Campaign`: One-to-Many (Correct).
*   **Conclusion:** The schema is fully compatible with the Dashboard requirements (Trends, Filtering, Aggregation).

## 2. Seeding Logic Analysis
*   **Main Script:** `backend/prisma/seed.ts`
*   **Helper Service:** `backend/src/modules/mock-data/mock-data-seeder.service.ts`

### 2.1 Critical Findings in `prisma/seed.ts`
*   **Time Window:** ❌ **7 Days Only**. The script hardcodes a loop `for (let i = 0; i < 7; i++)`. This is insufficient for "Last 30 Days" or "Month-over-Month" trend analysis.
*   **Data Volume:** ❌ **Low**. Only 3 campaigns are created (2 Active, 1 Pending). Only 2 have metric data. This will not trigger pagination or allow meaningful filtering tests.
*   **Platform Coverage:** ⚠️ **Partial**. LINE Ads is missing from the campaign creation logic, despite being in the Enum.
*   **Logic Duplication:**It manually re-implements logic that already exists in `mock-data-seeder.service.ts`.

### 2.2 Findings in `mock-data-seeder.service.ts`
*   **Better Capabilities:** Contains logic to seed 30 days (`seedCampaignMetrics`), creates correct platform data, and uses a richer dataset from `data/mock-campaigns.ts` (12 campaigns total).
*   **Disconnect:** This service is **not** currently used by the main `prisma db seed` command.

## 3. Data Quality Risks & Gap Analysis
| Dashboard Requirement | Current Seeder Status | Risk |
| :--- | :--- | :--- |
| **"Last 30 Days" Filter** | Only 7 days of data | 🔴 **High**: Charts will be 75% empty. |
| **Trend Visualization** | Short 7-day window | 🔴 **High**: Cannot show "Trend" (e.g. vs previous period). |
| **Integration Icons** | Missing LINE Ads | 🟡 **Medium**: LINE icon rendering untested. |
| **List Pagination** | Only 3 campaigns | 🔴 **High**: Pagination UI state (Next/Prev) cannot be verified. |
| **Status Filtering** | Mostly "Active" | 🟡 **Medium**: Cannot fully test "Paused" or "Ended" filters. |

## 4. Refactor Strategy (Step 2)
**Goal:** Replace the manual logic in `seed.ts` with the robust `MockDataSeederService`.

### Plan:
1.  **Refactor `prisma/seed.ts`:**
    *   Import and instantiate `MockDataSeederService` (or extracted functions).
    *   Use `ALL_MOCK_CAMPAIGNS` (12 items) instead of hardcoded 3 items.
    *   Call `seedCampaignMetrics(id, 90)` to generate **90 days** of history (covering "Last 30 Days" + comparison period).
2.  **Enhance Data Variety:**
    *   Ensure a mix of `ACTIVE`, `PAUSED`, and `COMPLETED` statuses.
    *   Ensure all 4 major platforms (Google, FB, TikTok, LINE) are present.
3.  **Cleanup:**
    *   Remove the duplicate manual loop logic in `seed.ts`.

**Verdict:** The Seeder needs an **Immediate Refactor** before effective UI testing can begin.
