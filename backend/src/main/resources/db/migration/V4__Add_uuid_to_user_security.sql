ALTER TABLE user_security ADD COLUMN uuid UUID;

CREATE UNIQUE INDEX idx_user_security_uuid ON user_security (uuid);

UPDATE user_security SET uuid = gen_random_uuid() WHERE uuid IS NULL;

ALTER TABLE user_security ALTER COLUMN uuid SET NOT NULL;