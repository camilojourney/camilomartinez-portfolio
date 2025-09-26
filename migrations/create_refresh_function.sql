-- Function to refresh all materialized views concurrently
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Refresh views
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_fitness_snapshot;
    REFRESH MATERIALIZED VIEW CONCURRENTLY run_performance_details;
    REFRESH MATERIALIZED VIEW CONCURRENTLY boxing_performance_details;
    REFRESH MATERIALIZED VIEW CONCURRENTLY weightlifting_performance_details;

    -- Log success
    INSERT INTO refresh_history (last_refresh_time, status, details)
    VALUES (NOW(), 'success', 'All views refreshed');
EXCEPTION WHEN OTHERS THEN
    -- Log error
    INSERT INTO refresh_history (last_refresh_time, status, details)
    VALUES (NOW(), 'error', 'Error: ' || SQLERRM);
    RAISE;
END;
$$;
