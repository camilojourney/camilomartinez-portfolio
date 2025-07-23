// WHOOP V2 API Response Types

export interface WhoopUser {
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
}

export interface WhoopCycle {
    id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
    start: string;
    end: string;
    timezone_offset: string;
    score_state: string;
    score: {
        strain: number;
        kilojoule: number;
        average_heart_rate: number;
        max_heart_rate: number;
    };
}

export interface WhoopSleep {
    id: string; // Changed from number to UUID string in v2
    v1_id?: number; // Optional backwards compatibility with v1 ID (matches API response)
    user_id: number;
    created_at: string;
    updated_at: string;
    start: string;
    end: string;
    timezone_offset: string;
    nap: boolean;
    score_state: string;
    score?: {
        stage_summary?: {
            total_in_bed_time_milli?: number;
            total_awake_time_milli?: number;
            total_no_data_time_milli?: number;
            total_light_sleep_time_milli?: number;
            total_slow_wave_sleep_time_milli?: number;
            total_rem_sleep_time_milli?: number;
            sleep_cycle_count?: number;
            disturbance_count?: number;
        };
        sleep_needed?: {
            baseline_milli?: number;
            need_from_sleep_debt_milli?: number;
            need_from_recent_strain_milli?: number;
            need_from_recent_nap_milli?: number;
        };
        respiratory_rate?: number;
        sleep_performance_percentage?: number;
        sleep_consistency_percentage?: number;
        sleep_efficiency_percentage?: number;
    };
}

export interface WhoopRecovery {
    cycle_id: number;
    sleep_id: string; // Changed to string to match WhoopSleep.id (UUID)
    user_id: number;
    created_at: string;
    updated_at: string;
    score_state: string;
    score?: {
        user_calibrating: boolean;
        recovery_score: number;
        resting_heart_rate: number;
        hrv_rmssd_milli: number;
        spo2_percentage?: number;
        skin_temp_celsius?: number;
    };
}

export interface WhoopRecoveryResponse {
    records: WhoopRecovery[];
    next_token?: string;
}

export interface WhoopWorkout {
    id: string; // Changed from number to UUID string in v2
    v1_id?: number; // Optional backwards compatibility with v1 ID (matches API response)
    user_id: number;
    created_at: string;
    updated_at: string;
    start: string;
    end: string;
    timezone_offset: string;
    sport_id: number;
    sport_name?: string; // Add sport_name field from API
    score_state: string;
    score?: {
        strain: number;
        average_heart_rate: number;
        max_heart_rate: number;
        kilojoule: number;
        percent_recorded: number;
        distance_meter: number;
        altitude_gain_meter: number;
        altitude_change_meter: number;
        zone_duration: {
            zone_zero_milli: number;
            zone_one_milli: number;
            zone_two_milli: number;
            zone_three_milli: number;
            zone_four_milli: number;
            zone_five_milli: number;
        };
    };
}

// API Response wrappers
export interface WhoopCyclesResponse {
    records: WhoopCycle[];
    next_token?: string;
}

export interface WhoopWorkoutsResponse {
    records: WhoopWorkout[];
    next_token?: string;
}

export interface WhoopSleepResponse {
    records: WhoopSleep[];
    next_token?: string;
}

// Database insert types
export interface DbUser {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
}

export interface DbCycle {
    id: number;
    user_id: number;
    start_time: string;
    end_time: string;
    timezone_offset: string;
    score_state: string;
    strain: number;
    kilojoule: number;
    average_heart_rate: number;
    max_heart_rate: number;
}

export interface DbSleep {
    id: string; // Changed to string to store UUID from v2 API
    activity_v1_id?: number; // Store v1 ID for backwards compatibility
    user_id: number;
    cycle_id: number;
    start_time: string;
    end_time: string;
    timezone_offset: string;
    nap: boolean;
    score_state: string;
    sleep_performance_percentage: number;
    respiratory_rate: number;
    sleep_consistency_percentage: number;
    sleep_efficiency_percentage: number;
    total_in_bed_time_milli: number;
    total_awake_time_milli: number;
    total_light_sleep_time_milli: number;
    total_slow_wave_sleep_time_milli: number;
    total_rem_sleep_time_milli: number;
    disturbance_count: number;
}

export interface DbRecovery {
    cycle_id: number;
    sleep_id: string; // Changed to string to match sleep UUID
    user_id: number;
    score_state: string;
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage: number;
    skin_temp_celsius: number;
}

export interface DbWorkout {
    id: string; // Changed to string to store UUID from v2 API
    activity_v1_id?: number; // Store v1 ID for backwards compatibility
    user_id: number;
    start_time: string;
    end_time: string;
    timezone_offset: string;
    sport_id: number;
    score_state: string;
    strain?: number;
    average_heart_rate?: number;
    max_heart_rate?: number;
    kilojoule?: number;
    distance_meter?: number;
    altitude_gain_meter?: number;
    altitude_change_meter?: number;
    zone_zero_milli?: number;
    zone_one_milli?: number;
    zone_two_milli?: number;
    zone_three_milli?: number;
    zone_four_milli?: number;
    zone_five_milli?: number;
}
