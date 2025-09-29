CREATE SEQUENCE IF NOT EXISTS tasks_id_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE tasks
(
    id             BIGINT PRIMARY KEY DEFAULT nextval('tasks_id_seq'),
    uuid           UUID      NOT NULL UNIQUE,
    title          TEXT      NOT NULL,
    description    TEXT,
    status         TEXT      NOT NULL DEFAULT 'PENDING',
    priority       TEXT      NOT NULL DEFAULT 'MEDIUM',
    due_date       TIMESTAMP,
    created_by_id  BIGINT    NOT NULL,
    assigned_to_id BIGINT    NOT NULL,
    version        INTEGER   NOT NULL DEFAULT 0,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_created_by FOREIGN KEY (created_by_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_created_by_id ON tasks (created_by_id);
CREATE INDEX idx_tasks_assigned_to_id ON tasks (assigned_to_id);
CREATE INDEX idx_tasks_status ON tasks (status);
CREATE INDEX idx_tasks_priority ON tasks (priority);
CREATE INDEX idx_tasks_due_date ON tasks (due_date);
CREATE UNIQUE INDEX idx_tasks_uuid ON tasks (uuid);