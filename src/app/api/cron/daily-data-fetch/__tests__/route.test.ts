import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cycleId, FakeStore, FakeWhoop, nights, sleepId } from './whoop-fakes';

const held = vi.hoisted(() => ({ store: undefined as unknown, viewRefreshes: 0 }));

vi.mock('@/lib/db/whoop-database', () => ({
    // The route builds its own service, so the class hands every call to the test's store.
    WhoopDatabaseService: class {
        constructor() {
            return held.store as object;
        }
    },
}));
vi.mock('@/lib/services/token-refresh-service', () => ({
    TokenRefreshService: class {
        async refreshAllUserTokens() {
            return { successful: 1, failed: 0, errors: [] };
        }
    },
}));
vi.mock('@/lib/db/db', () => ({
    sql: async () => {
        held.viewRefreshes += 1;
        return { rows: [] };
    },
}));

import { POST } from '../route';

const SECRET = 'cron-secret-for-tests';
const ENDPOINT = 'https://site.test/api/cron/daily-data-fetch';

interface Answer {
    status: number;
    body: {
        success: boolean;
        error?: string;
        data?: {
            successfulUsers: number;
            failedUsers: number;
            errors: string[];
            userResults: Array<{ from: string; newCycles: number; newRecovery: number; waiting: number }>;
        };
    };
}

/** The dates from `first` to `last`, both included. */
function daysBetween(first: string, last: string): string[] {
    const days: string[] = [];
    for (let at = Date.parse(first); at <= Date.parse(last); at += 24 * 60 * 60 * 1000) {
        days.push(new Date(at).toISOString().slice(0, 10));
    }
    return days;
}

