"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
if (typeof Reflect.getMetadata !== 'function') {
    console.error('');
    console.error('╔════════════════════════════════════════════════════════════════════╗');
    console.error('║  BOOTSTRAP_ERROR: reflect-metadata not loaded before tsyringe usage ║');
    console.error('╚════════════════════════════════════════════════════════════════════╝');
    console.error('');
    console.error('This script requires reflect-metadata to be imported before any');
    console.error('modules that use tsyringe decorators (@injectable, @inject).');
    console.error('');
    console.error('Fix: Ensure "import \'reflect-metadata\'" is the FIRST import in this file.');
    console.error('');
    process.exit(1);
}
const scheduler_runner_1 = require("../../runner/scheduler-runner");
const fixture_schedule_provider_1 = require("../../schedules/fixture-schedule.provider");
const schedule_policy_service_1 = require("../../schedule/schedule-policy.service");
const execution_history_service_1 = require("../../history/execution-history.service");
const execution_history_inmemory_1 = require("../../history/execution-history.inmemory");
const execution_history_model_1 = require("../../history/execution-history.model");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const FIXED_NOW_ISO = '2024-01-15T14:00:00.000Z';
const FIXED_NOW = new Date(FIXED_NOW_ISO);
const TENANT_1 = 'tenant-1';
const TENANT_2 = 'tenant-2';
const SCHEDULE_COOLDOWN_TEST = 'sched-exec-morning-check';
const SCHEDULE_RATELIMIT_TEST = 'sched-exec-frequent-monitor';
const mockLogger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: (...args) => console.error('[ERROR]', ...args),
    child: () => mockLogger,
};
function resolveFixturePath() {
    const possiblePaths = [
        path.join(__dirname, '..', '..', 'fixtures', 'schedules'),
        path.join(process.cwd(), 'src', 'toolkit', 'fixtures', 'schedules'),
        path.join(process.cwd(), 'dist', 'toolkit', 'fixtures', 'schedules'),
    ];
    for (const dir of possiblePaths) {
        if (fs.existsSync(dir)) {
            return dir;
        }
    }
    return possiblePaths[0];
}
function verifyFixtureFile(fixturePath, tenantId) {
    const filePath = path.join(fixturePath, `${tenantId}.json`);
    if (!fs.existsSync(filePath)) {
        console.error('');
        console.error('╔════════════════════════════════════════════════════════════════════╗');
        console.error('║  FIXTURE_ERROR: missing fixture file                               ║');
        console.error('╚════════════════════════════════════════════════════════════════════╝');
        console.error('');
        console.error(`Expected file: ${filePath}`);
        console.error('');
        console.error('Attempted paths:');
        const attemptedPaths = [
            path.join(__dirname, '..', '..', 'fixtures', 'schedules'),
            path.join(process.cwd(), 'src', 'toolkit', 'fixtures', 'schedules'),
            path.join(process.cwd(), 'dist', 'toolkit', 'fixtures', 'schedules'),
        ];
        attemptedPaths.forEach(p => console.error(`  - ${p}`));
        console.error('');
        process.exit(1);
    }
}
async function loadScheduleFromFixture(scheduleId, fixtureProvider) {
    const result = {
        name: `Load schedule ${scheduleId}`,
        passed: false,
        details: [],
        errors: [],
    };
    const schedules = await fixtureProvider.getSchedulesForTenant(TENANT_1);
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) {
        result.errors.push(`Schedule not found: ${scheduleId}`);
        return { schedule: null, result };
    }
    result.details.push(`Found schedule: ${scheduleId}`);
    result.details.push(`Schedule type: ${schedule.schedule.type}`);
    result.passed = true;
    return { schedule, result };
}
function createFreshTestContext(fixtureProvider) {
    const historyRepo = new execution_history_inmemory_1.InMemoryExecutionHistoryRepository();
    const historyService = new execution_history_service_1.ExecutionHistoryService(historyRepo, mockLogger);
    const schedulePolicyService = new schedule_policy_service_1.SchedulePolicyService();
    const deps = {
        scheduleProvider: fixtureProvider,
        schedulePolicyService,
        executionHistoryService: historyService,
    };
    const runner = new scheduler_runner_1.SchedulerRunner(deps, mockLogger);
    return { runner, historyService, historyRepo };
}
async function seedExecution(historyRepo, tenantId, finishedAt, status = 'COMPLETED', referenceNow = FIXED_NOW) {
    const record = (0, execution_history_model_1.createExecutionHistoryRecord)({
        executionId: `exec-${tenantId}-${finishedAt.getTime()}`,
        tenantId,
        triggerType: 'PROGRAMMATIC',
        requestedBy: 'test',
        status,
        startedAt: new Date(finishedAt.getTime() - 1000),
        finishedAt,
        dryRun: false,
        ruleCount: 1,
        triggeredAlertCount: 0,
    });
    await historyRepo.record(record, referenceNow);
}
function compareDecisions(a, b) {
    const diffs = [];
    if (a.scheduleId !== b.scheduleId)
        diffs.push(`scheduleId: ${a.scheduleId} vs ${b.scheduleId}`);
    if (a.shouldTrigger !== b.shouldTrigger)
        diffs.push(`shouldTrigger: ${a.shouldTrigger} vs ${b.shouldTrigger}`);
    if (a.blockedBy !== b.blockedBy)
        diffs.push(`blockedBy: ${a.blockedBy} vs ${b.blockedBy}`);
    if (a.reason !== b.reason)
        diffs.push(`reason differs`);
    if (a.nextEligibleAt !== b.nextEligibleAt) {
        diffs.push(`nextEligibleAt: ${a.nextEligibleAt} vs ${b.nextEligibleAt}`);
    }
    return diffs;
}
function compareCandidates(a, b) {
    const diffs = [];
    if (a.scheduleId !== b.scheduleId)
        diffs.push(`scheduleId differs`);
    if (a.tenantId !== b.tenantId)
        diffs.push(`tenantId differs`);
    if (a.executionParams.triggerType !== b.executionParams.triggerType) {
        diffs.push(`triggerType differs`);
    }
    if (a.executionParams.requestedBy !== b.executionParams.requestedBy) {
        diffs.push(`requestedBy differs`);
    }
    return diffs;
}
function printScheduleEvidence(schedule, now, decision) {
    console.log('\n[EVIDENCE] --- Schedule Details ---');
    console.log(`[EVIDENCE] id: ${schedule.id}`);
    console.log(`[EVIDENCE] type: ${schedule.schedule.type}`);
    console.log(`[EVIDENCE] timezone: ${schedule.schedule.timezone}`);
    console.log(`[EVIDENCE] config: ${JSON.stringify(schedule.schedule.config)}`);
    console.log(`[EVIDENCE] enabled: ${schedule.schedule.enabled}`);
    try {
        const localNow = now.toLocaleString('en-US', { timeZone: schedule.schedule.timezone });
        console.log(`[EVIDENCE] fixedNow ISO: ${now.toISOString()}`);
        console.log(`[EVIDENCE] fixedNow Local: ${localNow} (${schedule.schedule.timezone})`);
        const hour = parseInt(localNow.split(', ')[1].split(':')[0]);
        console.log(`[EVIDENCE] Computed Local Hour: ~${hour}`);
    }
    catch {
        console.log('[EVIDENCE] (Timezone format error)');
    }
    console.log('[EVIDENCE] --- Policy ---');
    console.log(`[EVIDENCE] allowedTimeWindows: ${JSON.stringify(schedule.policy.allowedTimeWindows)}`);
    console.log(`[EVIDENCE] excludedDates: ${JSON.stringify(schedule.policy.excludedDates)}`);
    console.log(`[EVIDENCE] excludedDaysOfWeek: ${JSON.stringify(schedule.policy.excludedDaysOfWeek)}`);
    console.log(`[EVIDENCE] cooldownPeriodMs: ${schedule.policy.cooldownPeriodMs}`);
    console.log(`[EVIDENCE] maxExecutionsPerWindow: ${schedule.policy.maxExecutionsPerWindow}`);
    console.log(`[EVIDENCE] executionWindowMs: ${schedule.policy.executionWindowMs}`);
    if (decision) {
        console.log('[EVIDENCE] --- Decision ---');
        console.log(`[EVIDENCE] shouldTrigger: ${decision.shouldTrigger}`);
        console.log(`[EVIDENCE] blockedBy: ${decision.blockedBy}`);
        console.log(`[EVIDENCE] reason: ${decision.reason}`);
        console.log(`[EVIDENCE] nextEligibleAt: ${decision.nextEligibleAt}`);
        console.log(`[EVIDENCE] Gate: ${decision.blockedBy}`);
    }
    console.log('[EVIDENCE] --- Fixture Snippet ---');
    const snippet = { ...schedule, policy: undefined, schedule: { ...schedule.schedule, config: '...' } };
    console.log(JSON.stringify(schedule, null, 2));
}
async function printHistoryEvidence(historyService, tenantId, windowMs, now, repo) {
    console.log(`\n[EVIDENCE] --- History Wiring Proof (${tenantId}) ---`);
    const totalCount = repo.getTenantRecordCount(tenantId);
    console.log(`[EVIDENCE] Repo Total Records for Tenant: ${totalCount}`);
    const summary = await historyService.getSummary(tenantId, windowMs, now);
    console.log(`[EVIDENCE] executionsInWindow (Summary): ${summary.totalExecutions}`);
    const cutoff = new Date(now.getTime() - windowMs);
    console.log(`[EVIDENCE] cutoffStart: ${cutoff.toISOString()}`);
    console.log(`[EVIDENCE] checkWindowMs: ${windowMs}`);
    const recent = await historyService.findRecent(tenantId, { limit: 20 });
    const records = recent.records;
    console.log(`[EVIDENCE] Found Records via Service: ${records.length}`);
    if (records.length > 0) {
        records.sort((a, b) => a.finishedAt.getTime() - b.finishedAt.getTime());
        const show = [...records.slice(0, 5)];
        if (records.length > 5)
            show.push(...records.slice(records.length - 2));
        show.forEach(r => {
            const inWindow = r.finishedAt >= cutoff && r.finishedAt <= now;
            console.log(`[EVIDENCE] Record: ${r.finishedAt.toISOString()} | In Window? ${inWindow}`);
        });
    }
    else {
        console.log(`[EVIDENCE] No records found in service query.`);
    }
}
async function runTestA_Determinism(fixtureProvider) {
    const result = {
        name: 'Test A: Determinism Repeatability (3 runs)',
        passed: false,
        details: [],
        errors: [],
    };
    try {
        const { schedule, result: loadResult } = await loadScheduleFromFixture(SCHEDULE_COOLDOWN_TEST, fixtureProvider);
        if (!loadResult.passed) {
            result.errors.push(...loadResult.errors);
            return result;
        }
        if (schedule.policy.cooldownPeriodMs === undefined) {
            result.errors.push(`BLOCKED: missing cooldownPeriodMs in policy for scheduleId=${SCHEDULE_COOLDOWN_TEST}`);
            return result;
        }
        const cooldownMs = schedule.policy.cooldownPeriodMs;
        result.details.push(`Derived cooldownPeriodMs: ${cooldownMs}ms`);
        const results = [];
        for (let i = 0; i < 3; i++) {
            const { runner, historyRepo } = createFreshTestContext(fixtureProvider);
            const lastExecutionTime = new Date(FIXED_NOW.getTime() - cooldownMs / 2);
            await seedExecution(historyRepo, TENANT_1, lastExecutionTime);
            const tickResult = await runner.tickTenant(TENANT_1, FIXED_NOW);
            results.push(tickResult);
        }
        const base = results[0];
        for (let i = 1; i < results.length; i++) {
            const current = results[i];
            if (current.tenantId !== base.tenantId) {
                result.errors.push(`Run ${i + 1}: tenantId mismatch`);
            }
            if (current.now !== base.now) {
                result.errors.push(`Run ${i + 1}: now mismatch`);
            }
            if (current.evaluatedCount !== base.evaluatedCount) {
                result.errors.push(`Run ${i + 1}: evaluatedCount mismatch`);
            }
            if (current.triggeredCount !== base.triggeredCount) {
                result.errors.push(`Run ${i + 1}: triggeredCount mismatch`);
            }
            if (current.decisions.length !== base.decisions.length) {
                result.errors.push(`Run ${i + 1}: decisions length mismatch`);
            }
            else {
                for (let j = 0; j < current.decisions.length; j++) {
                    const diffs = compareDecisions(current.decisions[j], base.decisions[j]);
                    if (diffs.length > 0) {
                        result.errors.push(`Run ${i + 1}, Decision ${j}: ${diffs.join(', ')}`);
                    }
                }
            }
            if (current.triggerCandidates.length !== base.triggerCandidates.length) {
                result.errors.push(`Run ${i + 1}: candidates length mismatch`);
            }
            else {
                for (let j = 0; j < current.triggerCandidates.length; j++) {
                    const diffs = compareCandidates(current.triggerCandidates[j], base.triggerCandidates[j]);
                    if (diffs.length > 0) {
                        result.errors.push(`Run ${i + 1}, Candidate ${j}: ${diffs.join(', ')}`);
                    }
                }
            }
        }
        result.details.push(`Executed 3 runs with fresh repo/service per run`);
        result.details.push(`fixedNow: ${FIXED_NOW_ISO}`);
        result.details.push(`Evaluated ${base.evaluatedCount} schedules per run`);
        if (result.errors.length === 0) {
            result.passed = true;
        }
    }
    catch (e) {
        result.errors.push(`Exception: ${e.message}`);
    }
    return result;
}
async function runTestB_Cooldown(fixtureProvider) {
    const result = {
        name: 'Test B: Cooldown Block',
        passed: false,
        details: [],
        errors: [],
    };
    try {
        const { schedule, result: loadResult } = await loadScheduleFromFixture(SCHEDULE_COOLDOWN_TEST, fixtureProvider);
        if (!loadResult.passed) {
            result.errors.push(...loadResult.errors);
            return result;
        }
        if (schedule.policy.cooldownPeriodMs === undefined) {
            result.errors.push(`BLOCKED: missing cooldownPeriodMs in policy for scheduleId=${SCHEDULE_COOLDOWN_TEST}`);
            return result;
        }
        const cooldownMs = schedule.policy.cooldownPeriodMs;
        result.details.push(`scheduleId: ${SCHEDULE_COOLDOWN_TEST}`);
        result.details.push(`Derived cooldownPeriodMs: ${cooldownMs}ms`);
        const { runner, historyRepo, historyService } = createFreshTestContext(fixtureProvider);
        const lastExecutionTime = new Date(FIXED_NOW.getTime() - cooldownMs / 2);
        await seedExecution(historyRepo, TENANT_1, lastExecutionTime);
        result.details.push(`lastExecutionFinishedAt: ${lastExecutionTime.toISOString()}`);
        console.log(`\n[EVIDENCE] --- Test B Pre-Flight Check ---`);
        console.log(`[EVIDENCE] scheduleId: ${schedule.id}`);
        console.log(`[EVIDENCE] type: ${schedule.schedule.type}`);
        console.log(`[EVIDENCE] schedule.timezone: ${schedule.schedule.timezone}`);
        console.log(`[EVIDENCE] schedule.config: ${JSON.stringify(schedule.schedule.config)}`);
        console.log(`[EVIDENCE] enabled: ${schedule.schedule.enabled}`);
        console.log(`[EVIDENCE] fixedNow ISO: ${FIXED_NOW.toISOString()}`);
        console.log(`[EVIDENCE] fixedNow Local: ${FIXED_NOW.toLocaleString('en-US', { timeZone: schedule.schedule.timezone })} (${schedule.schedule.timezone})`);
        console.log(`[EVIDENCE] policy.allowedTimeWindows: ${JSON.stringify(schedule.policy.allowedTimeWindows)}`);
        console.log(`[EVIDENCE] policy.excludedDaysOfWeek: ${JSON.stringify(schedule.policy.excludedDaysOfWeek)}`);
        console.log(`[EVIDENCE] policy.excludedDates: ${JSON.stringify(schedule.policy.excludedDates)}`);
        console.log(`[EVIDENCE] policy.cooldownPeriodMs: ${schedule.policy.cooldownPeriodMs}`);
        console.log(`[EVIDENCE] policy.maxExecutionsPerWindow: ${schedule.policy.maxExecutionsPerWindow}`);
        console.log(`[EVIDENCE] policy.executionWindowMs: ${schedule.policy.executionWindowMs}`);
        const localDate = new Date(FIXED_NOW.toLocaleString('en-US', { timeZone: schedule.schedule.timezone }));
        console.log(`[EVIDENCE] Config Hour: ${schedule.schedule.config['hour']}`);
        await printHistoryEvidence(historyService, TENANT_1, cooldownMs, FIXED_NOW, historyRepo);
        const tickResult = await runner.tickTenant(TENANT_1, FIXED_NOW);
        const decision = tickResult.decisions.find(d => d.scheduleId === SCHEDULE_COOLDOWN_TEST);
        if (decision)
            printScheduleEvidence(schedule, FIXED_NOW, decision);
        else
            printScheduleEvidence(schedule, FIXED_NOW, undefined);
        if (!decision) {
            result.errors.push(`Decision not found for schedule ${SCHEDULE_COOLDOWN_TEST}`);
            return result;
        }
        result.details.push(`shouldTrigger: ${decision.shouldTrigger}`);
        result.details.push(`blockedBy: ${decision.blockedBy}`);
        result.details.push(`nextEligibleAt: ${decision.nextEligibleAt}`);
        const expectedNextEligible = new Date(lastExecutionTime.getTime() + cooldownMs);
        if (decision.shouldTrigger !== false) {
            result.errors.push(`Expected shouldTrigger=false, got ${decision.shouldTrigger}`);
        }
        if (decision.blockedBy !== 'COOLDOWN') {
            result.errors.push(`Expected blockedBy='COOLDOWN', got '${decision.blockedBy}'`);
        }
        if (decision.nextEligibleAt !== expectedNextEligible.toISOString()) {
            result.errors.push(`Expected nextEligibleAt='${expectedNextEligible.toISOString()}', got '${decision.nextEligibleAt}'`);
        }
        if (result.errors.length === 0) {
            result.passed = true;
        }
    }
    catch (e) {
        result.errors.push(`Exception: ${e.message}`);
    }
    return result;
}
async function runTestC_RateLimit(fixtureProvider) {
    const result = {
        name: 'Test C: Rate-Limit Block',
        passed: false,
        details: [],
        errors: [],
    };
    try {
        const { schedule, result: loadResult } = await loadScheduleFromFixture(SCHEDULE_RATELIMIT_TEST, fixtureProvider);
        if (!loadResult.passed) {
            result.errors.push(...loadResult.errors);
            return result;
        }
        if (schedule.policy.maxExecutionsPerWindow === undefined) {
            result.errors.push(`BLOCKED: missing maxExecutionsPerWindow in policy for scheduleId=${SCHEDULE_RATELIMIT_TEST}`);
            return result;
        }
        if (schedule.policy.executionWindowMs === undefined) {
            result.errors.push(`BLOCKED: missing executionWindowMs in policy for scheduleId=${SCHEDULE_RATELIMIT_TEST}`);
            return result;
        }
        const maxExecutions = schedule.policy.maxExecutionsPerWindow;
        const windowMs = schedule.policy.executionWindowMs;
        result.details.push(`scheduleId: ${SCHEDULE_RATELIMIT_TEST}`);
        result.details.push(`windowMs source: policy.executionWindowMs`);
        result.details.push(`windowMs value: ${windowMs}ms`);
        result.details.push(`maxExecutionsPerWindow: ${maxExecutions}`);
        const { runner, historyRepo, historyService } = createFreshTestContext(fixtureProvider);
        for (let i = 0; i < maxExecutions; i++) {
            const offsetMs = (i + 1) * (windowMs / (maxExecutions + 1));
            const execTime = new Date(FIXED_NOW.getTime() - offsetMs);
            await seedExecution(historyRepo, TENANT_1, execTime);
        }
        result.details.push(`Seeded ${maxExecutions} executions within ${windowMs}ms window`);
        console.log(`\n[EVIDENCE] --- Test C Pre-Flight Check ---`);
        const cutoffStart = new Date(FIXED_NOW.getTime() - windowMs);
        console.log(`[EVIDENCE] cutoffStart: ${cutoffStart.toISOString()}`);
        const summary = await historyService.getSummary(TENANT_1, windowMs, FIXED_NOW);
        console.log(`[EVIDENCE] executionsInWindow: ${summary.totalExecutions}`);
        if (summary.totalExecutions === 0) {
            result.errors.push('FATAL: History seeding failed. executionsInWindow=0');
            console.error('FATAL: History seeding failed. executionsInWindow=0');
            return result;
        }
        await printHistoryEvidence(historyService, TENANT_1, windowMs, FIXED_NOW, historyRepo);
        const tickResult = await runner.tickTenant(TENANT_1, FIXED_NOW);
        const decision = tickResult.decisions.find(d => d.scheduleId === SCHEDULE_RATELIMIT_TEST);
        if (decision)
            printScheduleEvidence(schedule, FIXED_NOW, decision);
        else
            printScheduleEvidence(schedule, FIXED_NOW, undefined);
        if (!decision) {
            result.errors.push(`Decision not found for schedule ${SCHEDULE_RATELIMIT_TEST}`);
            return result;
        }
        result.details.push(`shouldTrigger: ${decision.shouldTrigger}`);
        result.details.push(`blockedBy: ${decision.blockedBy}`);
        if (decision.shouldTrigger !== false) {
            result.errors.push(`Expected shouldTrigger=false, got ${decision.shouldTrigger}`);
        }
        if (decision.blockedBy !== 'LIMIT') {
            result.errors.push(`Expected blockedBy='LIMIT', got '${decision.blockedBy}'`);
        }
        if (!decision.reason.includes('Maximum executions')) {
            result.errors.push(`Expected reason to include 'Maximum executions', got: ${decision.reason}`);
        }
        if (result.errors.length === 0) {
            result.passed = true;
        }
    }
    catch (e) {
        result.errors.push(`Exception: ${e.message}`);
    }
    return result;
}
async function runTestD_TenantIsolation(fixtureProvider) {
    const result = {
        name: 'Test D: Tenant Isolation',
        passed: false,
        details: [],
        errors: [],
    };
    try {
        const { runner, historyRepo, historyService } = createFreshTestContext(fixtureProvider);
        const { schedule: schedule1 } = await loadScheduleFromFixture(SCHEDULE_COOLDOWN_TEST, fixtureProvider);
        const cooldownMs = schedule1?.policy?.cooldownPeriodMs ?? 300000;
        await seedExecution(historyRepo, TENANT_1, new Date(FIXED_NOW.getTime() - cooldownMs / 2));
        for (let i = 0; i < 50; i++) {
            await seedExecution(historyRepo, TENANT_2, new Date(FIXED_NOW.getTime() - i * 60000));
        }
        const tenant1Count = await historyService.countInWindow(TENANT_1, 3600000, FIXED_NOW);
        const tenant2Count = await historyService.countInWindow(TENANT_2, 3600000, FIXED_NOW);
        console.log(`[EVIDENCE] Tenant-1 Count (Expected 1): ${tenant1Count}`);
        console.log(`[EVIDENCE] Tenant-2 Count (Expected 50): ${tenant2Count}`);
        await printHistoryEvidence(historyService, TENANT_1, 3600000, FIXED_NOW, historyRepo);
        await printHistoryEvidence(historyService, TENANT_2, 3600000, FIXED_NOW, historyRepo);
        result.details.push(`Tenant-1 executions in window: ${tenant1Count}`);
        result.details.push(`Tenant-2 executions in window: ${tenant2Count}`);
        const tickResult = await runner.tickTenant(TENANT_1, FIXED_NOW);
        const decision = tickResult.decisions.find(d => d.scheduleId === SCHEDULE_COOLDOWN_TEST);
        if (decision)
            printScheduleEvidence(schedule1, FIXED_NOW, decision);
        else
            printScheduleEvidence(schedule1, FIXED_NOW, undefined);
        if (!decision) {
            result.errors.push(`Decision not found for schedule ${SCHEDULE_COOLDOWN_TEST}`);
            return result;
        }
        result.details.push(`Tenant-1 blockedBy: ${decision.blockedBy}`);
        if (decision.blockedBy === 'LIMIT') {
            result.errors.push(`Tenant-1 blocked by LIMIT - tenant-2 history leaked!`);
        }
        if (decision.blockedBy !== 'COOLDOWN') {
            result.errors.push(`Expected blockedBy='COOLDOWN', got '${decision.blockedBy}'`);
        }
        if (result.errors.length === 0) {
            result.passed = true;
        }
    }
    catch (e) {
        result.errors.push(`Exception: ${e.message}`);
    }
    return result;
}
async function main() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  Phase 2.4.4.1 — Runtime Validation Harness (PATCHED)            ║');
    console.log('║  SchedulerRunner Determinism & Policy Wiring Validation            ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Node version: ${process.version}`);
    console.log(`Command: npm run validate:runtime:scheduler`);
    console.log(`BOOTSTRAP_OK: reflect-metadata active`);
    console.log(`Fixed now: ${FIXED_NOW_ISO}`);
    console.log('');
    const fixturePath = resolveFixturePath();
    console.log(`Fixture path: ${fixturePath}`);
    verifyFixtureFile(fixturePath, TENANT_1);
    console.log('');
    const fixtureProvider = new fixture_schedule_provider_1.FixtureScheduleProvider(mockLogger, { fixturesDir: fixturePath });
    const results = [];
    console.log('Running Test A: Determinism Repeatability...');
    results.push(await runTestA_Determinism(fixtureProvider));
    console.log('');
    console.log('Running Test B: Cooldown Block...');
    results.push(await runTestB_Cooldown(fixtureProvider));
    console.log('');
    console.log('Running Test C: Rate-Limit Block...');
    results.push(await runTestC_RateLimit(fixtureProvider));
    console.log('');
    console.log('Running Test D: Tenant Isolation...');
    results.push(await runTestD_TenantIsolation(fixtureProvider));
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  RESULTS SUMMARY                                                   ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    let allPassed = true;
    for (const result of results) {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`║  ${status}: ${result.name.padEnd(58)} ║`);
        for (const detail of result.details) {
            console.log(`║      ${detail.substring(0, 62).padEnd(62)} ║`);
        }
        for (const error of result.errors) {
            console.log(`║      ERROR: ${error.substring(0, 55).padEnd(55)} ║`);
        }
    }
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    const finalStatus = allPassed && results.every(r => r.passed) ? 'PASS' : 'FAIL';
    const exitCode = finalStatus === 'PASS' ? 0 : 1;
    console.log(`║  FINAL VERDICT: ${finalStatus === 'PASS' ? '✅ SAFE' : '❌ BLOCKED'}${' '.repeat(45)} ║`);
    console.log(`║  EXIT_CODE=${exitCode}${' '.repeat(60)} ║`);
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log('');
    process.exit(exitCode);
}
main().catch((e) => {
    console.error('');
    console.error('╔════════════════════════════════════════════════════════════════════╗');
    console.error('║  UNEXPECTED ERROR                                                  ║');
    console.error('╠════════════════════════════════════════════════════════════════════╣');
    console.error(`║  Error name: ${e.name?.padEnd(56)} ║`);
    console.error(`║  Message: ${e.message?.substring(0, 58).padEnd(58)} ║`);
    console.error('╠════════════════════════════════════════════════════════════════════╣');
    console.error('║  Stack trace (first 10 lines):                                     ║');
    const stack = e.stack?.split('\n').slice(0, 10) || ['No stack trace'];
    stack.forEach(line => {
        console.error(`║  ${line.substring(0, 64).padEnd(64)} ║`);
    });
    console.error('╚════════════════════════════════════════════════════════════════════╝');
    console.error('');
    process.exit(1);
});
//# sourceMappingURL=phase-2.4.4.1.runtime.js.map