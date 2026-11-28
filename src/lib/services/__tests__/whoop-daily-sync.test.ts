import { describe, expect, it } from 'vitest';

import type { WhoopCycle, WhoopRecovery, WhoopSleep, WhoopWorkout } from '@/types/whoop';

import { endOfYesterday, finishedRecords, parseSince, syncWindowStart } from '../whoop-daily-sync';

const at = (iso: string) => new Date(iso);

describe('where a run starts reading', () => {
    const now = at('2026-11-28T19:17:00.000Z');

    it('starts at midnight two days ago when the stored data is up to date', () => {
        const yesterdaysRecovery = at('2026-11-27T12:00:00.000Z');

        expect(syncWindowStart(now, yesterdaysRecovery, null)).toEqual(at('2026-11-26T00:00:00.000Z'));
    });

    it('starts at midnight two days ago when nothing is stored yet', () => {
        expect(syncWindowStart(now, null, null)).toEqual(at('2026-11-26T00:00:00.000Z'));
    });

    it('reaches back to a day before the newest stored recovery after a missed run', () => {
        const lastBeforeTheOutage = at('2026-08-06T12:00:00.000Z');

        expect(syncWindowStart(now, lastBeforeTheOutage, null)).toEqual(at('2026-08-05T12:00:00.000Z'));
    });

    it('keeps the usual start when the newest stored recovery is exactly a day inside it', () => {
        // A recovery a day after the usual start resumes exactly at the usual start.
        expect(syncWindowStart(now, at('2026-11-27T00:00:00.000Z'), null)).toEqual(at('2026-11-26T00:00:00.000Z'));
        // One millisecond older, and the run reaches back by that millisecond.
        expect(syncWindowStart(now, at('2026-11-26T23:59:59.999Z'), null)).toEqual(at('2026-11-25T23:59:59.999Z'));
    });

    it('starts where since says, whatever is stored', () => {
        const since = at('2026-08-07T00:00:00.000Z');

        expect(syncWindowStart(now, at('2026-11-27T12:00:00.000Z'), since)).toEqual(since);
        expect(syncWindowStart(now, null, since)).toEqual(since);
    });

    it('counts days in UTC, not in the clock of the machine it runs on', () => {
        // 02:17 UTC on the 28th is still the 27th in New York and already midday in Tokyo.
        expect(syncWindowStart(at('2026-11-28T02:17:00.000Z'), null, null)).toEqual(at('2026-11-26T00:00:00.000Z'));
        expect(endOfYesterday(at('2026-11-28T02:17:00.000Z'))).toEqual(at('2026-11-27T23:59:59.999Z'));
    });
});

describe('the day a refill is asked from', () => {
    const now = at('2026-11-28T19:17:00.000Z');

    it('reads a day written YYYY-MM-DD as midnight UTC', () => {
        expect(parseSince('2026-08-07', now)).toEqual(at('2026-08-07T00:00:00.000Z'));
    });

    it('accepts today and refuses tomorrow', () => {
        expect(parseSince('2026-11-28', now)).toEqual(at('2026-11-28T00:00:00.000Z'));
        expect(parseSince('2026-11-29', now)).toBeNull();
    });

    it.each(['', 'yesterday', '2026-8-7', '20260807', '2026-08-07T00:00:00Z', '2026-13-01', '2026-02-30', ' 2026-08-07'])(
        'refuses "%s"',
        (asked) => {
            expect(parseSince(asked, now)).toBeNull();
        },
    );
});

// Three days as WHOOP reports them on the evening of the 27th (New York), which is
// 02:17 UTC on the 28th. A cycle runs from one sleep onset to the next.
const CUTOFF = at('2026-11-27T23:59:59.999Z');
const score = { strain: 11, kilojoule: 9000, average_heart_rate: 62, max_heart_rate: 151 };
const stamps = { user_id: 7, created_at: '', updated_at: '', timezone_offset: '-05:00', score_state: 'SCORED' };

const cycle = (id: number, start: string, end?: string): WhoopCycle =>
    ({ ...stamps, id, start, ...(end ? { end } : {}), score }) as WhoopCycle;
const sleep = (id: string, start: string, end: string): WhoopSleep => ({ ...stamps, id, start, end, nap: false });
const recovery = (cycle_id: number, sleep_id: string, created_at: string): WhoopRecovery => ({
    ...stamps,
    cycle_id,
    sleep_id,
    created_at,
});
const workout = (id: string, start: string, end: string): WhoopWorkout => ({ ...stamps, id, start, end, sport_id: 0 }) as WhoopWorkout;

const the25th = cycle(25, '2026-11-25T04:00:00.000Z', '2026-11-26T04:00:00.000Z');
const the26th = cycle(26, '2026-11-26T04:00:00.000Z', '2026-11-27T04:00:00.000Z');
const the27th = cycle(27, '2026-11-27T04:00:00.000Z'); // still open
const sleeps = [
    sleep('s25', '2026-11-25T04:00:00.000Z', '2026-11-25T11:50:00.000Z'),
    sleep('s26', '2026-11-26T04:00:00.000Z', '2026-11-26T11:50:00.000Z'),
    sleep('s27', '2026-11-27T04:00:00.000Z', '2026-11-27T11:50:00.000Z'),
];
const recoveries = [
    recovery(25, 's25', '2026-11-25T12:00:00.000Z'),
    recovery(26, 's26', '2026-11-26T12:00:00.000Z'),
    recovery(27, 's27', '2026-11-27T12:00:00.000Z'),
];
const ids = <T, K extends keyof T>(records: T[], key: K) => records.map((record) => record[key]);

