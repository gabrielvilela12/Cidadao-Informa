WITH scoped AS (
    SELECT category, status, created_at, resolved_at, resolution_cost
    FROM protocols
    WHERE deleted_at IS NULL
      AND (:globalScope OR
           (CAST(:establishmentId AS text) IS NOT NULL AND establishment_id = :establishmentId) OR
           (CAST(:establishmentId AS text) IS NULL AND state_code IN (:states)))
      AND created_at >= :startAt AND created_at < :endAt
), cohort AS (
    SELECT *, status IN ('Concluido', 'Concluído', 'Resolved', 'Closed') AS completed
    FROM scoped
)
SELECT COUNT(*) AS total,
       COUNT(*) FILTER (WHERE completed) AS completed,
       COALESCE(ROUND(100.0 * COUNT(*) FILTER (WHERE completed) / NULLIF(COUNT(*), 0), 2), 0) AS completion_rate,
       ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 86400.0)
           FILTER (WHERE completed AND resolved_at >= created_at), 2) AS average_resolution_days,
       COUNT(*) FILTER (WHERE completed AND resolved_at >= created_at) AS timed_completions,
       SUM(resolution_cost) FILTER (WHERE completed AND resolution_cost IS NOT NULL) AS total_cost,
       ROUND(AVG(resolution_cost) FILTER (WHERE completed AND resolution_cost IS NOT NULL), 2) AS average_cost,
       COUNT(*) FILTER (WHERE completed AND resolution_cost IS NOT NULL) AS costed_completions
FROM cohort;
