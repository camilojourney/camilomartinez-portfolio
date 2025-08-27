declare module '@/types/whoop' {
    export interface WhoopProfile {
        user_id: string;
        first_name: string;
        last_name: string;
        email: string;
        profile_id: string;
        createdAt: string;
        updatedAt: string;
    }

    export interface WhoopCycle {
        id: string;
        start: string;
        end: string;
        score: {
            strain: number;
            kilojoules: number;
        };
    }

    export interface WhoopSleep {
        id: string;
        start: string;
        end: string;
        score: {
            quality: number;
            respiratory_rate: number;
            latency: number;
            disturbances: number;
            efficiency: number;
            time_in_bed: number;
            time_asleep: number;
        };
        state: string;
    }

    export interface WhoopRecovery {
        cycle_id: string;
        sleep_id: string;
        score: {
            recovery_score: number;
            resting_heart_rate: number;
            hrv_rmssd_milli: number;
            spo2_percentage: number;
            skin_temp_celsius: number;
        };
        timestamp: string;
    }

    export interface WhoopWorkout {
        id: string;
        sport_name: string;
        start_time: string;
        end_time: string;
        score: {
            strain: number;
            average_heart_rate: number;
            max_heart_rate: number;
            calories: number;
            distance_meter: number;
        };
        zones: {
            zone_zero_milli: number;
            zone_one_milli: number;
            zone_two_milli: number;
            zone_three_milli: number;
            zone_four_milli: number;
            zone_five_milli: number;
        };
    }
}
