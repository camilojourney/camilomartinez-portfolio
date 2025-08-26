import { sql } from '@vercel/postgres';

// Database connection utility using Vercel Postgres
export { sql };

// Helper function to ensure safe database operations
export async function executeQuery(query: string, params: any[] = []) {
    try {
        const result = await sql.query(query, params);
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Helper function to format dates for PostgreSQL
export function formatDateForDB(date: Date | string): string {
    return new Date(date).toISOString();
}

// Helper function to parse timezone offset
export function parseTimezoneOffset(offsetStr?: string): string {
    if (!offsetStr) return '+00:00';
    return offsetStr;
}
