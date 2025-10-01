/**
 * API Configuration for FastAPI Backend Integration
 * 
 * This file centralizes all API endpoint configurations to migrate from
 * Next.js API routes to the new FastAPI backend running on port 9000.
 * 
 * Migration Progress:
 * - ✅ Backend: FastAPI server running on http://localhost:9000
 * - 🔄 Frontend: Updating API calls to use new endpoints
 * - 📋 Next: Authentication flow integration
 */

// Environment-based API base URL configuration
const getApiBaseUrl = (): string => {
  // In production, use Next.js API routes as fallback when FastAPI backend is not deployed
  if (process.env.NODE_ENV === 'production') {
    // Only use FastAPI URL if explicitly configured, otherwise use Next.js API routes
    return process.env.NEXT_PUBLIC_FASTAPI_URL || '';
  }
  
  // Development: FastAPI server running locally on port 9000
  return process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:9000';
};

export const API_BASE_URL = getApiBaseUrl();

type RequestConfig = {
  headers?: Record<string, string>;
  fallback?: string;
};

/**
 * FastAPI Endpoint Mappings
 * Maps old Next.js API routes to new FastAPI endpoints
 */
export const API_ENDPOINTS = {
  // AI Services (migrated to FastAPI)
  AI: {
    // Chat endpoints
    CHAT_COMPLETION: '/api/ai/chat/completion',      // was: /api/chatbot or /api/ai-query
    CHAT_QUERY: '/api/ai/chat/query',                // was: /api/ai-query
    CHAT_HISTORY: '/api/ai/chat/history',            // was: /api/ai-query/history
    
    // Embedding endpoints  
    CREATE_EMBEDDING: '/api/ai/embeddings/create',    // new FastAPI endpoint
    EMBED_DOCUMENT: '/api/ai/embeddings/documents',   // new FastAPI endpoint
    SIMILARITY_SEARCH: '/api/ai/embeddings/search',   // new FastAPI endpoint
    EMBEDDING_STATS: '/api/ai/embeddings/stats',      // new FastAPI endpoint
    
    // AI Trainer endpoints
    TRAINER_EVALUATE: '/api/ai/trainer/evaluate',     // was: /api/ai-trainer/run-cycle
    TRAINER_HISTORY: '/api/ai/trainer/history',       // was: /api/ai-trainer/history
    
    // Health check
    AI_HEALTH: '/api/ai/health',                      // new FastAPI endpoint
    
    // Creative tooling
    SOCIAL_MEDIA_PIPELINE: '/api/ai/tools/social-media-pipeline',
  },

  // System endpoints (migrated to FastAPI)
  SYSTEM: {
    HEALTH: '/api/system/health',                     // was: /health
    DETAILED_HEALTH: '/api/system/health/detailed',   // new FastAPI endpoint
    STATUS: '/api/system/status',                     // new FastAPI endpoint
    RATE_LIMIT_DEBUG: '/api/system/debug/rate-limit', // new FastAPI endpoint
  },

  // Integration endpoints (to be implemented in Phases 6-7)
  INTEGRATIONS: {
    // Strava (Phase 6)
    STRAVA_SYNC_STATUS: '/api/integrations/strava/sync/status',
    STRAVA_SYNC_WEEKLY: '/api/integrations/strava/sync/weekly',
    STRAVA_SYNC_HISTORICAL: '/api/integrations/strava/sync/historical', 
    STRAVA_AUTH_CALLBACK: '/api/integrations/strava/auth/callback',
    
    // WHOOP (Phase 7)
    WHOOP_COLLECT: '/api/integrations/whoop/collect',
    WHOOP_AUTH_CALLBACK: '/api/integrations/whoop/auth/callback',
    WHOOP_SYNC_DAILY: '/api/integrations/whoop/sync/daily',
  },

  // Analytics endpoints (implemented in Phase 5)
  ANALYTICS: {
    // Dashboard data endpoints
    STRAIN_DATA: '/api/analytics/strain-data',         // Daily strain data
    MONTHLY_STRAIN: '/api/analytics/monthly-strain',   // Monthly strain averages
    STRAIN_RECOVERY: '/api/analytics/strain-recovery', // Strain vs recovery correlation
    WORKOUT_DATA: '/api/analytics/workout-data',       // Workout activities
    WORKOUT_TIMES: '/api/analytics/workout-times',     // Workout time patterns
    
    // Legacy endpoints (to be deprecated)
    VIEW_DATA: '/api/analytics/view-data',            // was: /api/view-data
    USER_STATS: '/api/analytics/user-stats',          // new FastAPI endpoint
    PERFORMANCE_TRENDS: '/api/analytics/trends',      // new FastAPI endpoint
  },

  // Legacy Next.js routes (to be migrated or deprecated)
  LEGACY: {
    // These will be gradually migrated to FastAPI
    WHOOP_COLLECTOR_V2: '/api/whoop-collector-v2',   // → /api/integrations/whoop/collect
    DAILY_DATA_FETCH: '/api/cron/daily-data-fetch',  // → /api/integrations/whoop/sync/daily
    SYNC_STATUS: '/api/sync-status',                  // → /api/integrations/sync/status
    UPDATE_TOKEN: '/api/update-token',                // → /api/integrations/auth/refresh
  }
} as const;

