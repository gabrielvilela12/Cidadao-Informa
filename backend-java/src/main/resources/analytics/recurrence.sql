WITH grouped AS (
    SELECT establishment_id, state_code,
           COALESCE(NULLIF(location_key, ''), id) AS location_key,
           COALESCE(NULLIF(cause_key, ''), id) AS cause_key,
           MIN(address) AS address, MIN(category) AS category, COUNT(*) AS reports
    FROM protocols
    WHERE deleted_at IS NULL
      AND (:globalScope OR
           (CAST(:establishmentId AS text) IS NOT NULL AND establishment_id = :establishmentId) OR
           (CAST(:establishmentId AS text) IS NULL AND state_code IN (:states)))
      AND created_at >= :startAt AND created_at < :endAt
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
