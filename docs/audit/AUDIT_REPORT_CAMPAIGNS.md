# Campaign Management Architecture Audit Report

**Date:** 2026-01-21  
**Status:** ⚠️ Significant Gaps Identified  
**Author:** Automated Audit  

---

## Executive Summary

The Campaigns module has a **solid foundation** but lacks critical features needed for a "Production-Grade Command Center". While the backend supports basic pagination and sorting, the **critical Time-Window Aggregation feature is missing** - metrics are summed across ALL time, not filtered by date range. The frontend doesn't leverage any server-side capabilities.

### Critical Gaps at a Glance

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Pagination | ✅ Implemented | ❌ Not Used | 🔴 Gap |
| Sorting | ✅ Implemented | ❌ Not Used | 🔴 Gap |
| Search/Filter | ✅ Implemented | ❌ Not Used | 🔴 Gap |
| **Time-Window Metrics** | ❌ Missing | ❌ Missing | 🔴 **Critical** |
| Row Selection | N/A | ❌ Missing | 🟡 Needed |
| Bulk Actions API | ❌ Missing | ❌ Missing | 🟡 Future |

---

## 1. Backend Audit

### 1.1 Pagination ✅ (Implemented but Unused)

**Location:** [query-campaigns.dto.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/modules/campaigns/dto/query-campaigns.dto.ts)

```typescript
// Backend supports these params:
page: number = 1;    // ✅ Default: 1
limit: number = 10;  // ✅ Default: 10
```

**Repository Implementation:**
```typescript
// campaigns.repository.ts (Lines 62-64)
const take = limit;
const skip = (page - 1) * take;
```

**Service Response:**
```typescript
// campaigns.service.ts (Lines 46-54)
return {
    data: normalized,
    meta: {
        page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
    },
};
```

### 1.2 Sorting ✅ (Implemented but Limited)

**Supported Fields:** `name`, `createdAt`, `status`, `platform`

```typescript
// query-campaigns.dto.ts
sortBy?: string;             // enum: ['name', 'createdAt', 'status', 'platform']
sortOrder?: 'asc' | 'desc';
```

> [!WARNING]
> **Missing:** Cannot sort by `spend`, `impressions`, `clicks` - the most useful columns for campaign management. These are computed fields, not database columns.

### 1.3 Filtering ✅ (Implemented)

```typescript
// query-campaigns.dto.ts
search?: string;    // Searches name, externalId
platform?: string;  // Filter by platform
status?: string;    // Filter by status
```

### 1.4 Time-Window Aggregation 🔴 (CRITICAL GAP)

**Current Behavior:**  
The `findAll` method fetches campaigns with ALL associated metrics:

```typescript
// campaigns.repository.ts (Line 75)
include: { metrics: true },  // 🔴 No date filter!
```

**Normalization Logic:**  
Metrics are summed across ALL TIME:

```typescript
// campaigns.service.ts (Lines 155-159)
const spend = m.reduce((s, x) => s + this.safe(x.spend), 0);
const impressions = m.reduce((s, x) => s + this.safe(x.impressions), 0);
// 🔴 This sums ALL metrics, not just "Last 7 Days"
```

**Impact:**  
❌ Cannot answer: "How much did Campaign X spend **last week**?"  
❌ Cannot compare: "Campaign performance **this month vs last month**"

**Separate Endpoint Exists But Different:**  
There IS a `GET /:id/metrics` endpoint with date filtering:

```typescript
// campaigns.controller.ts (Lines 56-71)
@Get(':id/metrics')
async getMetrics(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
)
```

But this is for **single campaign detail view**, not the **list view**.

---

## 2. Frontend Audit

### 2.1 State Management 🔴 (No Server-Side State)

**Current Hook:**
```typescript
// use-campaigns.ts
export function useCampaigns() {
    return useQuery<Campaign[], Error>({
        queryKey: CAMPAIGNS_QUERY_KEY,  // 🔴 No params in key!
        queryFn: CampaignService.getCampaigns,  // 🔴 No params passed!
    });
}
```

**Current Service:**
```typescript
// campaign-service.ts
async getCampaigns(): Promise<Campaign[]> {
    const response = await apiClient.get('/campaigns');
    // 🔴 No query params: page, limit, search, sortBy, startDate, endDate
}
```

**Missing State:**

| State | Current | Needed |
|-------|---------|--------|
| `page` | ❌ | `useState<number>(1)` |
| `limit` | ❌ | `useState<number>(10)` |
| `search` | ❌ | `useState<string>('')` |
| `sortBy` | ❌ | `useState<SortKey>('createdAt')` |
| `sortOrder` | ❌ | `useState<'asc' \| 'desc'>('desc')` |
| `dateRange` | ❌ | `useState<DateRange>({ start, end })` |
| `selectedRows` | ❌ | `useState<Set<string>>(new Set())` |

