-- Remove unused PostGIS system tables
DROP TABLE IF EXISTS geography_columns;
DROP TABLE IF EXISTS geometry_columns;

-- Note: These are system tables created by PostGIS extension
-- Only drop them if you're certain you won't need any PostGIS functionality
-- If you need PostGIS features in the future, these tables will be recreated when enabling the extension