describe('the daily WHOOP fetch', () => {
    let store: FakeStore;

    beforeEach(() => {
        store = new FakeStore();
        held.store = store;
        held.viewRefreshes = 0;
        vi.stubEnv('CRON_SECRET', SECRET);
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    /** Set the clock, give WHOOP the days `first..` as it would hold them then, and return it. */
    function whoopAt(now: string, first: string, count: number): FakeWhoop {
        vi.useFakeTimers({ now: new Date(now), toFake: ['setTimeout', 'clearTimeout', 'Date'] });
        const whoop = new FakeWhoop(nights(first, count, new Date(now)));
        vi.stubGlobal('fetch', whoop.fetch);
        return whoop;
    }

    /** Call the endpoint the way the scheduled job does and wait out the client's pauses. */
    async function run(query = '', secret: string | null = SECRET): Promise<Answer> {
        const request = new Request(`${ENDPOINT}${query}`, {
            method: 'POST',
            headers: secret ? { 'x-cron-secret': secret } : {},
        });
        let settled = false;
        const answer = POST(request).finally(() => {
            settled = true;
        });
        answer.catch(() => {});
        while (!settled) await vi.advanceTimersByTimeAsync(1000);
        const response = await answer;
        const text = await response.text();
        // A refused call is answered in plain text, everything else in JSON.
        return { status: response.status, body: text.startsWith('{') ? JSON.parse(text) : { success: false, error: text } };
    }

    it('stores the finished days and succeeds when it runs while the newest cycle is still open', async () => {
        // 02:17 UTC is the evening of the 27th in New York: the cycle that began on the
        // 27th is still running, but its recovery was created that morning, "yesterday" in UTC.
        whoopAt('2026-11-28T02:17:00.000Z', '2026-11-20', 8);
        store.hold(nights('2026-11-20', 6, new Date('2026-11-27T02:00:00.000Z')));

        const { status, body } = await run();

        expect(body.data?.errors).toEqual([]);
        expect(body.data?.failedUsers).toBe(0);
        expect(status).toBe(200);
        expect(body.success).toBe(true);
        expect(store.completeDays()).toEqual(daysBetween('2026-11-20', '2026-11-26'));
        // The 27th waits: no cycle, no recovery, and its sleep is kept without a cycle.
        expect(store.cycles.has(cycleId('2026-11-27'))).toBe(false);
        expect(store.recoveries.has(cycleId('2026-11-27'))).toBe(false);
        expect(store.sleeps.get(sleepId('2026-11-27'))?.cycleId).toBeNull();
        expect(body.data?.userResults[0]?.waiting).toBe(1);
    });

    it('stores a day that waited once its cycle has ended', async () => {
        whoopAt('2026-11-28T02:17:00.000Z', '2026-11-20', 8);
        store.hold(nights('2026-11-20', 6, new Date('2026-11-27T02:00:00.000Z')));
        await run();
        vi.useRealTimers();

        whoopAt('2026-11-28T19:17:00.000Z', '2026-11-20', 9);
        const { status, body } = await run();

        expect(status).toBe(200);
        expect(store.completeDays()).toEqual(daysBetween('2026-11-20', '2026-11-27'));
        expect(body.data?.userResults[0]?.waiting).toBe(0);
        // Nothing that finished today is stored yet, such as this morning's sleep.
        expect(store.sleeps.has(sleepId('2026-11-28'))).toBe(false);
    });

    it('refills every missed day on the first run after an outage', async () => {
        // The last run before the outage stored the 6th of August.
        const whoop = whoopAt('2026-11-28T19:17:00.000Z', '2026-08-01', 120);
        store.hold(nights('2026-08-01', 6, new Date('2026-08-07T19:00:00.000Z')));

        const { status, body } = await run();

        expect(status).toBe(200);
        expect(body.data?.failedUsers).toBe(0);
        expect(store.completeDays()).toEqual(daysBetween('2026-08-01', '2026-11-27'));
        expect([...store.workouts.keys()]).toHaveLength(119);
        // It read from the day before the newest stored recovery (6 August, 12:00).
        expect(body.data?.userResults[0]?.from).toBe('2026-08-05T12:00:00.000Z');
        // One profile call, then five pages of 25 for each of the four lists (about 116
        // records each). No cycle is fetched one by one, however long the outage was.
        expect(whoop.calls.filter((call) => call.startsWith('/cycle/'))).toEqual([]);
        expect(whoop.calls).toHaveLength(21);
    });

    it('writes oldest first, and a recovery only after its cycle and its sleep', async () => {
        whoopAt('2026-11-28T19:17:00.000Z', '2026-11-20', 9);
        store.hold(nights('2026-11-20', 3, new Date('2026-11-23T19:00:00.000Z')));

        await run();

        const kinds = store.writes.map((write) => write.split(' ')[0]);
        const firstOf = (kind: string) => kinds.indexOf(kind);
        const lastOf = (kind: string) => kinds.lastIndexOf(kind);
        expect(lastOf('cycle')).toBeLessThan(firstOf('sleep'));
        expect(lastOf('sleep')).toBeLessThan(firstOf('workout'));
        expect(lastOf('workout')).toBeLessThan(firstOf('recovery'));
        for (const kind of ['cycle', 'sleep', 'workout', 'recovery']) {
            const days = store.writes.filter((write) => write.startsWith(kind)).map((write) => write.split(' ')[1]);
            expect(days, `${kind} rows`).toEqual([...days].sort());
            expect(days.length, `${kind} rows`).toBeGreaterThan(1);
        }
    });

    it('refills a hole that lies behind newer data only when since names where to start', async () => {
        // A run during the outage stored the 25th and 26th of November, so the newest
        // stored recovery is recent and August to November is a hole behind it.
        whoopAt('2026-11-28T19:17:00.000Z', '2026-08-01', 120);
        store.hold(nights('2026-08-01', 6, new Date('2026-08-07T19:00:00.000Z')));
        store.hold(nights('2026-11-25', 2, new Date('2026-11-27T19:00:00.000Z')));

        await run();
        expect(store.completeDays()).not.toContain('2026-09-15');

        const { status, body } = await run('?since=2026-08-07');

        expect(status).toBe(200);
        expect(body.data?.userResults[0]?.from).toBe('2026-08-07T00:00:00.000Z');
        expect(store.completeDays()).toEqual(daysBetween('2026-08-01', '2026-11-27'));
    });

    it.each(['tomorrow', '2026-8-7', '2026-02-30', '2026-11-29'])(
        'refuses since=%s before reading anything',
        async (since) => {
            const whoop = whoopAt('2026-11-28T19:17:00.000Z', '2026-11-20', 9);

            const { status, body } = await run(`?since=${since}`);

            expect(status).toBe(400);
            expect(body.success).toBe(false);
            expect(body.error).toContain('YYYY-MM-DD');
            expect(whoop.calls).toEqual([]);
            expect(store.writes).toEqual([]);
        },
    );

    it('answers 500 when WHOOP fails, so the scheduled job fails with it', async () => {
        const whoop = whoopAt('2026-11-28T19:17:00.000Z', '2026-11-20', 9);
        whoop.failOn('/recovery', 500);

        const { status, body } = await run();

        expect(status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.data?.failedUsers).toBe(1);
        expect(body.data?.errors.join(' ')).toContain('WHOOP API error: 500');
        expect(store.writes).toEqual([]);
    });

    it('answers 500 when the database refuses a recovery, and still stores the others', async () => {
        whoopAt('2026-11-28T19:17:00.000Z', '2026-11-20', 9);
        store.hold(nights('2026-11-20', 3, new Date('2026-11-23T19:00:00.000Z')));
        store.refuseRecovery('2026-11-25');

        const { status, body } = await run();

        expect(status).toBe(500);
        expect(body.data?.failedUsers).toBe(1);
        expect(body.data?.errors.join(' ')).toContain(`Recovery for cycle ${cycleId('2026-11-25')} failed`);
        expect(store.recoveries.has(cycleId('2026-11-25'))).toBe(false);
        expect(store.recoveries.has(cycleId('2026-11-26'))).toBe(true);
        expect(store.recoveries.has(cycleId('2026-11-27'))).toBe(true);
    });

    it('refuses a call without the cron secret and reads and stores nothing', async () => {
        const whoop = whoopAt('2026-11-28T19:17:00.000Z', '2026-11-20', 9);

        expect((await run('', null)).status).toBe(401);
        expect((await run('', 'not-the-secret')).status).toBe(401);
        expect(whoop.calls).toEqual([]);
        expect(store.writes).toEqual([]);
        expect(held.viewRefreshes).toBe(0);
    });
});
