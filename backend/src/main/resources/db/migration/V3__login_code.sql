-- One-time sign-in codes (T-104, D-036): only a SHA-256 hash is stored; valid 60 s, single use.
CREATE TABLE login_code (
    id         uuid PRIMARY KEY,
    code_hash  text        NOT NULL UNIQUE,
    user_id    uuid        NOT NULL REFERENCES app_user (id),
    expires_at timestamptz NOT NULL,
    used_at    timestamptz
);

CREATE INDEX login_code_expires_at ON login_code (expires_at);
