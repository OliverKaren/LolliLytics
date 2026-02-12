-- Initial database setup
-- This runs automatically when the Docker container is first created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for full-text search (champion name search)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Database initialized for lol-analytics';
END $$;
