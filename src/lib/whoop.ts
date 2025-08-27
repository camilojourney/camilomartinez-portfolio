import type { WhoopProfile, WhoopCycle, WhoopSleep, WhoopRecovery, WhoopWorkout } from '@/types/whoop';

export class WhoopV2Client {
    private readonly baseUrl = 'https://api.prod.whoop.com/developer/v2';
    private readonly accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`WHOOP API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    async getUserProfile(): Promise<WhoopProfile> {
        return this.fetch<WhoopProfile>('/user/profile/basic');
    }

    async getAllCycles(startDate?: string): Promise<WhoopCycle[]> {
        const cycles: WhoopCycle[] = [];
        let page = 1;
        
        while (true) {
            const params = new URLSearchParams({
                limit: '25',
                page: page.toString(),
                ...(startDate && { start: startDate }),
            });

            const response = await this.fetch<{ records: WhoopCycle[] }>(`/cycle?${params}`);
            cycles.push(...response.records);

            if (response.records.length < 25) break;
            page++;
        }

        return cycles;
    }

    async getAllSleep(startDate?: string): Promise<WhoopSleep[]> {
        const sleeps: WhoopSleep[] = [];
        let page = 1;

        while (true) {
            const params = new URLSearchParams({
                limit: '25',
                page: page.toString(),
                ...(startDate && { start: startDate }),
            });

            const response = await this.fetch<{ records: WhoopSleep[] }>(`/activity/sleep?${params}`);
            sleeps.push(...response.records);

            if (response.records.length < 25) break;
            page++;
        }

        return sleeps;
    }

    async getAllRecovery(startDate?: string): Promise<WhoopRecovery[]> {
        const recoveries: WhoopRecovery[] = [];
        let page = 1;

        while (true) {
            const params = new URLSearchParams({
                limit: '25',
                page: page.toString(),
                ...(startDate && { start: startDate }),
            });

            const response = await this.fetch<{ records: WhoopRecovery[] }>(`/recovery?${params}`);
            recoveries.push(...response.records);

            if (response.records.length < 25) break;
            page++;
        }

        return recoveries;
    }

    async getAllWorkouts(startDate?: string): Promise<WhoopWorkout[]> {
        const workouts: WhoopWorkout[] = [];
        let page = 1;

        while (true) {
            const params = new URLSearchParams({
                limit: '25',
                page: page.toString(),
                ...(startDate && { start: startDate }),
            });

            const response = await this.fetch<{ records: WhoopWorkout[] }>(`/activity/workout?${params}`);
            workouts.push(...response.records);

            if (response.records.length < 25) break;
            page++;
        }

        return workouts;
    }

    async getCycleById(id: number): Promise<WhoopCycle> {
        return this.fetch<WhoopCycle>(`/cycle/${id}`);
    }

    async collectData(isDaily: boolean = true) {
        // Set date range
        const startDate = isDaily 
            ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            : undefined;

        // Collect all data types in parallel
        const [cycles, sleep, recovery, workouts] = await Promise.all([
            this.getAllCycles(startDate),
            this.getAllSleep(startDate),
            this.getAllRecovery(startDate),
            this.getAllWorkouts(startDate),
        ]);

        return {
            cycles,
            sleep,
            recovery,
            workouts,
            summary: {
                cycleCount: cycles.length,
                sleepCount: sleep.length,
                recoveryCount: recovery.length,
                workoutCount: workouts.length,
                totalRecords: cycles.length + sleep.length + recovery.length + workouts.length,
            }
        };
    }
}
