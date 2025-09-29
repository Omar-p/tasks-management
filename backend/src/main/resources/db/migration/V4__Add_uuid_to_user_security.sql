-- Add uuid column to user_security table
ALTER TABLE user_security ADD COLUMN uuid UUID;

-- Create unique index on uuid
CREATE UNIQUE INDEX idx_user_security_uuid ON user_security (uuid);

-- Update existing user_security records with UUIDs (if any exist)
-- This uses gen_random_uuid() which is available in PostgreSQL 13+
UPDATE user_security SET uuid = gen_random_uuid() WHERE uuid IS NULL;

-- Make uuid NOT NULL after populating existing records
ALTER TABLE user_security ALTER COLUMN uuid SET NOT NULL;