/**
 * API Request Helper Functions
 */
export class ApiClient {
  private static baseUrl = API_BASE_URL;

/**
 * Make a request to the FastAPI backend
 */
static async request<T>(
  endpoint: string,
  options: RequestInit & RequestConfig = {}
): Promise<T> {
  const { fallback, ...fetchOptions } = options;
  
  // If no base URL is configured (production without deployed backend), try fallback immediately
  if (!this.baseUrl && fallback) {
    console.log(`No backend URL configured, using fallback: ${fallback}`);
    return this.requestFallback<T>(fallback, fetchOptions);
  }
  
  // If no base URL and no fallback, throw a helpful error
  if (!this.baseUrl) {
    throw new Error(`Backend not available and no fallback provided for ${endpoint}`);
  }

  const url = `${this.baseUrl}${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = this.getAuthToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...fetchOptions,
    headers: {
      ...defaultHeaders,
      ...(fetchOptions.headers ?? {}),
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      if (fallback) {
        console.log(`Backend request failed (${response.status}), trying fallback: ${fallback}`);
        return await this.requestFallback<T>(fallback, config);
      }
      const text = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${text}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    return text ? (JSON.parse(text) as T) : (undefined as T);
  } catch (error) {
    if (fallback) {
      console.log(`Backend request error, trying fallback: ${fallback}`, error);
      return await this.requestFallback<T>(fallback, config);
    }
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}  /**
   * GET request helper
   */
  static async get<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...config });
  }

  /**
   * POST request helper
   */
  static async post<T>(
    endpoint: string, 
    data?: unknown, 
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  /**
   * PUT request helper
   */
  static async put<T>(
    endpoint: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  /**
   * DELETE request helper
   */
  static async delete<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...config });
  }

  private static async requestFallback<T>(fallback: string, options: RequestInit): Promise<T> {
    const url = this.resolveFallbackUrl(fallback);
    const response = await fetch(url, options);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Fallback request failed: ${response.status} ${response.statusText} - ${text}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    return text ? (JSON.parse(text) as T) : (undefined as T);
  }

  private static resolveFallbackUrl(fallback: string): string {
    if (fallback.startsWith('http')) {
      return fallback;
    }

    if (typeof window !== 'undefined') {
      return fallback;
    }

    const origin = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    if (origin.startsWith('http')) {
      return `${origin}${fallback}`;
    }
    return `https://${origin}${fallback}`;
  }

