import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getServerAuth } from '@/lib/auth-server';
import WhoopDemo from '../../apps/whoop-app/page';
import LiveData from '../page';

vi.mock('@/lib/auth-server', () => ({ getServerAuth: vi.fn() }));
vi.mock('@/components/features/auth/AuthButtons', () => ({
    AuthButtons: () => <button>WHOOP connection</button>,
}));

const connectedSession = {
    user: { id: 'test-user', name: 'Camilo', email: 'camilo@example.com' },
    expires: '2099-01-01',
    accessToken: 'test-token',
};

const recoveryRecord = {
    created_at: '2026-01-15T12:00:00Z',
    updated_at: '2026-01-15T12:00:00Z',
    score: {
        user_calibrating: false,
        recovery_score: 75,
        resting_heart_rate: 50,
        hrv_rmssd_ms: 60,
    },
};

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
    vi.restoreAllMocks();
});

for (const [name, Page] of [['WHOOP demo', WhoopDemo], ['Live data', LiveData]] as const) {
    describe(name, () => {
        it('asks signed-out visitors to connect without fetching health data', async () => {
            vi.mocked(getServerAuth).mockResolvedValue(null);
            const fetchData = vi.fn();
            vi.stubGlobal('fetch', fetchData);

            const html = renderToStaticMarkup(await Page());

            expect(html).toContain('Connect your WHOOP account');
            expect(html).not.toContain('No recovery');
            expect(fetchData).not.toHaveBeenCalled();
        });

        it.each([
            { ...connectedSession, error: 'RefreshAccessTokenError' },
            { user: connectedSession.user, expires: connectedSession.expires },
        ])('distinguishes unusable authentication from empty data', async (session) => {
            vi.mocked(getServerAuth).mockResolvedValue(session);
            const fetchData = vi.fn();
            vi.stubGlobal('fetch', fetchData);

            const html = renderToStaticMarkup(await Page());

            expect(html).toContain('role="alert"');
            expect(html).toContain('Disconnect and reconnect your WHOOP account.');
            expect(html).not.toContain('No recovery');
            expect(html).not.toContain('Loading recovery data');
            expect(fetchData).not.toHaveBeenCalled();
        });

        it('renders exactly one empty state after a successful empty response', async () => {
            vi.mocked(getServerAuth).mockResolvedValue(connectedSession);
            const fetchData = vi.fn().mockResolvedValue(Response.json({ records: [] }));
            vi.stubGlobal('fetch', fetchData);

            const html = renderToStaticMarkup(await Page());

            expect(html.match(/No recovery (?:data available|records yet)/g)).toHaveLength(1);
            expect(html).toContain('Your WHOOP account is connected, but no recovery data was found.');
            expect(html).not.toContain('role="alert"');
            expect(fetchData).toHaveBeenCalledWith(
                'https://api.prod.whoop.com/developer/v2/recovery?limit=7',
                { headers: { Authorization: 'Bearer test-token' } },
            );
        });

        it('renders recovery metrics after a successful populated response', async () => {
            vi.mocked(getServerAuth).mockResolvedValue(connectedSession);
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ records: [recoveryRecord] })));

            const html = renderToStaticMarkup(await Page());

            expect(html).toContain('7-Day Recovery Trend');
            expect(html).toContain('75%');
            expect(html).toContain('60 ms');
            expect(html).toContain('50 bpm');
            expect(html).not.toContain('No recovery');
            expect(html).not.toContain('role="alert"');
        });

        it('renders a fetch error instead of empty data when WHOOP rejects the request', async () => {
            vi.mocked(getServerAuth).mockResolvedValue(connectedSession);
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
            vi.spyOn(console, 'error').mockImplementation(() => {});

            const html = renderToStaticMarkup(await Page());

            expect(html).toContain('role="alert"');
            expect(html).toContain('Failed to fetch WHOOP data: 401');
            expect(html).not.toContain('No recovery');
        });
    });
}

it('preserves the authenticated WHOOP demo analytics copy', async () => {
    vi.mocked(getServerAuth).mockResolvedValue(connectedSession);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ records: [] })));

    const html = renderToStaticMarkup(await WhoopDemo());

    expect(html).toContain('Advanced Analytics Dashboard');
    expect(html).toContain('These charts use stored data from your WHOOP account to show insights about strain, sleep performance, recovery, and workout patterns.');
    expect(html).toContain('Workout Analytics');
    expect(html).toContain('Analyze your workout patterns over time with detailed breakdowns by sport type.');
});
