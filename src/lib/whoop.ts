import type { WhoopProfile, WhoopCycle, WhoopSleep, WhoopRecovery, WhoopWorkout } from '@/types/whoop';

export class WhoopV2Client {
    private readonly baseUrl = 'https://api.prod.whoop.com/developer/v2';
    private readonly accessToken: string;
    private lastRequestTime = 0;
    private readonly rateLimitDelay = 1000; // 1 second between requests

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async waitForRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            const waitTime = this.rateLimitDelay - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastRequestTime = Date.now();
    }

    private async fetch<T>(endpoint: string, options: RequestInit = {}, retries = 3): Promise<T> {
        await this.waitForRateLimit();
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
            // Increase timeout for large collections and add connection settings
            signal: AbortSignal.timeout(60000), // 60 seconds for large collections
        });

        if (response.status === 429 && retries > 0) {
            // Rate limited - wait and retry with exponential backoff
            const retryAfter = response.headers.get('retry-after');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, 4 - retries) * 1000;
            console.log(`⏳ Rate limited. Waiting ${waitTime}ms before retry (${retries} retries left)...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return this.fetch<T>(endpoint, options, retries - 1);
        }

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`WHOOP API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return response.json();
    }

    async getUserProfile(): Promise<WhoopProfile> {
        return this.fetch<WhoopProfile>('/user/profile/basic');
    }

    async getAllCycles(startDate?: string): Promise<WhoopCycle[]> {
        const cycles: WhoopCycle[] = [];
        const seenIds = new Set<string>();
        let nextToken: string | undefined;
        let pageCount = 0;
        const maxPages = 100; // Safety limit
        
        // Set end date to now for proper date range
        const endDate = new Date().toISOString();
        
        while (pageCount < maxPages) {
            pageCount++;
            console.log(`📄 Fetching cycles page ${pageCount}...`);
            
            const params = new URLSearchParams({
                limit: '25',
                ...(startDate && { start: startDate }),
                ...(endDate && { end: endDate }),
                ...(nextToken && { nextToken }),
            });

            console.log(`🔍 API URL: /cycle?${params}`);
            const response = await this.fetch<{ records: WhoopCycle[]; next_token?: string }>(`/cycle?${params}`);
            
            if (!response.records || response.records.length === 0) {
                console.log(`📄 Page ${pageCount}: No more records found`);
                break;
            }

            // Filter out incomplete records (no end_time) to avoid today's ongoing activities
            const completeRecords = response.records.filter(c => c.end !== null && c.end !== undefined);
            const filteredCount = response.records.length - completeRecords.length;
            
            if (filteredCount > 0) {
                console.log(`🔍 Filtered out ${filteredCount} incomplete records (no end_time)`);
            }

            // Check for duplicate records from the complete records
            const newRecords = completeRecords.filter(c => {
                const id = c.id.toString();
                if (seenIds.has(id)) {
                    return false;
                }
                seenIds.add(id);
                return true;
            });

            if (newRecords.length > 0) {
                cycles.push(...newRecords);
                
                // Show date range of NEW records only
                const dates = newRecords
                    .map(c => new Date(c.start))
                    .sort((a, b) => a.getTime() - b.getTime());
                const minDate = dates[0]?.toISOString().split('T')[0];
                const maxDate = dates[dates.length - 1]?.toISOString().split('T')[0];
                
                console.log(`📦 Page ${pageCount}: Retrieved ${newRecords.length} NEW cycles (${minDate} to ${maxDate})`);
                console.log(`   Skipped ${response.records.length - newRecords.length} duplicates`);
                console.log(`   Running total: ${cycles.length} unique cycles`);
            } else {
                console.log(`⚠️ Page ${pageCount}: All ${response.records.length} records are duplicates`);
            }

            // Check for next_token to continue pagination
            if (!response.next_token) {
                console.log(`✅ Cycles fetch complete: ${cycles.length} total unique cycles`);
                break;
            }
            
            nextToken = response.next_token;
        }

        if (pageCount >= maxPages) {
            console.log(`⚠️ Hit maximum page limit (${maxPages}) - there may be more data`);
        }

        return cycles;
    }

    async getAllSleep(startDate?: string): Promise<WhoopSleep[]> {
        const sleeps: WhoopSleep[] = [];
        const seenIds = new Set<string>();
        let nextToken: string | undefined;
        let pageCount = 0;
        const maxPages = 100; // Safety limit
        
        // Set end date to now for proper date range
        const endDate = new Date().toISOString();

        while (pageCount < maxPages) {
            pageCount++;
            console.log(`📄 Fetching sleep page ${pageCount}...`);
            
            const params = new URLSearchParams({
                limit: '25',
                ...(startDate && { start: startDate }),
                ...(endDate && { end: endDate }),
                ...(nextToken && { nextToken }),
            });

            const response = await this.fetch<{ records: WhoopSleep[]; next_token?: string }>(`/activity/sleep?${params}`);
            
            if (!response.records || response.records.length === 0) {
                console.log(`📄 Page ${pageCount}: No more records found`);
                break;
            }

            // Filter out incomplete records (no end_time) to avoid today's ongoing sleep
            const completeRecords = response.records.filter(s => s.end !== null && s.end !== undefined);
            const filteredCount = response.records.length - completeRecords.length;
            
            if (filteredCount > 0) {
                console.log(`🔍 Filtered out ${filteredCount} incomplete sleep records (no end_time)`);
            }

            // Check for duplicate records from the complete records
            const newRecords = completeRecords.filter(s => {
                const id = s.id.toString();
                if (seenIds.has(id)) {
                    return false;
                }
                seenIds.add(id);
                return true;
            });

            if (newRecords.length > 0) {
                sleeps.push(...newRecords);
                
                // Show date range of NEW records only
                const dates = newRecords
                    .map(s => new Date(s.start))
                    .sort((a, b) => a.getTime() - b.getTime());
                const minDate = dates[0]?.toISOString().split('T')[0];
                const maxDate = dates[dates.length - 1]?.toISOString().split('T')[0];
                
                console.log(`📦 Page ${pageCount}: Retrieved ${newRecords.length} NEW sleep records (${minDate} to ${maxDate})`);
                console.log(`   Skipped ${response.records.length - newRecords.length} duplicates`);
                console.log(`   Running total: ${sleeps.length} unique sleep records`);
            } else {
                console.log(`⚠️ Page ${pageCount}: All ${response.records.length} records are duplicates`);
            }

            // Check for next_token to continue pagination
            if (!response.next_token) {
                console.log(`✅ Sleep fetch complete: ${sleeps.length} total unique sleep records`);
                break;
            }
            
            nextToken = response.next_token;
        }

        if (pageCount >= maxPages) {
            console.log(`⚠️ Hit maximum page limit (${maxPages}) - there may be more data`);
        }

        return sleeps;
    }

    async getAllRecovery(startDate?: string): Promise<WhoopRecovery[]> {
        const recoveries: WhoopRecovery[] = [];
        const seenIds = new Set<string>();
        let nextToken: string | undefined;
        let pageCount = 0;
        const maxPages = 100; // Safety limit
        
        // Set end date to now for proper date range
        const endDate = new Date().toISOString();

        while (pageCount < maxPages) {
            pageCount++;
            console.log(`📄 Fetching recovery page ${pageCount}...`);
            
            const params = new URLSearchParams({
                limit: '25',
                ...(startDate && { start: startDate }),
                ...(endDate && { end: endDate }),
                ...(nextToken && { nextToken }),
            });

            const response = await this.fetch<{ records: WhoopRecovery[]; next_token?: string }>(`/recovery?${params}`);
            
            if (!response.records || response.records.length === 0) {
                console.log(`📄 Page ${pageCount}: No more records found`);
                break;
            }

            // Filter out today's recovery records to avoid incomplete data
            const today = new Date().toISOString().split('T')[0];
            const completeRecords = response.records.filter(r => {
                if (!r.created_at) return true; // Keep records without created_at
                const recordDate = new Date(r.created_at).toISOString().split('T')[0];
                return recordDate !== today;
            });
            const filteredCount = response.records.length - completeRecords.length;
            
            if (filteredCount > 0) {
                console.log(`🔍 Filtered out ${filteredCount} today's recovery records (incomplete)`);
            }

            // Check for duplicate records from the complete records
            const newRecords = completeRecords.filter(r => {
                const id = r.cycle_id.toString();
                if (seenIds.has(id)) {
                    return false;
                }
                seenIds.add(id);
                return true;
            });

            if (newRecords.length > 0) {
                recoveries.push(...newRecords);
                
                // Show date range of NEW records only
                const dates = newRecords
                    .map(r => r.created_at ? new Date(r.created_at) : new Date())
                    .sort((a, b) => a.getTime() - b.getTime());
                const minDate = dates[0]?.toISOString().split('T')[0];
                const maxDate = dates[dates.length - 1]?.toISOString().split('T')[0];
                
                console.log(`📦 Page ${pageCount}: Retrieved ${newRecords.length} NEW recovery records (${minDate} to ${maxDate})`);
                console.log(`   Skipped ${response.records.length - newRecords.length} duplicates`);
                console.log(`   Running total: ${recoveries.length} unique records`);
            } else {
                console.log(`⚠️ Page ${pageCount}: All ${response.records.length} records are duplicates`);
            }

            // Check for next_token to continue pagination
            if (!response.next_token) {
                console.log(`✅ Recovery fetch complete: ${recoveries.length} total unique recovery records`);
                break;
            }
            
            nextToken = response.next_token;
        }

        if (pageCount >= maxPages) {
            console.log(`⚠️ Hit maximum page limit (${maxPages}) - there may be more data`);
        }

        return recoveries;
    }

    async getAllWorkouts(startDate?: string): Promise<WhoopWorkout[]> {
        const workouts: WhoopWorkout[] = [];
        const seenIds = new Set<string>();
        let nextToken: string | undefined;
        let pageCount = 0;
        const maxPages = 100; // Safety limit
        
        // Set end date to now for proper date range
        const endDate = new Date().toISOString();

        while (pageCount < maxPages) {
            pageCount++;
            console.log(`📄 Fetching workouts page ${pageCount}...`);
            
            const params = new URLSearchParams({
                limit: '25',
                ...(startDate && { start: startDate }),
                ...(endDate && { end: endDate }),
                ...(nextToken && { nextToken }),
            });

            const response = await this.fetch<{ records: WhoopWorkout[]; next_token?: string }>(`/activity/workout?${params}`);
            
            if (!response.records || response.records.length === 0) {
                console.log(`📄 Page ${pageCount}: No more records found`);
                break;
            }

            // Filter out incomplete records (no end_time) to avoid today's ongoing workouts
            const completeRecords = response.records.filter(w => w.end !== null && w.end !== undefined);
            const filteredCount = response.records.length - completeRecords.length;
            
            if (filteredCount > 0) {
                console.log(`🔍 Filtered out ${filteredCount} incomplete workout records (no end_time)`);
            }

            // Check for duplicate records from the complete records
            const newRecords = completeRecords.filter(w => {
                const id = w.id.toString();
                if (seenIds.has(id)) {
                    return false;
                }
                seenIds.add(id);
                return true;
            });

            if (newRecords.length > 0) {
                workouts.push(...newRecords);
                
                // Show date range of NEW records only
                const dates = newRecords
                    .map(w => new Date(w.start))
                    .sort((a, b) => a.getTime() - b.getTime());
                const minDate = dates[0]?.toISOString().split('T')[0];
                const maxDate = dates[dates.length - 1]?.toISOString().split('T')[0];
                
                console.log(`📦 Page ${pageCount}: Retrieved ${newRecords.length} NEW workouts (${minDate} to ${maxDate})`);
                console.log(`   Skipped ${response.records.length - newRecords.length} duplicates`);
                console.log(`   Running total: ${workouts.length} unique workouts`);
            } else {
                console.log(`⚠️ Page ${pageCount}: All ${response.records.length} records are duplicates`);
            }

            // Check for next_token to continue pagination
            if (!response.next_token) {
                console.log(`✅ Workouts fetch complete: ${workouts.length} total unique workouts`);
                break;
            }
            
            nextToken = response.next_token;
        }

        if (pageCount >= maxPages) {
            console.log(`⚠️ Hit maximum page limit (${maxPages}) - there may be more data`);
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
