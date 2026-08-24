DROP TABLE IF EXISTS protocol_documents;

CREATE TABLE daily_operational_reports (
    id UUID PRIMARY KEY,
    report_date DATE NOT NULL UNIQUE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    new_protocols_count INTEGER NOT NULL CHECK (new_protocols_count >= 0),
    status_changes_count INTEGER NOT NULL CHECK (status_changes_count >= 0),
    protocols_involved_count INTEGER NOT NULL CHECK (protocols_involved_count >= 0),
    total_spent NUMERIC(14, 2) NOT NULL CHECK (total_spent >= 0),
    status_transitions JSONB NOT NULL DEFAULT '[]'::jsonb,
    region_distribution JSONB NOT NULL DEFAULT '[]'::jsonb,
    source_hash TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (period_end > period_start)
);

CREATE TABLE daily_operational_report_protocols (
    id UUID PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES daily_operational_reports(id) ON DELETE CASCADE,
    protocol_id TEXT NOT NULL REFERENCES protocols(id) ON DELETE RESTRICT,
    category TEXT NOT NULL,
    address TEXT NOT NULL,
    region TEXT NOT NULL,
    current_status TEXT NOT NULL,
    protocol_created_at TIMESTAMPTZ NOT NULL,
    created_during_period BOOLEAN NOT NULL,
    resolution_cost NUMERIC(12, 2),
    spent_during_period NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (spent_during_period >= 0),
    status_changes JSONB NOT NULL DEFAULT '[]'::jsonb,
    UNIQUE (report_id, protocol_id)
);

CREATE INDEX idx_daily_operational_reports_date
    ON daily_operational_reports (report_date DESC);
CREATE INDEX idx_daily_report_protocols_report
    ON daily_operational_report_protocols (report_id);
CREATE INDEX idx_daily_report_protocols_protocol
    ON daily_operational_report_protocols (protocol_id);

ALTER TABLE daily_operational_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_operational_report_protocols ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE daily_operational_reports FROM anon, authenticated;
REVOKE ALL ON TABLE daily_operational_report_protocols FROM anon, authenticated;