### 2.2 Table Component 🔴 (Basic, No Interactivity)

**Current Implementation:**
```typescript
// campaigns-table.tsx
<TableHead>Campaign</TableHead>  // 🔴 Not clickable for sorting
<TableHead>Status</TableHead>    // 🔴 Not clickable for sorting
```

**Missing Features:**

| Feature | Status | Notes |
|---------|--------|-------|
| Sortable Headers | ❌ | No click handlers |
| Row Selection | ❌ | No checkboxes |
| Pagination Controls | ❌ | Not rendered |
| Loading State per Row | ❌ | Only page-level skeleton |

### 2.3 Filter UI 🔴 (Not Implemented)

The page has no filter controls:

```typescript
// campaigns-page.tsx - Header section (Lines 152-163)
<div className="flex items-center justify-between">
    <div>
        <h1>Campaigns</h1>
        <p>Manage your advertising campaigns...</p>
    </div>
    <Button onClick={handleCreate}>Create Campaign</Button>
    // 🔴 No search input
    // 🔴 No platform filter
    // 🔴 No status filter
    // 🔴 No date range picker
</div>
```

---

## 3. Bulk Action Readiness

### 3.1 Backend API 🔴 (Not Implemented)

No bulk action endpoints exist. Searched for "bulk" - found only in OAuth service (unrelated).

**Needed Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/campaigns/bulk/pause` | PUT | Pause multiple campaigns |
| `/campaigns/bulk/activate` | PUT | Activate multiple campaigns |
| `/campaigns/bulk/delete` | DELETE | Delete multiple campaigns |

### 3.2 Frontend Support 🔴 (Not Implemented)

- No row selection state
- No checkbox column in table
- No bulk action toolbar

---

## 4. Missing Features Matrix

### Backend

| Feature | Status | File | Notes |
|---------|--------|------|-------|
| Pagination (`page`, `limit`) | ✅ | query-campaigns.dto.ts | Implemented |
| Sorting (`sortBy`, `sortOrder`) | ⚠️ | query-campaigns.dto.ts | Limited fields |
| Search (`search`) | ✅ | query-campaigns.dto.ts | Implemented |
| Platform Filter | ✅ | query-campaigns.dto.ts | Implemented |
| Status Filter | ✅ | query-campaigns.dto.ts | Implemented |
| **Date Range (`startDate`, `endDate`)** | ❌ | - | **Not on list endpoint** |
| **Sort by Metrics (spend, CTR)** | ❌ | - | Computed fields not sortable |
| Bulk Pause/Activate | ❌ | - | Not implemented |
| Bulk Delete | ❌ | - | Not implemented |

### Frontend

| Feature | Status | File | Notes |
|---------|--------|------|-------|
| Pagination State | ❌ | campaigns-page.tsx | No useState |
| Pagination UI | ❌ | campaigns-table.tsx | No controls |
| Sortable Columns | ❌ | campaigns-table.tsx | Headers not clickable |
| Search Input | ❌ | campaigns-page.tsx | Not rendered |
| Platform Filter Dropdown | ❌ | campaigns-page.tsx | Not rendered |
| Status Filter Dropdown | ❌ | campaigns-page.tsx | Not rendered |
| Date Range Picker | ❌ | campaigns-page.tsx | Not rendered |
| Row Selection (Checkboxes) | ❌ | campaigns-table.tsx | No checkbox column |
| Bulk Action Toolbar | ❌ | campaigns-page.tsx | Not implemented |

---

## 5. Architecture Gap: Time-Window Aggregation

### The Problem

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CURRENT DATA FLOW (BROKEN)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Campaign Table                Metrics Table                        │
│  ─────────────────            ──────────────────────                │
│  id: camp_001                 campaign_id | date       | spend      │
│  name: "Summer Sale"          ────────────────────────────────      │
│                               camp_001    | 2025-12-01 | 1000       │
│  ────────────────────►        camp_001    | 2025-12-15 | 2000       │
│  include: { metrics: true }   camp_001    | 2026-01-01 | 3000       │
│  (NO DATE FILTER)             camp_001    | 2026-01-15 | 4000       │
│                               ────────────────────────────────      │
│  Result: spend = 10,000       Total: 10,000 (ALL TIME)              │
│                                                                     │
│  ❌ User asks: "Last 7 days spend?"                                 │
│  ❌ Answer: Cannot compute!                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### The Solution

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TARGET DATA FLOW (CORRECT)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Request:                                                           │
│  GET /campaigns?startDate=2026-01-10&endDate=2026-01-17             │
│                                                                     │
│  Repository Query:                                                  │
│  ─────────────────                                                  │
│  include: {                                                        │
│    metrics: {                                                      │
│      where: {                                                      │
│        date: { gte: startDate, lte: endDate }  // ✅ DATE FILTER   │
│      }                                                             │
│    }                                                               │
│  }                                                                 │
│                                                                     │
│  Result: spend = 4,000 (ONLY Jan 10-17)                             │
│                                                                     │
│  ✅ User asks: "Last 7 days spend?"                                 │
│  ✅ Answer: ฿4,000                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Refactor Strategy

### Phase 1: Backend Enhancements (Priority: 🔴 High)

#### 1.1 Add Date Range to Query DTO

```typescript
// query-campaigns.dto.ts - ADD:
@ApiPropertyOptional({ description: 'Metrics start date (YYYY-MM-DD)' })
@IsOptional()
@IsDateString()
startDate?: string;