describe('which records a run may store', () => {
    it('holds back the recovery of a cycle that is still open, and keeps its sleep without a cycle', () => {
        const finished = finishedRecords({ cycles: [the25th, the26th, the27th], sleeps, recoveries, workouts: [] }, CUTOFF);

        expect(ids(finished.cycles, 'id')).toEqual([25, 26]);
        expect(ids(finished.recoveries, 'cycle_id')).toEqual([25, 26]);
        expect(ids(finished.sleeps, 'id')).toEqual(['s25', 's26', 's27']);
        expect([...finished.sleepCycles]).toEqual([
            ['s25', 25],
            ['s26', 26],
        ]);
        expect(finished.waiting).toBe(1);
    });

    it('treats an ended cycle without a score like an open one', () => {
        const unscored = { ...the26th, score: undefined } as unknown as WhoopCycle;

        const finished = finishedRecords({ cycles: [the25th, unscored], sleeps, recoveries: recoveries.slice(0, 2), workouts: [] }, CUTOFF);

        expect(ids(finished.cycles, 'id')).toEqual([25]);
        expect(ids(finished.recoveries, 'cycle_id')).toEqual([25]);
        expect(finished.sleepCycles.has('s26')).toBe(false);
        expect(finished.waiting).toBe(1);
    });

    it('stores the cycle of a stored recovery even though that cycle ended after the cutoff', () => {
        // At 19:17 UTC on the 28th the cycle of the 27th has ended (04:00 today), and
        // its recovery was created yesterday.
        const ended = cycle(27, '2026-11-27T04:00:00.000Z', '2026-11-28T04:00:00.000Z');

        const finished = finishedRecords({ cycles: [the26th, ended], sleeps, recoveries: recoveries.slice(1), workouts: [] }, CUTOFF);

        expect(ids(finished.cycles, 'id')).toEqual([26, 27]);
        expect(ids(finished.recoveries, 'cycle_id')).toEqual([26, 27]);
        expect(finished.sleepCycles.get('s27')).toBe(27);
        expect(finished.waiting).toBe(0);
    });

    it('leaves an ended cycle with no stored recovery for tomorrow when it ended after the cutoff', () => {
        const ended = cycle(27, '2026-11-27T04:00:00.000Z', '2026-11-28T04:00:00.000Z');

        const finished = finishedRecords({ cycles: [the26th, ended], sleeps: [], recoveries: [], workouts: [] }, CUTOFF);

        expect(ids(finished.cycles, 'id')).toEqual([26]);
    });

    it('stores what finished at the cutoff and not what finished a millisecond after it', () => {
        const atCutoff = '2026-11-27T23:59:59.999Z';
        const after = '2026-11-28T00:00:00.000Z';

        const finished = finishedRecords(
            {
                cycles: [the27th, cycle(26, '2026-11-26T04:00:00.000Z', after)],
                sleeps: [sleep('on', '2026-11-27T20:00:00.000Z', atCutoff), sleep('late', '2026-11-27T20:00:00.000Z', after)],
                recoveries: [recovery(26, 'on', atCutoff), recovery(26, 'on', after)],
                workouts: [workout('on', '2026-11-27T22:00:00.000Z', atCutoff), workout('late', '2026-11-27T22:00:00.000Z', after)],
            },
            CUTOFF,
        );

        expect(ids(finished.sleeps, 'id')).toEqual(['on']);
        expect(ids(finished.workouts, 'id')).toEqual(['on']);
        expect(ids(finished.recoveries, 'created_at')).toEqual([atCutoff]);
        // The cycle ended after the cutoff and is stored only for its recovery.
        expect(ids(finished.cycles, 'id')).toEqual([26]);
    });

    it('does not store a recovery whose sleep this run did not read', () => {
        // The first recovery after the start of the window: its sleep ended just before it.
        const finished = finishedRecords({ cycles: [the25th, the26th], sleeps: sleeps.slice(1, 2), recoveries: recoveries.slice(0, 2), workouts: [] }, CUTOFF);

        expect(ids(finished.recoveries, 'cycle_id')).toEqual([26]);
        // It is not waiting for anything: an earlier run stored it with its sleep.
        expect(finished.waiting).toBe(0);
    });

    it('skips a workout still in progress', () => {
        const running = { ...workout('running', '2026-11-27T22:00:00.000Z', ''), end: undefined } as unknown as WhoopWorkout;

        expect(finishedRecords({ cycles: [], sleeps: [], recoveries: [], workouts: [running] }, CUTOFF).workouts).toEqual([]);
    });

    it('returns every list oldest first, whatever order WHOOP sent', () => {
        const finished = finishedRecords(
            {
                cycles: [the26th, the25th],
                sleeps: [...sleeps].reverse(),
                recoveries: [...recoveries].reverse(),
                workouts: [
                    workout('w26', '2026-11-26T22:00:00.000Z', '2026-11-26T23:00:00.000Z'),
                    workout('w25', '2026-11-25T22:00:00.000Z', '2026-11-25T23:00:00.000Z'),
                ],
            },
            CUTOFF,
        );

        expect(ids(finished.cycles, 'id')).toEqual([25, 26]);
        expect(ids(finished.sleeps, 'id')).toEqual(['s25', 's26', 's27']);
        expect(ids(finished.recoveries, 'cycle_id')).toEqual([25, 26]);
        expect(ids(finished.workouts, 'id')).toEqual(['w25', 'w26']);
    });

    it('stores nothing when WHOOP sent nothing', () => {
        const finished = finishedRecords({ cycles: [], sleeps: [], recoveries: [], workouts: [] }, CUTOFF);

        expect(finished).toEqual({ cycles: [], sleeps: [], recoveries: [], workouts: [], sleepCycles: new Map(), waiting: 0 });
    });
});
