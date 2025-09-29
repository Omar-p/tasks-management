ALTER TABLE users ADD COLUMN uuid UUID;

CREATE UNIQUE INDEX idx_users_uuid ON users (uuid);

UPDATE users SET uuid = gen_random_uuid() WHERE uuid IS NULL;

ALTER TABLE users ALTER COLUMN uuid SET NOT NULL;