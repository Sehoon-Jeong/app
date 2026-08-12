CREATE TABLE IF NOT EXISTS conversation_message_source (
    message_id INTEGER NOT NULL,
    source_order INTEGER NOT NULL CHECK (source_order > 0),
    title TEXT NOT NULL,
    url TEXT NOT NULL CHECK (url LIKE 'https://%'),
    source_tier TEXT NOT NULL CHECK (source_tier IN ('P1', 'P2', 'P3', 'P4')),
    PRIMARY KEY (message_id, source_order),
    UNIQUE (message_id, url),
    FOREIGN KEY (message_id) REFERENCES conversation_message(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_conversation_message_sources
    ON conversation_message_source(message_id, source_order);
