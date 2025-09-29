-- Add uuid column to users table
ALTER TABLE users ADD COLUMN uuid UUID;

-- Create unique index on uuid
CREATE UNIQUE INDEX idx_users_uuid ON users (uuid);

-- Update existing users with UUIDs (if any exist)
-- This uses gen_random_uuid() which is available in PostgreSQL 13+
UPDATE users SET uuid = gen_random_uuid() WHERE uuid IS NULL;

-- Make uuid NOT NULL after populating existing records
ALTER TABLE users ALTER COLUMN uuid SET NOT NULL;