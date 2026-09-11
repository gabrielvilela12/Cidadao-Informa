export type CommercialPlan = {
  code: string;
  name: string;
  audience: string;
  priceRange: string;
  description: string;
  internalUsers: string;
  featured?: boolean;
};

export const COMMERCIAL_PLANS: CommercialPlan[] = [
  {
    code: 'piloto',
    name: 'Piloto institucional',
    audience: 'Uma secretaria, subprefeitura ou região',
    priceRange: 'R$ 12.900 a R$ 24.900/mês',
    description: 'Validação controlada da operação, com implantação assistida e acompanhamento dos primeiros indicadores.',
    internalUsers: 'Até 30 usuários internos',
  },
  {
    code: 'municipal',
    name: 'Operação municipal',
    audience: 'Municípios pequenos e médios',
    priceRange: 'R$ 15.000 a R$ 50.000/mês',
    description: 'Jornada municipal de solicitações, mapas, relatórios, transparência e gestão de atendimento.',
    internalUsers: 'Capacidade definida na análise',
    featured: true,
  },
  {
    code: 'grande',
    name: 'Grande cidade',
    audience: 'Municípios entre 500 mil e 1 milhão de habitantes',
    priceRange: 'R$ 40.000 a R$ 80.000/mês',
    description: 'Operação ampliada, mais equipes internas, governança executiva e planejamento regional.',
    internalUsers: 'Capacidade definida na análise',
  },
  {
    code: 'metropole-parcial',
    name: 'Metrópole regional',
    audience: 'Secretaria, região ou operação parcial metropolitana',
    priceRange: 'R$ 60.000 a R$ 150.000/mês',
    description: 'Escopo metropolitano progressivo para validar integrações, adesão e volume antes da expansão.',
    internalUsers: 'Equipe e SLA personalizados',
  },
  {
    code: 'metropole-completa',
    name: 'Metrópole completa',
    audience: 'Operação municipal de grande escala',
    priceRange: 'R$ 200.000 a R$ 600.000+/mês',
    description: 'Arquitetura, integrações, suporte e níveis de serviço dimensionados para uma operação de alta escala.',
    internalUsers: 'Equipe, integrações e SLA personalizados',
  },
];

export const COMMERCIAL_PLAN_BY_CODE = Object.fromEntries(
  COMMERCIAL_PLANS.map((plan) => [plan.code, plan]),
) as Record<string, CommercialPlan>;
