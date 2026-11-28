// Stand-ins for the two things the daily fetch talks to: WHOOP's API and the
// database. Both keep state, so a test reads back what a run actually stored.

import type { WhoopCycle, WhoopProfile, WhoopRecovery, WhoopSleep, WhoopWorkout } from '@/types/whoop';

export const USER_ID = 7;
export const ACCESS_TOKEN = 'access-token-for-tests';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const PAGE_LIMIT = 25; // WHOOP's documented maximum for `limit`.

/** What WHOOP holds for one day, named by the UTC date its cycle starts on. */
export interface Night {
    day: string;
    cycle: WhoopCycle;
    sleep?: WhoopSleep;
    recovery?: WhoopRecovery;
    workout?: WhoopWorkout;
}

const iso = (ms: number) => new Date(ms).toISOString();

/** The id of the cycle that starts on `day` (YYYY-MM-DD). */
export const cycleId = (day: string) => Date.parse(`${day}T00:00:00.000Z`) / DAY;
export const sleepId = (day: string) => `sleep-${day}`;
export const workoutId = (day: string) => `workout-${day}`;

/**
 * `count` consecutive days starting on `first`, as WHOOP would report them at `now`.
 * A cycle runs from one sleep onset (04:00 UTC) to the next, so the newest cycle
 * is still open: it has no end. The sleep ends at 11:50, its recovery is created at
 * 12:00, and a workout runs 22:00 to 23:00. Anything not finished by `now` is absent.
 */
export function nights(first: string, count: number, now: Date): Night[] {
    const start = Date.parse(`${first}T00:00:00.000Z`);
    return Array.from({ length: count }, (_, index) => {
        const midnight = start + index * DAY;
        const day = iso(midnight).slice(0, 10);
        const stamps = { created_at: iso(midnight + 12 * HOUR), updated_at: iso(midnight + 12 * HOUR) };
        const ended = midnight + 28 * HOUR <= now.getTime();
        const night: Night = {
            day,
            cycle: {
                id: cycleId(day),
                user_id: USER_ID,
                ...stamps,
                start: iso(midnight + 4 * HOUR),
                ...(ended ? { end: iso(midnight + 28 * HOUR) } : {}),
                timezone_offset: '-05:00',
                score_state: ended ? 'SCORED' : 'PENDING_SCORE',
                score: { strain: 10 + (index % 7), kilojoule: 9000, average_heart_rate: 62, max_heart_rate: 151 },
            } as WhoopCycle,
        };
        if (midnight + 11 * HOUR + 50 * 60 * 1000 <= now.getTime()) {
            night.sleep = {
                id: sleepId(day),
                user_id: USER_ID,
                ...stamps,
                start: iso(midnight + 4 * HOUR),
                end: iso(midnight + 11 * HOUR + 50 * 60 * 1000),
                timezone_offset: '-05:00',
                nap: false,
                score_state: 'SCORED',
            };
        }
        if (midnight + 12 * HOUR <= now.getTime()) {
            night.recovery = {
                cycle_id: cycleId(day),
                sleep_id: sleepId(day),
                user_id: USER_ID,
                ...stamps,
                score_state: 'SCORED',
                score: { user_calibrating: false, recovery_score: 60 + (index % 30), resting_heart_rate: 52, hrv_rmssd_ms: 71 },
            };
        }
        if (midnight + 23 * HOUR <= now.getTime()) {
            night.workout = {
                id: workoutId(day),
                user_id: USER_ID,
                ...stamps,
                start: iso(midnight + 22 * HOUR),
                end: iso(midnight + 23 * HOUR),
                timezone_offset: '-05:00',
                sport_id: 0,
                sport_name: 'running',
                score_state: 'SCORED',
            } as WhoopWorkout;
        }
        return night;
    });
}

const present = <T>(value: T | undefined): value is T => value !== undefined;

