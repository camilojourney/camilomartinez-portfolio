// 📂 src/types/strava-auth.ts
/**
 * Type definitions for Strava OAuth authentication
 * Based on Strava API v3 documentation
 */

export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes?: string;
}

export interface StravaProfile {
  id: number;
  email?: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  city?: string;
  state?: string;
  country?: string;
  sex?: 'M' | 'F';
  profilePictureUrl?: string;
}

export interface StravaOAuthResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  scope?: string;
  athlete: {
    id: number;
    username?: string;
    resource_state: number;
    firstname?: string;
    lastname?: string;
    bio?: string;
    city?: string;
    state?: string;
    country?: string;
    sex?: 'M' | 'F';
    premium?: boolean;
    summit?: boolean;
    created_at?: string;
    updated_at?: string;
    badge_type_id?: number;
    weight?: number;
    profile_medium?: string;
    profile?: string;
    friend?: null;
    follower?: null;
  };
}

export interface StravaRefreshResponse {
  token_type: 'Bearer';
  access_token: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
}

export interface StravaAuthError {
  message: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
  }>;
}

export interface StoredStravaUser {
  id: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  city?: string;
  state?: string;
  country?: string;
  sex?: string;
  profile_picture_url?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: Date;
  scopes?: string;
  created_at?: Date;
  updated_at?: Date;
}
