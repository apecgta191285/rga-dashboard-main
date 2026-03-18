"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTickOptions = createTickOptions;
exports.createTickResult = createTickResult;
exports.createRunnerScheduleDecision = createRunnerScheduleDecision;
exports.createTriggerCandidate = createTriggerCandidate;
function createTickOptions(options) {
    return {
        dryRun: options?.dryRun ?? false,
        maxTriggers: options?.maxTriggers ?? 10,
        includeDecisions: options?.includeDecisions ?? true,
        correlationId: options?.correlationId,
    };
}
function createTickResult(params) {
    return {
        tenantId: params.tenantId,
        now: params.now.toISOString(),
        dryRun: params.dryRun,
        evaluatedCount: params.evaluatedCount,
        triggeredCount: params.triggerCandidates.length,
        decisions: params.decisions,
        triggerCandidates: params.triggerCandidates,
    };
}
function createRunnerScheduleDecision(params) {
    return {
        scheduleId: params.scheduleId,
        shouldTrigger: params.shouldTrigger,
        reason: params.reason,
        blockedBy: params.blockedBy,
        nextEligibleAt: params.nextEligibleAt?.toISOString() ?? null,
    };
}
function createTriggerCandidate(params) {
    return {
        scheduleId: params.scheduleId,
        tenantId: params.tenantId,
        executionParams: params.executionParams,
        derivedRequest: {
            triggerType: params.executionParams.triggerType,
            requestedBy: params.executionParams.requestedBy,
            dryRun: params.executionParams.dryRunDefault,
        },
    };
}
//# sourceMappingURL=scheduler-runner.model.js.map