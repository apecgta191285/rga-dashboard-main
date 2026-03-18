import { ScheduleDefinition, SchedulePolicy, ScheduleEvaluationContext, ScheduleDecision } from './schedule.model';
export declare class SchedulePolicyService {
    evaluateSchedule(definition: ScheduleDefinition, policy: SchedulePolicy, context: ScheduleEvaluationContext): ScheduleDecision;
    calculateNextEligible(definition: ScheduleDefinition, policy: SchedulePolicy, context: ScheduleEvaluationContext): Date | null;
    private checkTimeWindows;
    private findNextWindow;
    private checkScheduleType;
    private checkOnceSchedule;
    private checkIntervalSchedule;
    private checkCalendarSchedule;
    private findNextCalendarTime;
    private intervalToMs;
    private calculateNextForOnce;
    private calculateNextForInterval;
    private calculateNextForCalendar;
}
