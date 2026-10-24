-- Catholic Guide schema.
--
-- Content is edited as a working copy and goes live on publish: each translation keeps
-- its editable fields plus a published snapshot. The public site only ever reads the
-- snapshot, so "Save draft" never changes what visitors see.

CREATE TABLE languages (
    code          VARCHAR(8)   PRIMARY KEY,
    native_name   VARCHAR(64)  NOT NULL,
    english_name  VARCHAR(64)  NOT NULL,
    enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
    is_default    BOOLEAN      NOT NULL DEFAULT FALSE,
    songs_only    BOOLEAN      NOT NULL DEFAULT FALSE,
    position      INT          NOT NULL DEFAULT 0
);

CREATE TABLE users (
    id              BIGSERIAL    PRIMARY KEY,
    name            VARCHAR(120) NOT NULL,
    email           VARCHAR(254) NOT NULL UNIQUE,
    role            VARCHAR(16)  NOT NULL CHECK (role IN ('ADMIN', 'EDITOR')),
    status          VARCHAR(16)  NOT NULL CHECK (status IN ('INVITED', 'ACTIVE', 'DEACTIVATED')),
    last_sign_in_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE login_codes (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    code_hash   VARCHAR(64)  NOT NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    attempts    INT          NOT NULL DEFAULT 0,
    used        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX login_codes_user_idx ON login_codes (user_id, created_at DESC);

CREATE TABLE sessions (
    token_hash  VARCHAR(64)  PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

CREATE TABLE settings (
    key    VARCHAR(64)  PRIMARY KEY,
    value  TEXT         NOT NULL
);

CREATE TABLE categories (
    id        BIGSERIAL    PRIMARY KEY,
    kind      VARCHAR(16)  NOT NULL CHECK (kind IN ('PRAYER', 'SONG')),
    name      VARCHAR(80)  NOT NULL,
    position  INT          NOT NULL DEFAULT 0,
    UNIQUE (kind, name)
);

-- One row per calendar date. Colour and cycle are shared by every language.
CREATE TABLE liturgical_days (
    day             DATE         PRIMARY KEY,
    colour          VARCHAR(16)  NOT NULL CHECK (colour IN ('GREEN', 'VIOLET', 'WHITE', 'RED', 'ROSE')),
    cycle           VARCHAR(16)  NOT NULL,
    highlight       BOOLEAN      NOT NULL DEFAULT FALSE,
    hymn_song_id    BIGINT
);

-- Day names are translated: "Saturday of the 29th Week in Ordinary Time" etc.
CREATE TABLE liturgical_day_names (
    day             DATE         NOT NULL REFERENCES liturgical_days (day) ON DELETE CASCADE,
    lang            VARCHAR(8)   NOT NULL REFERENCES languages (code),
    day_name        VARCHAR(200) NOT NULL,
    season_label    VARCHAR(120) NOT NULL DEFAULT '',
    saint           VARCHAR(200) NOT NULL DEFAULT '',
    saint_note      VARCHAR(80)  NOT NULL DEFAULT '',
    short_label     VARCHAR(80)  NOT NULL DEFAULT '',
    highlight_note  VARCHAR(200) NOT NULL DEFAULT '',
    PRIMARY KEY (day, lang)
);

CREATE TABLE reading_sets (
    id                  BIGSERIAL    PRIMARY KEY,
    day                 DATE         NOT NULL REFERENCES liturgical_days (day),
    lang                VARCHAR(8)   NOT NULL REFERENCES languages (code),
    credit              VARCHAR(200) NOT NULL DEFAULT '',
    quote               TEXT         NOT NULL DEFAULT '',
    quote_cite          VARCHAR(120) NOT NULL DEFAULT '',
    published           JSONB,
    published_at        TIMESTAMPTZ,
    has_changes         BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by          BIGINT       REFERENCES users (id),
    UNIQUE (day, lang)
);

CREATE TABLE reading_parts (
    id              BIGSERIAL    PRIMARY KEY,
    reading_set_id  BIGINT       NOT NULL REFERENCES reading_sets (id) ON DELETE CASCADE,
    position        INT          NOT NULL,
    kind            VARCHAR(40)  NOT NULL,
    citation        VARCHAR(120) NOT NULL DEFAULT '',
    intro           VARCHAR(300) NOT NULL DEFAULT '',
    response        VARCHAR(300) NOT NULL DEFAULT '',
    body            TEXT         NOT NULL DEFAULT '',
    close_reader    VARCHAR(200) NOT NULL DEFAULT '',
    close_people    VARCHAR(200) NOT NULL DEFAULT ''
);
CREATE INDEX reading_parts_set_idx ON reading_parts (reading_set_id, position);

CREATE TABLE prayers (
    id            BIGSERIAL    PRIMARY KEY,
    slug          VARCHAR(120) NOT NULL UNIQUE,
    category_id   BIGINT       NOT NULL REFERENCES categories (id),
    reading_time  VARCHAR(40)  NOT NULL DEFAULT '1 min',
    tags          VARCHAR(400) NOT NULL DEFAULT '',
    source        VARCHAR(200) NOT NULL DEFAULT '',
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by    BIGINT       REFERENCES users (id)
);

CREATE TABLE prayer_translations (
    id               BIGSERIAL    PRIMARY KEY,
    prayer_id        BIGINT       NOT NULL REFERENCES prayers (id) ON DELETE CASCADE,
    lang             VARCHAR(8)   NOT NULL REFERENCES languages (code),
    title            VARCHAR(200) NOT NULL,
    body             TEXT         NOT NULL DEFAULT '',
    published_title  VARCHAR(200),
    published_body   TEXT,
    published_at     TIMESTAMPTZ,
    has_changes      BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by       BIGINT       REFERENCES users (id),
    UNIQUE (prayer_id, lang)
);

-- Songs are not translated: each song is in exactly one language.
CREATE TABLE songs (
    id              BIGSERIAL    PRIMARY KEY,
    slug            VARCHAR(120) NOT NULL UNIQUE,
    lang            VARCHAR(8)   NOT NULL REFERENCES languages (code),
    category_id     BIGINT       NOT NULL REFERENCES categories (id),
    title           VARCHAR(200) NOT NULL,
    author          VARCHAR(200) NOT NULL DEFAULT '',
    tune            VARCHAR(120) NOT NULL DEFAULT '',
    rights          VARCHAR(20)  NOT NULL CHECK (rights IN ('PUBLIC_DOMAIN', 'LICENSED', 'NEEDS_CHECKING')),
    licence_number  VARCHAR(80)  NOT NULL DEFAULT '',
    published       JSONB,
    published_at    TIMESTAMPTZ,
    has_changes     BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by      BIGINT       REFERENCES users (id)
);

CREATE TABLE song_blocks (
    id        BIGSERIAL    PRIMARY KEY,
    song_id   BIGINT       NOT NULL REFERENCES songs (id) ON DELETE CASCADE,
    position  INT          NOT NULL,
    type      VARCHAR(16)  NOT NULL CHECK (type IN ('VERSE', 'REFRAIN')),
    body      TEXT         NOT NULL DEFAULT ''
);
CREATE INDEX song_blocks_song_idx ON song_blocks (song_id, position);

ALTER TABLE liturgical_days
    ADD CONSTRAINT liturgical_days_hymn_fk FOREIGN KEY (hymn_song_id) REFERENCES songs (id) ON DELETE SET NULL;

CREATE TABLE activity (
    id        BIGSERIAL    PRIMARY KEY,
    at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    user_id   BIGINT       REFERENCES users (id) ON DELETE SET NULL,
    verb      VARCHAR(40)  NOT NULL,
    item      VARCHAR(300) NOT NULL
);
CREATE INDEX activity_at_idx ON activity (at DESC);
