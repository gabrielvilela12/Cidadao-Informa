SELECT category, status, COUNT(*) AS total
FROM protocols
WHERE deleted_at IS NULL
  AND (:globalScope OR
       (CAST(:establishmentId AS text) IS NOT NULL AND establishment_id = :establishmentId) OR
       (CAST(:establishmentId AS text) IS NULL AND state_code IN (:states)))
  AND created_at >= :startAt AND created_at < :endAt
GROUP BY category, status
ORDER BY category, status;