  /**
   * Get authentication token from storage or session
   * TODO: Implement proper token management
   */
  private static getAuthToken(): string | null {
    // For now, return null - will be implemented with authentication
    // In production, this would get the JWT token from:
    // - localStorage/sessionStorage
    // - NextAuth session
    // - HTTP-only cookies
    return null;
  }
}

/**
 * Specific API service functions for common operations
 */
export const aiService = {
  /**
   * Send a chat query to the AI service
   */
  async query(query: string, includeContext = true, contextDays = 30) {
    try {
      return await ApiClient.post(API_ENDPOINTS.AI.CHAT_QUERY, {
        query,
        include_context: includeContext,
        context_days: contextDays,
      });
    } catch (error) {
      // Fallback to Next.js chat API with format conversion
      console.log('FastAPI unavailable, using Next.js chat API fallback');
      const chatResponse = await ApiClient.post('/api/chat', {
        messages: [{ role: 'user', content: query }]
      }) as any;
      
      // Convert Next.js chat response to FastAPI format
      return {
        success: true,
        data: {
          response: chatResponse.content || 'No response received',
          answer: chatResponse.content || 'No response received',
          history_id: `fallback-${Date.now()}`,
          processing_time_ms: 0,
          result_count: 1,
        },
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * Get chat history
   */
  async getHistory(limit = 20, days = 30) {
    return ApiClient.get(`${API_ENDPOINTS.AI.CHAT_HISTORY}?limit=${limit}&days=${days}`, {
      fallback: `/api/ai-query/history?limit=${limit}&days=${days}`
    });
  },

  /**
   * Trigger AI trainer evaluation
   */
  async evaluateAthlete(analysisPeriod = 90, userGoals?: string) {
    return ApiClient.post(API_ENDPOINTS.AI.TRAINER_EVALUATE, {
      analysis_period: analysisPeriod,
      user_goals: userGoals,
      save_evaluation: true,
    }, {
      fallback: '/api/ai-trainer/run-cycle'
    });
  },

  /**
   * Get trainer evaluation history
   */
  async getTrainerHistory(limit = 10) {
    return ApiClient.get(`${API_ENDPOINTS.AI.TRAINER_HISTORY}?limit=${limit}`, {
      fallback: `/api/ai-trainer/history?limit=${limit}`
    });
  },

  /**
   * Health check for AI services
   */
  async healthCheck() {
    return ApiClient.get(API_ENDPOINTS.AI.AI_HEALTH, {
      fallback: '/api/health'
    });
  },

  /**
   * Generate multi-format social media content
   */
  async generateSocialMediaContent(text: string, language: 'en' | 'es' | 'both' = 'en') {
    return ApiClient.post(API_ENDPOINTS.AI.SOCIAL_MEDIA_PIPELINE, {
      text,
      language,
    }, {
      fallback: '/api/social-media-pipeline'
    });
  },
};

/**
 * System service functions
 */
interface SystemHealthResponse {
  status: string;
  source?: string;
  [key: string]: unknown;
}

export const systemService = {
  /**
   * Basic health check
   */
  async healthCheck(): Promise<SystemHealthResponse> {
    // If no backend URL is configured, use Next.js API route fallback
    if (!API_BASE_URL) {
      return ApiClient.get<SystemHealthResponse>('/health').catch(() => {
        // If fallback also fails, return a default response
        return { status: 'ok', source: 'frontend-only' };
      });
    }
    
    return ApiClient.get<SystemHealthResponse>(API_ENDPOINTS.SYSTEM.HEALTH, {
      fallback: '/health',
    }).catch(() => {
      // If both FastAPI and fallback fail, return frontend-only status
      return { status: 'ok', source: 'frontend-only' };
    });
  },

  /**
   * Detailed health check with database status
   */
  async detailedHealthCheck() {
    return ApiClient.get(API_ENDPOINTS.SYSTEM.DETAILED_HEALTH, {
      fallback: '/api/health',
    });
  },

  /**
   * Get system status
   */
  async getStatus() {
    return ApiClient.get(API_ENDPOINTS.SYSTEM.STATUS, {
      fallback: '/api/sync-status',
    });
  },
};

/**
 * Integration service functions (Strava, WHOOP, Cron)
 */
export const integrationService = {
  async getStravaSyncStatus() {
    return ApiClient.get(API_ENDPOINTS.INTEGRATIONS.STRAVA_SYNC_STATUS, {
      fallback: '/api/strava/sync-status',
    });
  },

  async runStravaWeeklySync(payload?: Record<string, unknown>) {
    return ApiClient.post(API_ENDPOINTS.INTEGRATIONS.STRAVA_SYNC_WEEKLY, payload, {
      fallback: '/api/strava/sync/weekly',
    });
  },

  async runStravaHistoricalSync(payload?: Record<string, unknown>) {
    return ApiClient.post(API_ENDPOINTS.INTEGRATIONS.STRAVA_SYNC_HISTORICAL, payload, {
      fallback: '/api/strava/sync/historical',
    });
  },

  async triggerWhoopCollector(payload?: Record<string, unknown>) {
    return ApiClient.post(API_ENDPOINTS.INTEGRATIONS.WHOOP_COLLECT, payload, {
      fallback: '/api/whoop-collector-v2',
    });
  },

  async triggerWhoopDailySync(payload?: Record<string, unknown>) {
    return ApiClient.post(API_ENDPOINTS.INTEGRATIONS.WHOOP_SYNC_DAILY, payload, {
      fallback: '/api/actions/daily-fetch',
    });
  },

  async whoopAuthCallback(payload?: Record<string, unknown>) {
    return ApiClient.post(API_ENDPOINTS.INTEGRATIONS.WHOOP_AUTH_CALLBACK, payload, {
      fallback: '/api/auth/whoop/refresh',
    });
  },

  async getSyncStatus() {
    return ApiClient.get(API_ENDPOINTS.LEGACY.SYNC_STATUS, {
      fallback: '/api/sync-status',
    });
  },
};

/**
 * Analytics service helpers
 */
export const analyticsService = {
  // Dashboard data functions for /my-data page
  async getStrainData() {
    return ApiClient.get(API_ENDPOINTS.ANALYTICS.STRAIN_DATA, {
      fallback: '/api/analytics/strain-data'
    });
  },

  async getMonthlyStrainData() {
    return ApiClient.get(API_ENDPOINTS.ANALYTICS.MONTHLY_STRAIN, {
      fallback: '/api/analytics/monthly-strain'
    });
  },

  async getStrainRecoveryData() {
    return ApiClient.get(API_ENDPOINTS.ANALYTICS.STRAIN_RECOVERY, {
      fallback: '/api/analytics/strain-recovery'
    });
  },

  async getWorkoutData() {
    return ApiClient.get(API_ENDPOINTS.ANALYTICS.WORKOUT_DATA, {
      fallback: '/api/analytics/workout-data'
    });
  },

  async getWorkoutTimes() {
    return ApiClient.get(API_ENDPOINTS.ANALYTICS.WORKOUT_TIMES, {
      fallback: '/api/analytics/workout-times'
    });
  },

  // Legacy endpoints (to be deprecated)
  async getWhoopViewData() {
    return ApiClient.get(API_ENDPOINTS.ANALYTICS.VIEW_DATA, {
      fallback: '/api/view-data'
    });
  },

  async getUserStats() {
    return ApiClient.get(API_ENDPOINTS.ANALYTICS.USER_STATS, {
      fallback: '/api/sync-status',
    });
  },
};

// Export for backward compatibility and gradual migration
export default {
  API_BASE_URL,
  API_ENDPOINTS,
  ApiClient,
  aiService,
  systemService,
  integrationService,
  analyticsService,
};