@ApiPropertyOptional({ description: 'Metrics end date (YYYY-MM-DD)' })
@IsOptional()
@IsDateString()
endDate?: string;
```

#### 1.2 Update Repository to Filter Metrics

```typescript
// campaigns.repository.ts - MODIFY findAll:
include: {
    metrics: query.startDate || query.endDate ? {
        where: {
            date: {
                ...(query.startDate && { gte: new Date(query.startDate) }),
                ...(query.endDate && { lte: new Date(query.endDate) }),
            },
        },
    } : true,
},
```

#### 1.3 Add Sortable Computed Fields (Optional)

For advanced sorting by `spend`, use raw SQL or computed column.

### Phase 2: Frontend Enhancements (Priority: 🔴 High)

#### 2.1 Create Query Params Type

```typescript
// types/query.ts
export interface CampaignQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    platform?: string;
    status?: string;
    sortBy?: 'name' | 'createdAt' | 'status' | 'platform';
    sortOrder?: 'asc' | 'desc';
    startDate?: string;
    endDate?: string;
}
```

#### 2.2 Update Hook to Accept Params

```typescript
// use-campaigns.ts
export function useCampaigns(params: CampaignQueryParams = {}) {
    return useQuery({
        queryKey: ['campaigns', params],  // ✅ Include params in key
        queryFn: () => CampaignService.getCampaigns(params),
    });
}
```

#### 2.3 Add Campaign Filter Bar Component

```typescript
// components/campaign-filters.tsx
- Search input (debounced)
- Platform dropdown
- Status dropdown
- Date range picker
```

#### 2.4 Upgrade Table to TanStack Table

Use `@tanstack/react-table` for:
- Column sorting with indicators
- Row selection with checkboxes
- Client-side fallback pagination

### Phase 3: Bulk Actions (Priority: 🟡 Medium)

#### 3.1 Backend Bulk Endpoint

```typescript
// campaigns.controller.ts - ADD:
@Put('bulk/status')
async bulkUpdateStatus(
    @Body() dto: { ids: string[]; status: CampaignStatus }
)
```

#### 3.2 Frontend Selection State

```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
```

---

## 7. Implementation Priority

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 🔴 P0 | Add `startDate`/`endDate` to DTO | Low | High |
| 🔴 P0 | Filter metrics in repository | Medium | High |
| 🔴 P1 | Update `useCampaigns` with params | Low | High |
| 🔴 P1 | Update `CampaignService.getCampaigns` | Low | High |
| 🟡 P2 | Create Campaign Filter Bar | Medium | Medium |
| 🟡 P2 | Add Pagination UI | Medium | Medium |
| 🟡 P2 | Add Sortable Headers | Medium | Medium |
| 🟢 P3 | Bulk Actions API | High | Medium |
| 🟢 P3 | Row Selection UI | Medium | Medium |

---

## 8. Conclusion

### Critical Path

1. **Backend:** Add `startDate`/`endDate` params and filter metrics in `findAll`
2. **Frontend:** Update hook and service to pass query params
3. **Frontend:** Add Date Range Picker to campaign page header

### Estimated Effort

| Phase | Backend | Frontend | Total |
|-------|---------|----------|-------|
| Phase 1 (Time-Window) | 2h | 3h | 5h |
| Phase 2 (Filters + Pagination) | 1h | 4h | 5h |
| Phase 3 (Bulk Actions) | 3h | 3h | 6h |
| **Total** | **6h** | **10h** | **16h** |

---

**Audit Complete** ✅
