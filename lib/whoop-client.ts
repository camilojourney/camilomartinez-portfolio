import {
    WhoopUser,
    WhoopCycle,
    WhoopSleep,
    WhoopRecovery,
    WhoopWorkout,
    WhoopCyclesResponse,
    WhoopWorkoutsResponse,
    WhoopSleepResponse
} from '../types/whoop';

export class WhoopV2Client {
    private baseUrl = 'https://api.prod.whoop.com/developer/v2';
    private accessToken: string;
    private lastRequestTime = 0;
    private minRequestInterval = 200; // 200ms between requests (5 requests per second max)

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async waitForRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.minRequestInterval) {
            const waitTime = this.minRequestInterval - timeSinceLastRequest;
            await this.delay(waitTime);
        }

        this.lastRequestTime = Date.now();
    }

    private async makeRequest<T>(endpoint: string, retryCount = 0): Promise<T> {
        const maxRetries = 3;

        // Implement rate limiting
        await this.waitForRateLimit();

        console.log(`🌐 API call: ${endpoint}`);

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                // Handle rate limiting with exponential backoff
                if (response.status === 429 && retryCount < maxRetries) {
                    const backoffTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
                    console.log(`Rate limited. Retrying in ${backoffTime}ms... (attempt ${retryCount + 1}/${maxRetries})`);
                    await this.delay(backoffTime);
                    return this.makeRequest<T>(endpoint, retryCount + 1);
                }

                const errorText = await response.text();
                console.error(`❌ API error for ${endpoint}: ${response.status} - ${errorText}`);
                throw new Error(`WHOOP API error: ${response.status} - ${errorText}`);
            }

            console.log(`✅ API success: ${endpoint}`);
            return response.json();
        } catch (error) {
            if (retryCount < maxRetries && (error instanceof Error && error.message.includes('fetch'))) {
                // Network error, retry
                const backoffTime = Math.pow(2, retryCount) * 1000;
                console.log(`Network error. Retrying in ${backoffTime}ms... (attempt ${retryCount + 1}/${maxRetries})`);
                await this.delay(backoffTime);
                return this.makeRequest<T>(endpoint, retryCount + 1);
            }
            throw error;
        }
    }

    // Get user profile
    async getUserProfile(): Promise<WhoopUser> {
        return this.makeRequest<WhoopUser>('/user/profile/basic');
    }

    // Get cycles with pagination
    async getCycles(start?: string, end?: string, nextToken?: string): Promise<WhoopCyclesResponse> {
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        if (nextToken) params.append('nextToken', nextToken);

        const endpoint = `/cycle${params.toString() ? `?${params.toString()}` : ''}`;
        return this.makeRequest<WhoopCyclesResponse>(endpoint);
    }

    // Get all cycles (handles pagination automatically)
    async getAllCycles(start?: string, end?: string): Promise<WhoopCycle[]> {
        const allCycles: WhoopCycle[] = [];
        let nextToken: string | undefined;

        do {
            const response = await this.getCycles(start, end, nextToken);
            allCycles.push(...response.records);
            nextToken = response.next_token;
        } while (nextToken);

        return allCycles;
    }

    // Get sleep data for a specific cycle (v2 uses /cycle/{cycleId}/sleep relationship)
    async getSleep(cycleId: number): Promise<WhoopSleep> {
        return this.makeRequest<WhoopSleep>(`/cycle/${cycleId}/sleep`);
    }

    // Get sleep data by sleep ID (sleep IDs are now UUIDs in v2)
    async getSleepById(sleepId: string): Promise<WhoopSleep> {
        return this.makeRequest<WhoopSleep>(`/activity/sleep/${sleepId}`);
    }

    // Get all sleep records with pagination (correct method)
    async getSleepCollection(start?: string, end?: string, nextToken?: string): Promise<WhoopSleepResponse> {
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        if (nextToken) params.append('nextToken', nextToken);

        const endpoint = `/activity/sleep${params.toString() ? `?${params.toString()}` : ''}`;
        return this.makeRequest<WhoopSleepResponse>(endpoint);
    }

    // Get all sleep records (handles pagination automatically)
    async getAllSleep(start?: string, end?: string): Promise<WhoopSleep[]> {
        const allSleep: WhoopSleep[] = [];
        let nextToken: string | undefined;

        do {
            const response = await this.getSleepCollection(start, end, nextToken);
            allSleep.push(...response.records);
            nextToken = response.next_token;
        } while (nextToken);

        return allSleep;
    }

    // Get recovery data for a specific cycle
    async getRecovery(cycleId: number): Promise<WhoopRecovery> {
        return this.makeRequest<WhoopRecovery>(`/cycle/${cycleId}/recovery`);
    }

    // Get workouts with pagination
    async getWorkouts(start?: string, end?: string, nextToken?: string): Promise<WhoopWorkoutsResponse> {
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        if (nextToken) params.append('nextToken', nextToken);

        const endpoint = `/activity/workout${params.toString() ? `?${params.toString()}` : ''}`;
        return this.makeRequest<WhoopWorkoutsResponse>(endpoint);
    }

    // Get all workouts (handles pagination automatically)
    async getAllWorkouts(start?: string, end?: string): Promise<WhoopWorkout[]> {
        const allWorkouts: WhoopWorkout[] = [];
        let nextToken: string | undefined;

        do {
            const response = await this.getWorkouts(start, end, nextToken);
            allWorkouts.push(...response.records);
            nextToken = response.next_token;
        } while (nextToken);

        return allWorkouts;
    }

    // Helper method to get cycle data with sleep and recovery
    async getCycleWithDetails(cycleId: number): Promise<{
        cycle: WhoopCycle;
        sleep: WhoopSleep | null;
        recovery: WhoopRecovery | null;
    }> {
        const cycle = await this.makeRequest<WhoopCycle>(`/cycle/${cycleId}`);

        let sleep: WhoopSleep | null = null;
        let recovery: WhoopRecovery | null = null;

        try {
            // In v2, the sleep endpoint for cycles should work properly
            sleep = await this.getSleep(cycleId);
        } catch (error) {
            console.warn(`No sleep data for cycle ${cycleId}:`, error);
        }

        try {
            recovery = await this.getRecovery(cycleId);
        } catch (error) {
            console.warn(`No recovery data for cycle ${cycleId}:`, error);
        }

        return { cycle, sleep, recovery };
    }
}
