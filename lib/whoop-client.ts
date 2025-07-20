import {
    WhoopUser,
    WhoopCycle,
    WhoopSleep,
    WhoopRecovery,
    WhoopWorkout,
    WhoopCyclesResponse,
    WhoopWorkoutsResponse,
    WhoopSleepResponse,
    WhoopRecoveryResponse
} from '../types/whoop';

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

        // Reset daily counter if 24 hours have passed
        if (now > this.dailyResetTime) {
            this.dailyRequestCount = 0;
            this.dailyResetTime = now + (24 * 60 * 60 * 1000);
            console.log('🔄 Daily rate limit counter reset');
        }

        // Check daily limit (stay under 10,000)
        if (this.dailyRequestCount >= 9500) {
            console.warn('⚠️ Approaching daily rate limit (9500/10000), slowing down requests');
            this.minRequestInterval = 1500; // Slow down to 40 requests/minute
        }

        // Wait for minimum interval between requests
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
            const waitTime = this.minRequestInterval - timeSinceLastRequest;
            await this.delay(waitTime);
        }

        this.lastRequestTime = Date.now();
        this.requestCount++;
        this.dailyRequestCount++;

        // Log progress every 50 requests
        if (this.requestCount % 50 === 0) {
            console.log(`📊 API Progress: ${this.requestCount} requests made, ${this.dailyRequestCount} today`);
        }
    }

    private async makeRequest<T>(endpoint: string, retryCount = 0): Promise<T> {
        const maxRetries = 3;

        // Implement rate limiting
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

            console.log(`🔍 DEBUG: Response status: ${response.status} ${response.statusText}`);

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

                // If we got HTML instead of JSON, this might be a WHOOP API issue
                if (errorText.includes('<!DOCTYPE') || errorText.includes('<html>')) {
                    console.error('🚨 CRITICAL: WHOOP API returned HTML instead of JSON - likely endpoint or parameter issue');
                    console.error('🚨 Full URL that failed:', fullUrl);
                }

                throw new Error(`WHOOP API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log(`✅ API success: ${endpoint}, response type: ${typeof data}, keys: ${Object.keys(data || {}).join(', ')}`);

            return data;
        } catch (error) {
            // Check if this is a JSON parsing error
            if (error instanceof Error && error.message.includes('Unexpected token')) {
                console.error('🚨 JSON PARSING ERROR: WHOOP API returned non-JSON response');
                console.error('🚨 This usually means:');
                console.error('   1. Invalid date format in request');
                console.error('   2. API endpoint doesn\'t exist');
                console.error('   3. Authentication issue');
                console.error('🚨 Failed URL:', fullUrl);
                throw new Error(`WHOOP API returned HTML instead of JSON. Check endpoint and parameters.`);
            }

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

    // Get cycles with pagination (v2 API)
    async getCycles(start?: string, end?: string, nextToken?: string): Promise<WhoopCyclesResponse> {
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        if (nextToken) params.append('nextToken', nextToken);
        params.append('limit', '50'); // v2 API supports up to 50 records per page

        const endpoint = `/cycle${params.toString() ? `?${params.toString()}` : ''}`;
        console.log('🔍 DEBUG: Getting cycles with params:', Object.fromEntries(params.entries()));
        return this.makeRequest<WhoopCyclesResponse>(endpoint);
    }

    // Get all cycles (handles pagination automatically)
    async getAllCycles(start?: string, end?: string): Promise<WhoopCycle[]> {
        console.log('� Getting all cycles');
        console.log('📅 Date range:', {
            start: start ? new Date(start).toISOString() : 'beginning',
            end: end ? new Date(end).toISOString() : 'now'
        });

        const allCycles: WhoopCycle[] = [];
        let nextToken: string | undefined;
        let pageCount = 0;

        do {
            pageCount++;
            console.log(`🔍 DEBUG: Fetching cycles page ${pageCount}, nextToken: ${nextToken || 'none'}`);

            const response = await this.getCycles(start, end, nextToken);

            console.log(`🔍 DEBUG: Page ${pageCount} response:`, {
                recordsCount: response.records?.length || 0,
                hasNextToken: !!response.next_token,
                nextToken: response.next_token,
                responseStructure: Object.keys(response || {})
            });

            // Add null safety for records
            const records = response.records || [];
            allCycles.push(...records);
            nextToken = response.next_token;

            // Safety check to prevent infinite loops
            if (pageCount > 50) {
                console.warn('🚨 WARNING: Breaking pagination loop after 50 pages to prevent infinite requests');
                break;
            }
        } while (nextToken);

        console.log(`🔍 DEBUG: getAllCycles completed. Total cycles: ${allCycles.length}, pages: ${pageCount}`);
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

    // Get recovery data for a specific cycle (v2 API - recovery data is linked to cycles)
    async getRecovery(cycleId: number): Promise<WhoopRecovery> {
        // Note: In v2, recovery is typically fetched via the collection endpoint with filtering
        // Individual recovery by cycle ID might not be directly available
        throw new Error('Individual recovery by cycle ID not supported in v2 - use getAllRecovery with date filters');
    }

    // Get recovery collection with pagination
    async getRecoveryCollection(start?: string, end?: string, nextToken?: string, limit: number = 50): Promise<WhoopRecoveryResponse> {
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        if (nextToken) params.append('nextToken', nextToken);
        params.append('limit', limit.toString());

        const endpoint = `/recovery${params.toString() ? `?${params.toString()}` : ''}`;

        console.log('🔍 DEBUG: getRecoveryCollection called with:', { start, end, nextToken, limit });
        console.log('🔍 DEBUG: Full endpoint:', `${this.baseUrl}${endpoint}`);

        return this.makeRequest<WhoopRecoveryResponse>(endpoint);
    }

    // Get all recovery records (handles pagination automatically)
    async getAllRecovery(start?: string, end?: string): Promise<WhoopRecovery[]> {
        console.log('🔍 DEBUG: getAllRecovery called with start:', start, 'end:', end);

        const allRecovery: WhoopRecovery[] = [];
        let nextToken: string | undefined;
        let pageCount = 0;

        do {
            pageCount++;
            console.log(`🔍 DEBUG: Fetching recovery page ${pageCount}, nextToken: ${nextToken || 'none'}`);

            const response = await this.getRecoveryCollection(start, end, nextToken);

            console.log(`🔍 DEBUG: Recovery page ${pageCount} response:`, {
                recordsCount: response.records?.length || 0,
                hasNextToken: !!response.next_token,
                nextToken: response.next_token
            });

            const records = response.records || [];
            allRecovery.push(...records);
            nextToken = response.next_token;

            if (pageCount > 50) {
                console.warn('🚨 WARNING: Breaking recovery pagination loop after 50 pages');
                break;
            }
        } while (nextToken);

        console.log(`🔍 DEBUG: getAllRecovery completed. Total recovery records: ${allRecovery.length}, pages: ${pageCount}`);
        return allRecovery;
    }

    // Get workouts with pagination
    async getWorkouts(start?: string, end?: string, nextToken?: string, limit: number = 50): Promise<WhoopWorkoutsResponse> {
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        if (nextToken) params.append('nextToken', nextToken);
        params.append('limit', limit.toString());

        const endpoint = `/activity/workout${params.toString() ? `?${params.toString()}` : ''}`;

        console.log('🔍 DEBUG: getWorkouts called with:', { start, end, nextToken, limit });

        return this.makeRequest<WhoopWorkoutsResponse>(endpoint);
    }

    // Get all workouts (handles pagination automatically)
    async getAllWorkouts(start?: string, end?: string): Promise<WhoopWorkout[]> {
        console.log('🔍 DEBUG: getAllWorkouts called with start:', start, 'end:', end);

        const allWorkouts: WhoopWorkout[] = [];
        let nextToken: string | undefined;
        let pageCount = 0;

        do {
            pageCount++;
            console.log(`🔍 DEBUG: Fetching workouts page ${pageCount}`);

            const response = await this.getWorkouts(start, end, nextToken);

            console.log(`🔍 DEBUG: Workouts page ${pageCount} response:`, {
                recordsCount: response.records?.length || 0,
                hasNextToken: !!response.next_token
            });

            const records = response.records || [];
            allWorkouts.push(...records);
            nextToken = response.next_token;

            if (pageCount > 50) {
                console.warn('🚨 WARNING: Breaking workouts pagination loop after 50 pages');
                break;
            }
        } while (nextToken);

        console.log(`🔍 DEBUG: getAllWorkouts completed. Total workouts: ${allWorkouts.length}, pages: ${pageCount}`);
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
