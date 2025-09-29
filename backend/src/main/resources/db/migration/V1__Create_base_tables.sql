-- Create sequences
CREATE SEQUENCE IF NOT EXISTS user_security_id_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS users_id_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS roles_id_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS authorities_id_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS refresh_tokens_id_seq START WITH 1 INCREMENT BY 1;

-- Create authorities table
CREATE TABLE authorities
(
    id         BIGINT PRIMARY KEY DEFAULT nextval('authorities_id_seq'),
    name       TEXT      NOT NULL UNIQUE,
    version    INTEGER   NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create roles table
CREATE TABLE roles
(
    id         BIGINT PRIMARY KEY DEFAULT nextval('roles_id_seq'),
    name       TEXT      NOT NULL UNIQUE,
    version    INTEGER   NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create user_security table
CREATE TABLE user_security
(
    id         BIGINT PRIMARY KEY DEFAULT nextval('user_security_id_seq'),
    email      TEXT      NOT NULL,
    password   TEXT      NOT NULL,
    locked     BOOLEAN   NOT NULL DEFAULT FALSE,
    enabled    BOOLEAN   NOT NULL DEFAULT TRUE,
    version    INTEGER   NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_security_email_key UNIQUE (email)
);

-- Create users table
CREATE TABLE users
(
    id              BIGINT PRIMARY KEY DEFAULT nextval('users_id_seq'),
    username        TEXT      NOT NULL,
    user_security_id BIGINT,
    version         INTEGER   NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_username_key UNIQUE (username),
    CONSTRAINT fk_users_user_security FOREIGN KEY (user_security_id) REFERENCES user_security (id) ON DELETE CASCADE
);

-- Create refresh_tokens table
CREATE TABLE refresh_tokens
(
    id          BIGINT PRIMARY KEY DEFAULT nextval('refresh_tokens_id_seq'),
    user_id     BIGINT    NOT NULL,
    token       TEXT      NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    revoked     BOOLEAN   NOT NULL DEFAULT FALSE,
    version     INTEGER   NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES user_security (id) ON DELETE CASCADE
);

-- Create role_authorities junction table
CREATE TABLE roles_authorities
(
    role_id      BIGINT NOT NULL,
    authority_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, authority_id),
    CONSTRAINT fk_roles_authorities_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_roles_authorities_authority FOREIGN KEY (authority_id) REFERENCES authorities (id) ON DELETE CASCADE
);

-- Create user_roles junction table
CREATE TABLE user_roles
(
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES user_security (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens USING HASH (token);
CREATE INDEX idx_refresh_tokens_expiry_date ON refresh_tokens (expiry_date);
CREATE INDEX idx_user_security_email ON user_security USING HASH (email);