/**
 * WHOOP's v2 API as its OpenAPI document describes it
 * (https://api.prod.whoop.com/developer/doc/openapi.json): pages of at most 25,
 * newest first, `start` inclusive, `end` exclusive and "now" when left out.
 */
export class FakeWhoop {
    /** Every request received, as "/path?query", in order. */
    readonly calls: string[] = [];
    private readonly failing = new Map<string, number>();

    constructor(private readonly held: Night[]) {}

    /** Answer every request for `path` with `status` from now on. */
    failOn(path: string, status: number): void {
        this.failing.set(path, status);
    }

    readonly fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = new URL(String(input));
        const path = url.pathname.replace('/developer/v2', '');
        this.calls.push(`${path}${url.search}`);

        const sent = new Headers(init?.headers).get('authorization');
        if (sent !== `Bearer ${ACCESS_TOKEN}`) return json({ error: 'unauthorized' }, 401);
        const failure = this.failing.get(path);
        if (failure) return json({ error: 'the test asked for this failure' }, failure);

        if (path === '/user/profile/basic') {
            const profile: WhoopProfile = {
                user_id: String(USER_ID),
                email: 'mica@example.test',
                first_name: 'Mica',
                last_name: 'Example',
            };
            return json(profile, 200);
        }
        if (path.startsWith('/cycle/')) {
            const found = this.held.find((night) => String(night.cycle.id) === path.slice('/cycle/'.length));
            return found ? json(found.cycle, 200) : json({ error: 'not found' }, 404);
        }

        const lists: Record<string, () => Array<{ from: string; to?: string; record: unknown }>> = {
            '/cycle': () => this.held.map((n) => ({ from: n.cycle.start, to: n.cycle.end, record: n.cycle })),
            '/activity/sleep': () =>
                this.held.map((n) => n.sleep).filter(present).map((s) => ({ from: s.start, to: s.end, record: s })),
            '/recovery': () =>
                this.held
                    .map((n) => n.recovery)
                    .filter(present)
                    .map((r) => ({ from: r.created_at, to: r.created_at, record: r })),
            '/activity/workout': () =>
                this.held.map((n) => n.workout).filter(present).map((w) => ({ from: w.start, to: w.end, record: w })),
        };
        const list = lists[path];
        if (!list) return json({ error: 'not found' }, 404);
        return page(list(), url.searchParams);
    };
}

function page(all: Array<{ from: string; to?: string; record: unknown }>, query: URLSearchParams): Response {
    const limit = Number(query.get('limit') ?? 10);
    if (limit > PAGE_LIMIT) return json({ error: 'limit is at most 25' }, 400);
    const start = query.get('start');
    const end = query.get('end') ?? new Date().toISOString();

    // A record still open (no `to`) reaches to the end of time.
    const within = all
        .filter(({ from, to }) => (!start || !to || Date.parse(to) >= Date.parse(start)) && Date.parse(from) < Date.parse(end))
        .sort((a, b) => Date.parse(b.from) - Date.parse(a.from));
    const offset = Number(query.get('nextToken') ?? 0);
    const records = within.slice(offset, offset + limit).map(({ record }) => record);
    const more = offset + limit < within.length;
    return json({ records, ...(more ? { next_token: String(offset + limit) } : {}) }, 200);
}

