-- Access core (T-105, FR-17): users, role assignments with an optional scope, audit log.

CREATE TABLE app_user (
    id               uuid PRIMARY KEY,
    email            text        NOT NULL UNIQUE,
    display_name     text        NOT NULL,
    provider         text        NOT NULL,
    provider_subject text        NOT NULL,
    created_at       timestamptz NOT NULL,
    UNIQUE (provider, provider_subject)
);

-- scope_type and scope_id are both empty for a global assignment (the only kind in this
-- release) and both set for a scoped one, for example an organization (FR-19).
CREATE TABLE role_assignment (
    id         uuid PRIMARY KEY,
    user_id    uuid        NOT NULL REFERENCES app_user (id),
    role       text        NOT NULL,
    scope_type text,
    scope_id   uuid,
    granted_by uuid REFERENCES app_user (id),
    granted_at timestamptz NOT NULL,
    CHECK ((scope_type IS NULL) = (scope_id IS NULL))
);

CREATE UNIQUE INDEX role_assignment_unique
    ON role_assignment (user_id, role, coalesce(scope_type, ''),
                        coalesce(scope_id, '00000000-0000-0000-0000-000000000000'));
CREATE INDEX role_assignment_role ON role_assignment (role);

-- actor_id is empty for system actions, such as seeding the first Owner from configuration.
CREATE TABLE audit_log (
    id           uuid PRIMARY KEY,
    actor_id     uuid REFERENCES app_user (id),
    action       text        NOT NULL,
    target       text        NOT NULL,
    before_value jsonb,
    after_value  jsonb,
    at           timestamptz NOT NULL
);

CREATE INDEX audit_log_at ON audit_log (at DESC);

-- The audit log is append-only, also for anyone with direct database access through the app user.
CREATE FUNCTION audit_log_append_only() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update_or_delete
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();
