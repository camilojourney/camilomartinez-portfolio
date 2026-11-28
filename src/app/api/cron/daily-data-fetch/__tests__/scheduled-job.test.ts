// Runs the script of .github/workflows/cron-daily-data-fetch.yml, read out of the
// parsed workflow, against a local server standing in for the site.

import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const WORKFLOW = resolve(__dirname, '../../../../../..', '.github/workflows/cron-daily-data-fetch.yml');
const SECRET = 'cron-secret-for-tests';

interface Workflow {
    on: { schedule: Array<{ cron: string }>; workflow_dispatch: { inputs: Record<string, { required?: boolean }> } };
    jobs: { trigger: { steps: Array<{ run: string; env: Record<string, string> }> } };
}

const workflow = parse(readFileSync(WORKFLOW, 'utf8')) as Workflow;
const step = workflow.jobs.trigger.steps[0];

interface Seen {
    method?: string;
    url?: string;
    secret?: string | string[];
}

describe('the scheduled job that calls the daily fetch', () => {
    let site: Server | undefined;

    afterEach(() => {
        site?.close();
        site = undefined;
    });

    /** Start a site that answers every request with `status` and `body`, and run the job against it. */
    async function runJob(status: number, body: string, env: Record<string, string> = {}) {
        const seen: Seen[] = [];
        site = createServer((request, response) => {
            seen.push({ method: request.method, url: request.url, secret: request.headers['x-cron-secret'] });
            response.writeHead(status, { 'content-type': body.startsWith('{') ? 'application/json' : 'text/plain' });
            response.end(body);
        });
        await new Promise<void>((ready) => site?.listen(0, '127.0.0.1', ready));
        const { port } = site.address() as AddressInfo;

        return new Promise<{ exit: number; summary: string; printed: string; seen: Seen[] }>((done) => {
            execFile(
                'bash',
                ['-e', '-c', step?.run ?? ''],
                { env: { ...process.env, CRON_SECRET: SECRET, ENDPOINT: `http://127.0.0.1:${port}/fetch`, SINCE: '', ...env } },
                (error, stdout, stderr) => {
                    const exit = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
                    done({ exit, summary: stdout, printed: stdout + stderr, seen });
                },
            );
        });
    }

    const stored = JSON.stringify({
        success: true,
        data: {
            totalUsers: 1,
            successfulUsers: 1,
            failedUsers: 0,
            userResults: [
                {
                    userId: 90000001,
                    userName: 'Mica Example',
                    from: '2026-11-26T00:00:00.000Z',
                    newCycles: 2,
                    newSleep: 2,
                    newRecovery: 2,
                    newWorkouts: 1,
                    waiting: 0,
                },
            ],
            errors: [],
            tokenRefreshResults: { successful: 1, failed: 0, errors: [] },
        },
        refreshWarning: null,
    });
    const notStored = JSON.stringify({
        success: false,
        data: {
            totalUsers: 1,
            successfulUsers: 0,
            failedUsers: 1,
            userResults: [],
            errors: ['Error processing user 90000001: WHOOP API error: 500 Internal Server Error'],
            tokenRefreshResults: { successful: 0, failed: 1, errors: ['Failed to refresh tokens for Mica Example (90000001)'] },
        },
        refreshWarning: null,
    });

    it('is set to run once a day, off the hour, against the live site', () => {
        expect(workflow.on.schedule).toHaveLength(1);
        const [minute, hour, ...rest] = (workflow.on.schedule[0]?.cron ?? '').split(' ');
        expect(rest).toEqual(['*', '*', '*']);
        expect(Number(hour)).toBeGreaterThanOrEqual(0);
        // GitHub delays, and can drop, runs queued at the start of an hour.
        expect(Number(minute)).toBeGreaterThan(0);
        expect(step?.env.ENDPOINT).toBe('https://www.camilomartinez.co/api/cron/daily-data-fetch');
        expect(step?.env.CRON_SECRET).toBe('${{ secrets.CRON_SECRET }}');
    });

    it('takes since as an optional input when it is started by hand', () => {
        expect(workflow.on.workflow_dispatch.inputs.since?.required).toBe(false);
        expect(step?.env.SINCE).toBe('${{ inputs.since }}');
    });

    it('succeeds when the fetch stored the data, and prints what was stored', async () => {
        const { exit, summary, seen } = await runJob(200, stored);

        expect(exit).toBe(0);
        expect(JSON.parse(summary)).toMatchObject({
            success: true,
            stored: 1,
            failed: 0,
            runs: [{ from: '2026-11-26T00:00:00.000Z', newCycles: 2, newRecovery: 2, waiting: 0 }],
        });
        expect(seen).toEqual([{ method: 'POST', url: '/fetch', secret: SECRET }]);
    });

    it('fails when the fetch answers that a user was not stored, and prints why', async () => {
        const { exit, summary } = await runJob(500, notStored);

        expect(exit).not.toBe(0);
        expect(JSON.parse(summary)).toMatchObject({
            success: false,
            failed: 1,
            errors: ['Error processing user: WHOOP API error: 500 Internal Server Error'],
            tokens: { failed: 1 },
        });
    });

    it.each([
        ['stored', 200, stored],
        ['not stored', 500, notStored],
    ])('prints neither the name nor the id of the user when the data was %s', async (_case, status, body) => {
        const { printed } = await runJob(status, body);

        expect(printed).not.toContain('Mica');
        expect(printed).not.toContain('90000001');
    });

    it('fails and shows the answer when the site does not answer in JSON', async () => {
        const { exit, printed } = await runJob(504, 'An error occurred with your deployment\n\nFUNCTION_INVOCATION_TIMEOUT');

        expect(exit).not.toBe(0);
        expect(printed).toContain('FUNCTION_INVOCATION_TIMEOUT');
    });

    it('asks for a refill from the day given as since', async () => {
        const { exit, seen } = await runJob(200, stored, { SINCE: '2026-08-07' });

        expect(exit).toBe(0);
        expect(seen).toEqual([{ method: 'POST', url: '/fetch?since=2026-08-07', secret: SECRET }]);
    });

    it('sends a since it was given as one value, whatever it holds', async () => {
        const { seen } = await runJob(200, stored, { SINCE: '2026-08-07&dryRun=true' });

        expect(seen[0]?.url).toBe('/fetch?since=2026-08-07%26dryRun%3dtrue');
    });

    it('calls nothing when it has no secret', async () => {
        const { exit, printed, seen } = await runJob(200, stored, { CRON_SECRET: '' });

        expect(exit).toBe(0);
        expect(printed).toContain('CRON_SECRET is not set');
        expect(seen).toEqual([]);
    });
});
