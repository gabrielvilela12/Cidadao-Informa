WITH scoped AS (
    SELECT created_at, resolved_at, status
    FROM protocols
    WHERE deleted_at IS NULL
      AND (:globalScope OR
           (CAST(:establishmentId AS text) IS NOT NULL AND establishment_id = :establishmentId) OR
           (CAST(:establishmentId AS text) IS NULL AND state_code IN (:states)))
      AND ((created_at >= :startAt AND created_at < :endAt) OR
           (resolved_at >= :startAt AND resolved_at < :endAt))
), opened AS (
    SELECT DATE_TRUNC('month', created_at AT TIME ZONE 'America/Sao_Paulo') AS month, COUNT(*) AS total
    FROM scoped WHERE created_at >= :startAt AND created_at < :endAt
    GROUP BY 1
), completed AS (
    SELECT DATE_TRUNC('month', resolved_at AT TIME ZONE 'America/Sao_Paulo') AS month, COUNT(*) AS total
    FROM scoped
    WHERE status IN ('Concluido', 'Concluído', 'Resolved', 'Closed')
      AND resolved_at >= created_at AND resolved_at >= :startAt AND resolved_at < :endAt
    GROUP BY 1
), months AS (
    SELECT GENERATE_SERIES(
        DATE_TRUNC('month', CAST(:startAt AS timestamptz) AT TIME ZONE 'America/Sao_Paulo'),
        DATE_TRUNC('month', (CAST(:endAt AS timestamptz) - INTERVAL '1 microsecond') AT TIME ZONE 'America/Sao_Paulo'),
        INTERVAL '1 month') AS month
)
SELECT TO_CHAR(months.month, 'YYYY-MM') AS month,
       COALESCE(opened.total, 0) AS opened, COALESCE(completed.total, 0) AS completed
FROM months
LEFT JOIN opened USING (month)
LEFT JOIN completed USING (month)
ORDER BY months.month;
