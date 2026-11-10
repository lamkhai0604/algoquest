-- Daily streak (T-305, FR-13). Days are calendar days in the player's own time zone.
CREATE TABLE streak (
    user_id         uuid PRIMARY KEY REFERENCES app_user (id),
    current         int  NOT NULL CHECK (current >= 0),
    best            int  NOT NULL CHECK (best >= 0),
    last_active_day date NOT NULL
);
