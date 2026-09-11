UPDATE platform_plans
SET status = 'inactive',
    updated_at = NOW()
WHERE code IN ('base', 'regional', 'avancado');

INSERT INTO platform_plans (
    code,
    name,
    description,
    status,
    sort_order,
    created_at,
    updated_at
) VALUES
    (
        'piloto',
        'Piloto institucional',
        'Validação controlada em uma secretaria, subprefeitura ou região, com implantação assistida.',
        'active',
        10,
        NOW(),
        NOW()
    ),
    (
        'municipal',
        'Operação municipal',
        'Jornada de solicitações, mapas, relatórios, transparência e gestão para municípios pequenos e médios.',
        'active',
        20,
        NOW(),
        NOW()
    ),
    (
        'grande',
        'Grande cidade',
        'Operação ampliada para municípios entre 500 mil e 1 milhão de habitantes.',
        'active',
        30,
        NOW(),
        NOW()
    ),
    (
        'metropole-parcial',
        'Metrópole regional',
        'Escopo progressivo para uma secretaria, região ou operação parcial metropolitana.',
        'active',
        40,
        NOW(),
        NOW()
    ),
    (
        'metropole-completa',
        'Metrópole completa',
        'Arquitetura, integrações, suporte e níveis de serviço para uma operação municipal de grande escala.',
        'active',
        50,
        NOW(),
        NOW()
    )
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
