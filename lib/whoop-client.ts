import {
    WhoopUser,
    WhoopCycle,
    WhoopSleep,
    WhoopRecovery,
    WhoopWorkout
} from '../types/whoop';

const WHOOP_PAGE_LIMIT = 25;

export class WhoopV2Client {
    private baseUrl = 'https://api.prod.whoop.com/developer/v2';
    private accessToken: string;
    private lastRequestTime = 0;
    private minRequestInterval = 700; // 700ms between requests (~85 requests/minute, safely under 100 limit)
    private requestCount = 0;
    private dailyRequestCount = 0;
    private dailyResetTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async waitForRateLimit(): Promise<void> {
        const now = Date.now();

        if (now > this.dailyResetTime) {
            this.dailyRequestCount = 0;
            this.dailyResetTime = now + (24 * 60 * 60 * 1000);
            console.log('🔄 Daily rate limit counter reset');
        }

        if (this.dailyRequestCount >= 9500) {
            console.warn('⚠️ Approaching daily rate limit (9500/10000), slowing down requests');
            this.minRequestInterval = 1500;
        }

        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
            const waitTime = this.minRequestInterval - timeSinceLastRequest;
            await this.delay(waitTime);
        }

        this.lastRequestTime = Date.now();
        this.requestCount++;
        this.dailyRequestCount++;

        if (this.requestCount % 50 === 0) {
            console.log(`📊 API Progress: ${this.requestCount} requests made, ${this.dailyRequestCount} today`);
        }
    }

    private async makeRequest<T>(endpoint: string, retryCount = 0): Promise<T> {
        const maxRetries = 3;
        await this.waitForRateLimit();
        const fullUrl = `${this.baseUrl}${endpoint}`;
        console.log(`🌐 API call: ${fullUrl}`);

        try {
            const response = await fetch(fullUrl, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 429 && retryCount < maxRetries) {
                    const backoffTime = Math.pow(2, retryCount) * 1000;
                    console.log(`Rate limited. Retrying in ${backoffTime}ms...`);
                    await this.delay(backoffTime);
                    return this.makeRequest<T>(endpoint, retryCount + 1);
                }
                const errorText = await response.text();
                console.error(`❌ API error for ${endpoint}: ${response.status} - ${errorText}`);
                throw new Error(`WHOOP API error: ${response.status} - ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            if (retryCount < maxRetries && (error instanceof Error && (error.message.includes('fetch') || error.message.includes('Unexpected token')))) {
                const backoffTime = Math.pow(2, retryCount) * 1000;
                console.log(`Network or parsing error. Retrying in ${backoffTime}ms...`);
                await this.delay(backoffTime);
                return this.makeRequest<T>(endpoint, retryCount + 1);
            }
            throw error;
        }
    }

    async getUserProfile(): Promise<WhoopUser> {
        return this.makeRequest<WhoopUser>('/user/profile/basic');
    }

    async getCycleById(cycleId: number): Promise<WhoopCycle> {
        return this.makeRequest<WhoopCycle>(`/cycle/${cycleId}`);
    }

    async getSleep(cycleId: number): Promise<WhoopSleep> {
        // According to API docs, we can get sleep for a specific cycle
        return this.makeRequest<WhoopSleep>(`/cycle/${cycleId}/sleep`);
    }

    async getRecovery(cycleId: number): Promise<WhoopRecovery> {
        // According to API docs, we can get recovery for a specific cycle
        return this.makeRequest<WhoopRecovery>(`/cycle/${cycleId}/recovery`);
    }

    private async paginatedGet<T>(endpoint: string, start?: string, end?: string): Promise<T[]> {
        const allRecords: T[] = [];
        let nextToken: string | undefined;
        let pageCount = 0;

        console.log(`[DEBUG] Starting pagination for: ${endpoint}`);

        do {
            pageCount++;
            const params = new URLSearchParams({ limit: String(WHOOP_PAGE_LIMIT) });
            if (start) params.append('start', start);
            if (end) params.append('end', end);
            if (nextToken) params.append('nextToken', nextToken);

            const response = await this.makeRequest<{ records: T[], next_token?: string }>(`${endpoint}?${params.toString()}`);

            // --- Enhanced Debug Logs ---
            console.log(`[DEBUG] Page ${pageCount} for ${endpoint} | Records received: ${response.records?.length || 0}`);
            if (response.next_token) {
                console.log(`[DEBUG] next_token found: ${response.next_token}`);
            } else {
                console.log(`[DEBUG] No next_token found. Ending pagination for ${endpoint}.`);
            }
            // --- End Enhanced Debug Logs ---

            if (response.records?.length) {
                allRecords.push(...response.records);
            }

            nextToken = response.next_token;

            if (pageCount > 500) {
                console.warn(`🚨 WARNING: Breaking pagination loop for ${endpoint} after 500 pages`);
                break;
            }
        } while (nextToken);

        console.log(`[DEBUG] Finished pagination for ${endpoint}. Total pages: ${pageCount}, Total records: ${allRecords.length}`);
        return allRecords;
    }

    async getAllSleep(start?: string, end?: string): Promise<WhoopSleep[]> {
        return this.paginatedGet<WhoopSleep>('/activity/sleep', start, end);
    }

    async getAllRecovery(start?: string, end?: string): Promise<WhoopRecovery[]> {
        return this.paginatedGet<WhoopRecovery>('/recovery', start, end);
    }

    async getAllWorkouts(start?: string, end?: string): Promise<WhoopWorkout[]> {
        return this.paginatedGet<WhoopWorkout>('/activity/workout', start, end);
    }

    async getAllCycles(start?: string, end?: string): Promise<WhoopCycle[]> {
        const allCycles: WhoopCycle[] = [];
        let nextToken: string | undefined;
        let localEnd = end;
        let pageCount = 0;
        do {
            pageCount++;
            const params = new URLSearchParams({ limit: String(WHOOP_PAGE_LIMIT) });
            if (start) params.append('start', start);
            if (localEnd) params.append('end', localEnd);
            if (nextToken) params.append('nextToken', nextToken);

            console.log(`[DEBUG] Page ${pageCount} for /cycle | Params: ${params.toString()}`);
            const response = await this.makeRequest<{ records: WhoopCycle[]; next_token?: string }>(
                `/cycle?${params.toString()}`
            );
            const records = response.records || [];
            console.log(`[DEBUG] Records received: ${records.length}`);

            if (records.length > 0) {
                allCycles.push(...records);
            }

            if (response.next_token) {
                console.log(`[DEBUG] next_token found: ${response.next_token}`);
                nextToken = response.next_token;
            } else if (records.length === WHOOP_PAGE_LIMIT) {
                // No next_token but full page: use time-based pagination fallback
                const earliest = records.reduce((min, r) => (r.start < min ? r.start : min), records[0].start);
                localEnd = new Date(new Date(earliest).getTime() - 1).toISOString();
                console.log(`[DEBUG] No next_token; fallback end set to ${localEnd}`);
                nextToken = undefined;
            } else {
                console.log(`[DEBUG] No next_token and fewer than page limit; ending pagination for /cycle.`);
                break;
            }
        } while (true);

        console.log(`[DEBUG] Finished pagination for /cycle. Total pages: ${pageCount}, Total records: ${allCycles.length}`);
        return allCycles;
    }
}
