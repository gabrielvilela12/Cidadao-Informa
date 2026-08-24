ALTER TABLE protocols
    ADD COLUMN IF NOT EXISTS resolution_cost NUMERIC(12, 2);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'protocols_resolution_cost_nonnegative'
          AND conrelid = 'protocols'::regclass
    ) THEN
        ALTER TABLE protocols
            ADD CONSTRAINT protocols_resolution_cost_nonnegative
            CHECK (resolution_cost IS NULL OR resolution_cost >= 0);
    END IF;
END $$;

COMMENT ON COLUMN protocols.resolution_cost IS
    'Custo público em reais registrado pela equipe ao concluir a correção.';
