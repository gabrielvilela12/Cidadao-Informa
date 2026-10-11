-- Consultas da aplicação com parâmetros fixados para reproduzir a amostra documentada.
-- Base de demonstração de São Paulo; período inclusivo de 01/08/2026 a 10/10/2026.
-- Apenas leitura. Nenhuma migração ou alteração de dados.
BEGIN TRANSACTION READ ONLY;

-- distribution
SELECT category, status, COUNT(*) AS total
FROM protocols
WHERE deleted_at IS NULL
  AND (false OR
       (CAST('est-demo-sao-paulo' AS text) IS NOT NULL AND establishment_id = 'est-demo-sao-paulo') OR
       (CAST('est-demo-sao-paulo' AS text) IS NULL AND state_code IN ('SP')))
  AND created_at >= TIMESTAMPTZ '2026-08-01 00:00:00-03' AND created_at < TIMESTAMPTZ '2026-10-11 00:00:00-03'
GROUP BY category, status
ORDER BY category, status;

-- monthly
WITH scoped AS (
    SELECT created_at, resolved_at, status
    FROM protocols
    WHERE deleted_at IS NULL
      AND (false OR
           (CAST('est-demo-sao-paulo' AS text) IS NOT NULL AND establishment_id = 'est-demo-sao-paulo') OR
           (CAST('est-demo-sao-paulo' AS text) IS NULL AND state_code IN ('SP')))
      AND ((created_at >= TIMESTAMPTZ '2026-08-01 00:00:00-03' AND created_at < TIMESTAMPTZ '2026-10-11 00:00:00-03') OR
           (resolved_at >= TIMESTAMPTZ '2026-08-01 00:00:00-03' AND resolved_at < TIMESTAMPTZ '2026-10-11 00:00:00-03'))
), opened AS (
    SELECT DATE_TRUNC('month', created_at AT TIME ZONE 'America/Sao_Paulo') AS month, COUNT(*) AS total
    FROM scoped WHERE created_at >= TIMESTAMPTZ '2026-08-01 00:00:00-03' AND created_at < TIMESTAMPTZ '2026-10-11 00:00:00-03'
    GROUP BY 1
), completed AS (
    SELECT DATE_TRUNC('month', resolved_at AT TIME ZONE 'America/Sao_Paulo') AS month, COUNT(*) AS total
    FROM scoped
    WHERE status IN ('Concluido', 'Concluído', 'Resolved', 'Closed')
      AND resolved_at >= created_at AND resolved_at >= TIMESTAMPTZ '2026-08-01 00:00:00-03' AND resolved_at < TIMESTAMPTZ '2026-10-11 00:00:00-03'
    GROUP BY 1
), months AS (
    SELECT GENERATE_SERIES(
        DATE_TRUNC('month', CAST(TIMESTAMPTZ '2026-08-01 00:00:00-03' AS timestamptz) AT TIME ZONE 'America/Sao_Paulo'),
        DATE_TRUNC('month', (CAST(TIMESTAMPTZ '2026-10-11 00:00:00-03' AS timestamptz) - INTERVAL '1 microsecond') AT TIME ZONE 'America/Sao_Paulo'),
        INTERVAL '1 month') AS month
)
SELECT TO_CHAR(months.month, 'YYYY-MM') AS month,
       COALESCE(opened.total, 0) AS opened, COALESCE(completed.total, 0) AS completed
FROM months
LEFT JOIN opened USING (month)
LEFT JOIN completed USING (month)
ORDER BY months.month;

-- recurrence
WITH grouped AS (
    SELECT establishment_id, state_code,
           COALESCE(NULLIF(location_key, ''), id) AS location_key,
           COALESCE(NULLIF(cause_key, ''), id) AS cause_key,
           MIN(address) AS address, MIN(category) AS category, COUNT(*) AS reports
    FROM protocols
    WHERE deleted_at IS NULL
      AND (false OR
           (CAST('est-demo-sao-paulo' AS text) IS NOT NULL AND establishment_id = 'est-demo-sao-paulo') OR
           (CAST('est-demo-sao-paulo' AS text) IS NULL AND state_code IN ('SP')))
      AND created_at >= TIMESTAMPTZ '2026-08-01 00:00:00-03' AND created_at < TIMESTAMPTZ '2026-10-11 00:00:00-03'
    GROUP BY establishment_id, state_code,
             COALESCE(NULLIF(location_key, ''), id), COALESCE(NULLIF(cause_key, ''), id)
    HAVING COUNT(*) >= 2
), ranked AS (
    SELECT *, DENSE_RANK() OVER (ORDER BY reports DESC) AS position
    FROM grouped
)
SELECT position, address, category, reports
FROM ranked
ORDER BY reports DESC, establishment_id NULLS LAST, state_code, location_key, cause_key
LIMIT 10;

-- summary
WITH scoped AS (
    SELECT category, status, created_at, resolved_at, resolution_cost
    FROM protocols
    WHERE deleted_at IS NULL
      AND (false OR
           (CAST('est-demo-sao-paulo' AS text) IS NOT NULL AND establishment_id = 'est-demo-sao-paulo') OR
           (CAST('est-demo-sao-paulo' AS text) IS NULL AND state_code IN ('SP')))
      AND created_at >= TIMESTAMPTZ '2026-08-01 00:00:00-03' AND created_at < TIMESTAMPTZ '2026-10-11 00:00:00-03'
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

COMMIT;