function json(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

const violates = (table: string, constraint: string) =>
    new Error(`insert or update on table "${table}" violates foreign key constraint "${constraint}"`);

/**
 * The parts of WhoopDatabaseService the daily fetch uses, holding rows in memory
 * and refusing what the real tables refuse (backend/alembic/versions 0001 and 0010):
 * a sleep may point only at a stored cycle, and a recovery only at a stored cycle
 * and a stored sleep. Like the real service it skips a cycle or recovery with no
 * score, and throws when it refuses a row.
 */
export class FakeStore {
    readonly cycles = new Map<number, WhoopCycle>();
    readonly sleeps = new Map<string, { sleep: WhoopSleep; cycleId: number | null }>();
    readonly workouts = new Map<string, WhoopWorkout>();
    readonly recoveries = new Map<number, WhoopRecovery>();
    /** Every row written by a run, as "kind day", in order. */
    readonly writes: string[] = [];
    private readonly refused = new Set<number>();

    /** Put whole days in place, as earlier runs would have left them. */
    hold(held: Night[]): void {
        for (const { cycle, sleep, recovery, workout } of held) {
            this.cycles.set(cycle.id, cycle);
            if (sleep) this.sleeps.set(sleep.id, { sleep, cycleId: recovery ? cycle.id : null });
            if (recovery) this.recoveries.set(recovery.cycle_id, recovery);
            if (workout) this.workouts.set(workout.id, workout);
        }
    }

    /** Make the database refuse the recovery of the cycle that starts on `day`. */
    refuseRecovery(day: string): void {
        this.refused.add(cycleId(day));
    }

    /** Let the database accept the recovery of the cycle that starts on `day` again. */
    acceptRecovery(day: string): void {
        this.refused.delete(cycleId(day));
    }

    /** The days that are complete: cycle, recovery, and the sleep tied to that cycle. */
    completeDays(): string[] {
        return [...this.cycles.keys()]
            .filter((id) => this.recoveries.has(id))
            .filter((id) => [...this.sleeps.values()].some((row) => row.cycleId === id))
            .sort((a, b) => a - b)
            .map((id) => iso(id * DAY).slice(0, 10));
    }

    async getAllUsersWithTokens() {
        return [
            {
                id: USER_ID,
                email: 'mica@example.test',
                first_name: 'Mica',
                last_name: 'Example',
                access_token: ACCESS_TOKEN,
                refresh_token: 'refresh-token-for-tests',
            },
        ];
    }

    async upsertUser(): Promise<void> {}

    async getLatestRecoveryDate(): Promise<Date | null> {
        const newest = Math.max(...[...this.recoveries.values()].map((r) => Date.parse(r.created_at)));
        return Number.isFinite(newest) ? new Date(newest) : null;
    }

    async upsertCycles(cycles: WhoopCycle[]): Promise<void> {
        for (const cycle of cycles) {
            if (!cycle.score) continue;
            this.cycles.set(cycle.id, cycle);
            this.writes.push(`cycle ${cycle.start.slice(0, 10)}`);
        }
    }

    async upsertSleeps(sleeps: WhoopSleep[], cycleMap?: Map<string, number>): Promise<void> {
        for (const sleep of sleeps) {
            const cycle = cycleMap?.get(sleep.id) ?? null;
            if (cycle !== null && !this.cycles.has(cycle)) throw violates('whoop_sleep', 'whoop_sleep_cycle_id_fkey');
            this.sleeps.set(sleep.id, { sleep, cycleId: cycle });
            this.writes.push(`sleep ${sleep.start.slice(0, 10)}`);
        }
    }

    async upsertWorkouts(workouts: WhoopWorkout[]): Promise<void> {
        for (const workout of workouts) {
            this.workouts.set(workout.id, workout);
            this.writes.push(`workout ${workout.start.slice(0, 10)}`);
        }
    }

    async upsertRecovery(recovery: WhoopRecovery): Promise<void> {
        if (!recovery.score) return;
        if (!this.cycles.has(recovery.cycle_id)) throw violates('whoop_recovery', 'fk_whoop_recovery_cycle_id');
        if (!this.sleeps.has(recovery.sleep_id)) throw violates('whoop_recovery', 'whoop_recovery_sleep_id_fkey');
        if (this.refused.has(recovery.cycle_id)) throw new Error(`the database refused the recovery of cycle ${recovery.cycle_id}`);
        this.recoveries.set(recovery.cycle_id, recovery);
        this.writes.push(`recovery ${recovery.created_at.slice(0, 10)}`);
    }
}
