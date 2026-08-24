CREATE TABLE protocol_documents (
    id UUID PRIMARY KEY,
    protocol_id TEXT NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (
        document_type IN ('CONCLUSION_PUBLIC', 'CONCLUSION_INTERNAL')
    ),
    version INTEGER NOT NULL CHECK (version > 0),
    snapshot JSONB NOT NULL,
    source_hash TEXT NOT NULL,
    snapshot_hash TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_protocol_document_version
        UNIQUE (protocol_id, document_type, version),
    CONSTRAINT uq_protocol_document_source
        UNIQUE (protocol_id, document_type, source_hash)
);

CREATE INDEX idx_protocol_documents_latest
    ON protocol_documents (protocol_id, document_type, version DESC);

ALTER TABLE protocol_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE protocol_documents FROM anon, authenticated;

