// The rules of the daily WHOOP fetch: where a run starts reading, and which of the
// records it read are finished and may be stored. Plain values in, plain values out.
// The route at src/app/api/cron/daily-data-fetch does the reading and the storing.

import type { WhoopCycle, WhoopRecovery, WhoopSleep, WhoopWorkout } from '@/types/whoop';

const DAY_MS = 24 * 60 * 60 * 1000;
/** A normal run reads this many whole UTC days before today. */
const USUAL_DAYS_BACK = 2;

function utcMidnight(now: Date, daysBack: number): Date {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysBack));
}

/** The last instant of yesterday (UTC). A run stores nothing that finished after it. */
export function endOfYesterday(now: Date): Date {
    return new Date(utcMidnight(now, 0).getTime() - 1);
}

/**
 * The day a caller asked to refill from, written YYYY-MM-DD and read as midnight UTC.
 * Null when it is not a real day or lies in the future.
 */
export function parseSince(asked: string, now: Date): Date | null {
    const day = new Date(`${asked}T00:00:00.000Z`);
    // Only a real day written YYYY-MM-DD reads back as it was asked: 2026-8-7 does not
    // parse, and 2026-02-30 is either invalid or rolls over into March.
    if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== asked) return null;
    return day <= now ? day : null;
}

/**
 * Where a run starts reading.
 *
 * Normally that is midnight two days ago. When the newest stored recovery is older
 * than that, a run was missed, and reading starts a day before that recovery, so the
 * first run after an outage refills all of it. Recoveries are stored last and oldest
 * first, and a run stops at the first one it cannot store, so everything before the
 * newest stored one is already complete.
 *
 * `since` overrides both. It is the only way to refill a hole that lies behind
 * newer data.
 */
export function syncWindowStart(now: Date, newestStoredRecovery: Date | null, since: Date | null): Date {
    if (since) return since;
    const usual = utcMidnight(now, USUAL_DAYS_BACK);
    if (!newestStoredRecovery) return usual;
    return newestStoredRecovery < usual ? new Date(newestStoredRecovery.getTime() - DAY_MS) : usual;
}

export interface WhoopRecords {
    cycles: WhoopCycle[];
    sleeps: WhoopSleep[];
    recoveries: WhoopRecovery[];
    workouts: WhoopWorkout[];
}

export interface FinishedRecords extends WhoopRecords {
    /** The cycle each stored sleep belongs to, by sleep id. */
    sleepCycles: Map<string, number>;
    /** Recoveries left for a later run because their cycle has not finished. */
    waiting: number;
}

function oldestFirst<T>(records: T[], time: (record: T) => string): T[] {
    return [...records].sort((a, b) => Date.parse(time(a)) - Date.parse(time(b)));
}

/**
 * The records a run may store, each list oldest first.
 *
 * A cycle is finished when it has ended and has a score; the cycle a person is in
 * right now has no end. A recovery is stored only together with its finished cycle
 * and its sleep, because its row points at both. One whose cycle is still open waits
 * for a later run, and so does the link from its sleep to that cycle.
 *
 * Nothing that finished after `cutoff` is stored, except the cycle of a stored
 * recovery: that cycle ends at the next sleep, usually after midnight UTC.
 */
export function finishedRecords(read: WhoopRecords, cutoff: Date): FinishedRecords {
    const by = (time?: string | null) => !!time && Date.parse(time) <= cutoff.getTime();

    const finished = new Map(read.cycles.filter((cycle) => cycle.end && cycle.score).map((cycle) => [cycle.id, cycle]));
    const sleeps = oldestFirst(read.sleeps.filter((sleep) => by(sleep.end)), (sleep) => sleep.start);
    const stored = new Set(sleeps.map((sleep) => sleep.id));

    const due = read.recoveries.filter((recovery) => by(recovery.created_at) && stored.has(recovery.sleep_id));
    const recoveries = oldestFirst(due.filter((recovery) => finished.has(recovery.cycle_id)), (recovery) => recovery.created_at);
    const referenced = new Set(recoveries.map((recovery) => recovery.cycle_id));

    return {
        cycles: oldestFirst([...finished.values()].filter((cycle) => by(cycle.end) || referenced.has(cycle.id)), (cycle) => cycle.start),
        sleeps,
        recoveries,
        workouts: oldestFirst(read.workouts.filter((workout) => by(workout.end)), (workout) => workout.start),
        sleepCycles: new Map(recoveries.map((recovery) => [recovery.sleep_id, recovery.cycle_id])),
        waiting: due.length - recoveries.length,
    };
}
