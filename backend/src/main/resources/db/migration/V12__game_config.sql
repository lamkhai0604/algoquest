-- Game rules edited by the Owner (D-047). One row; missing fields fall back to the defaults.
CREATE TABLE game_config (
    id          smallint    PRIMARY KEY CHECK (id = 1),
    rules       jsonb       NOT NULL,
    updated_at  timestamptz NOT NULL,
    updated_by  uuid        REFERENCES app_user (id)
);
