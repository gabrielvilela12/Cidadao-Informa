/**
 * Gerador da base de demonstracao do Cidadao Informa.
 *
 * Emite SQL estatico (supabase/seed/demo-dados.sql) em vez de sortear as linhas
 * na hora de aplicar: o que e conferido aqui e exatamente o que entra no banco,
 * e aplicar duas vezes nao produz duas bases diferentes.
 *
 * Rodar:  npx tsx supabase/seed/gerar-demo.ts
 *
 * Por que um gerador e nao SQL escrito a mao: as datas precisam cair em faixas
 * calculadas contra o prazo de cada prioridade para os quatro estados de SLA
 * aparecerem na tela. Isso e conta, nao digitacao - e no fim o proprio sla.ts do
 * projeto confere o resultado, entao a base nasce coerente com a regra que as
 * telas aplicam.
 *
 * As datas saem como `now() - interval`, e nao como timestamp absoluto: a base
 * pode ser aplicada semanas depois e continua com chamados de hoje, da semana e
 * de meses atras.
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSlaInfo, type SlaState } from '../../src/utils/sla';
import { buildHeatPoints, heatDensityAnchor, heatRedThreshold, heatUnitAlpha } from '../../src/utils/heatmap';
import type { Protocol } from '../../src/constants';

// ---------------------------------------------------------------- determinismo

/** mulberry32: PRNG pequeno e estavel, para o seed sair igual toda vez. */
function createRandom(seed: number) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let value = Math.imul(state ^ (state >>> 15), 1 | state);
        value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

const random = createRandom(20260803);

function pick<T>(items: readonly T[]): T {
    return items[Math.floor(random() * items.length)];
}

function between(min: number, max: number): number {
    return min + random() * (max - min);
}

function integerBetween(min: number, max: number): number {
    return Math.floor(between(min, max + 1));
}

/** Normal padrao por Box-Muller, para espalhar pontos em volta de um foco. */
function gaussian(): number {
    return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
}

function uuid(): string {
    const hex = '0123456789abcdef';
    let out = '';
    for (let index = 0; index < 32; index += 1) out += hex[Math.floor(random() * 16)];
    return `${out.slice(0, 8)}-${out.slice(8, 12)}-${out.slice(12, 16)}-${out.slice(16, 20)}-${out.slice(20)}`;
}

// ---------------------------------------------------------------------- cidades

interface City {
    name: string;
    state: string;
    latitude: number;
    longitude: number;
    /** Quantos chamados a cidade recebe. */
    count: number;
    /** Focos de concentracao, para o mapa de calor ter area quente. */
    hotspots: number;
    streets: string[];
}

const CITIES: City[] = [
    { name: 'São Paulo', state: 'SP', latitude: -23.5505, longitude: -46.6333, count: 108, hotspots: 3, streets: ['Av. Paulista', 'R. da Consolação', 'Av. Ipiranga', 'R. Augusta', 'Av. Rebouças', 'R. Vergueiro', 'Av. Angélica', 'R. Teodoro Sampaio'] },
    { name: 'Rio de Janeiro', state: 'RJ', latitude: -22.9068, longitude: -43.1729, count: 68, hotspots: 3, streets: ['Av. Rio Branco', 'R. do Catete', 'Av. Atlântica', 'R. Voluntários da Pátria', 'Av. Presidente Vargas', 'R. Barata Ribeiro'] },
    { name: 'Brasília', state: 'DF', latitude: -15.7939, longitude: -47.8828, count: 78, hotspots: 3, streets: ['Eixo Monumental', 'SCS Quadra 2', 'W3 Sul Quadra 504', 'SGAN 605', 'Setor Comercial Norte', 'EQS 114/115'] },
    { name: 'Belo Horizonte', state: 'MG', latitude: -19.9167, longitude: -43.9345, count: 44, hotspots: 2, streets: ['Av. Afonso Pena', 'R. da Bahia', 'Av. Amazonas', 'R. dos Caetés', 'Av. Contorno'] },
    { name: 'Salvador', state: 'BA', latitude: -12.9777, longitude: -38.5016, count: 34, hotspots: 2, streets: ['Av. Sete de Setembro', 'Av. Tancredo Neves', 'R. Chile', 'Av. Oceânica', 'Av. Vasco da Gama'] },
    { name: 'Recife', state: 'PE', latitude: -8.0476, longitude: -34.877, count: 30, hotspots: 2, streets: ['Av. Boa Viagem', 'R. da Aurora', 'Av. Conde da Boa Vista', 'R. do Imperador', 'Av. Agamenon Magalhães'] },
    { name: 'Fortaleza', state: 'CE', latitude: -3.7319, longitude: -38.5267, count: 24, hotspots: 2, streets: ['Av. Beira Mar', 'R. Major Facundo', 'Av. Dom Luís', 'Av. Santos Dumont'] },
    { name: 'Curitiba', state: 'PR', latitude: -25.4284, longitude: -49.2733, count: 22, hotspots: 2, streets: ['R. XV de Novembro', 'Av. Sete de Setembro', 'R. Marechal Deodoro', 'Av. Cândido de Abreu'] },
    { name: 'Porto Alegre', state: 'RS', latitude: -30.0346, longitude: -51.2177, count: 19, hotspots: 2, streets: ['Av. Borges de Medeiros', 'R. dos Andradas', 'Av. Ipiranga', 'Av. Protásio Alves'] },
    { name: 'Manaus', state: 'AM', latitude: -3.119, longitude: -60.0217, count: 9, hotspots: 1, streets: ['Av. Eduardo Ribeiro', 'Av. Djalma Batista', 'R. Marechal Deodoro'] },
    { name: 'Belém', state: 'PA', latitude: -1.4558, longitude: -48.4902, count: 8, hotspots: 1, streets: ['Av. Presidente Vargas', 'Av. Nazaré', 'Tv. Padre Eutíquio'] },
    { name: 'Goiânia', state: 'GO', latitude: -16.6869, longitude: -49.2648, count: 9, hotspots: 1, streets: ['Av. Goiás', 'Av. Anhanguera', 'R. 44'] },
    { name: 'Campinas', state: 'SP', latitude: -22.9099, longitude: -47.0626, count: 7, hotspots: 1, streets: ['Av. Francisco Glicério', 'R. Barão de Jaguara', 'Av. Norte-Sul'] },
    { name: 'Ribeirão Preto', state: 'SP', latitude: -21.1775, longitude: -47.8103, count: 6, hotspots: 1, streets: ['Av. Independência', 'R. General Osório', 'Av. Nove de Julho'] },
    { name: 'Santos', state: 'SP', latitude: -23.9608, longitude: -46.3336, count: 5, hotspots: 1, streets: ['Av. Ana Costa', 'Av. Conselheiro Nébias', 'R. XV de Novembro'] },
    { name: 'Uberlândia', state: 'MG', latitude: -18.9186, longitude: -48.2772, count: 5, hotspots: 1, streets: ['Av. João Naves de Ávila', 'Av. Rondon Pacheco', 'R. Machado de Assis'] },
    { name: 'Sorocaba', state: 'SP', latitude: -23.5015, longitude: -47.4526, count: 4, hotspots: 1, streets: ['Av. Dom Aguirre', 'R. Barão de Piratininga'] },
    { name: 'Florianópolis', state: 'SC', latitude: -27.5954, longitude: -48.548, count: 6, hotspots: 1, streets: ['Av. Beira-Mar Norte', 'R. Felipe Schmidt', 'Av. Mauro Ramos'] },
    { name: 'Vitória', state: 'ES', latitude: -20.3155, longitude: -40.3128, count: 5, hotspots: 1, streets: ['Av. Jerônimo Monteiro', 'Av. Nossa Senhora dos Navegantes'] },
    { name: 'Natal', state: 'RN', latitude: -5.7945, longitude: -35.211, count: 5, hotspots: 1, streets: ['Av. Engenheiro Roberto Freire', 'Av. Rio Branco', 'Av. Prudente de Morais'] },
    { name: 'Campo Grande', state: 'MS', latitude: -20.4697, longitude: -54.6201, count: 4, hotspots: 1, streets: ['Av. Afonso Pena', 'R. 14 de Julho'] },
    { name: 'Cuiabá', state: 'MT', latitude: -15.6014, longitude: -56.0979, count: 4, hotspots: 1, streets: ['Av. Getúlio Vargas', 'Av. Historiador Rubens de Mendonça'] },
    { name: 'João Pessoa', state: 'PB', latitude: -7.1195, longitude: -34.845, count: 4, hotspots: 1, streets: ['Av. Epitácio Pessoa', 'Av. Cabo Branco'] },
    { name: 'Maceió', state: 'AL', latitude: -9.6658, longitude: -35.7353, count: 4, hotspots: 1, streets: ['Av. Fernandes Lima', 'Av. Doutor Antônio Gouveia'] },
    { name: 'Teresina', state: 'PI', latitude: -5.0892, longitude: -42.8019, count: 3, hotspots: 1, streets: ['Av. Frei Serafim', 'Av. Raul Lopes'] },
    { name: 'São Luís', state: 'MA', latitude: -2.5307, longitude: -44.3068, count: 3, hotspots: 1, streets: ['Av. dos Holandeses', 'Av. Litorânea'] },
    { name: 'Aracaju', state: 'SE', latitude: -10.9472, longitude: -37.0731, count: 3, hotspots: 1, streets: ['Av. Beira Mar', 'R. João Pessoa'] },
    { name: 'Palmas', state: 'TO', latitude: -10.1689, longitude: -48.3317, count: 3, hotspots: 1, streets: ['Av. JK', 'Quadra 104 Norte'] },
    { name: 'Porto Velho', state: 'RO', latitude: -8.7619, longitude: -63.9039, count: 3, hotspots: 1, streets: ['Av. Sete de Setembro', 'Av. Jorge Teixeira'] },
    { name: 'Macapá', state: 'AP', latitude: 0.0349, longitude: -51.0694, count: 2, hotspots: 1, streets: ['Av. FAB', 'R. Cândido Mendes'] },
    { name: 'Boa Vista', state: 'RR', latitude: 2.8235, longitude: -60.6758, count: 2, hotspots: 1, streets: ['Av. Ville Roy', 'Av. Getúlio Vargas'] },
    { name: 'Rio Branco', state: 'AC', latitude: -9.9754, longitude: -67.8249, count: 2, hotspots: 1, streets: ['Av. Ceará', 'R. Rio Grande do Sul'] },
];

// --------------------------------------------------------------------- pessoas

interface DemoUser {
    id: string;
    fullName: string;
    email: string;
    cpf: string;
}

/**
 * Cidadaos ficticios. O hash de senha e um valor invalido de proposito: o
 * BCryptPasswordEncoder nao casa com ele, entao nenhuma dessas contas entra no
 * sistema. Base de demonstracao nao precisa distribuir credencial que funciona.
 */
const USERS: DemoUser[] = [
    { id: 'demo-user-01', fullName: 'Ana Beatriz Ferreira', email: 'ana.ferreira@demo.local', cpf: '111.111.111-11' },
    { id: 'demo-user-02', fullName: 'Carlos Eduardo Lima', email: 'carlos.lima@demo.local', cpf: '222.222.222-22' },
    { id: 'demo-user-03', fullName: 'Mariana Souza Alves', email: 'mariana.alves@demo.local', cpf: '333.333.333-33' },
    { id: 'demo-user-04', fullName: 'João Pedro Nascimento', email: 'joao.nascimento@demo.local', cpf: '444.444.444-44' },
    { id: 'demo-user-05', fullName: 'Luciana Ribeiro Costa', email: 'luciana.costa@demo.local', cpf: '555.555.555-55' },
    { id: 'demo-user-06', fullName: 'Rafael Augusto Pinto', email: 'rafael.pinto@demo.local', cpf: '666.666.666-66' },
    { id: 'demo-user-07', fullName: 'Beatriz Carvalho Dias', email: 'beatriz.dias@demo.local', cpf: '777.777.777-77' },
    { id: 'demo-user-08', fullName: 'Marcos Vinícius Rocha', email: 'marcos.rocha@demo.local', cpf: '888.888.888-88' },
    { id: 'demo-user-09', fullName: 'Patrícia Gomes Barros', email: 'patricia.barros@demo.local', cpf: '999.999.999-99' },
    { id: 'demo-user-10', fullName: 'Fernando Teixeira Melo', email: 'fernando.melo@demo.local', cpf: '000.000.000-00' },
];

const PASSWORD_HASH = 'demo-sem-login';

// ------------------------------------------------------------------ ocorrencias

const CATEGORIES = ['Física', 'Visual', 'Auditiva', 'Outros'] as const;
type Category = typeof CATEGORIES[number];

/** Peso de cada categoria: barreira fisica e a queixa mais comum. */
const CATEGORY_WEIGHTS: [Category, number][] = [
    ['Física', 0.52],
    ['Visual', 0.2],
    ['Auditiva', 0.14],
    ['Outros', 0.14],
];

const DESCRIPTIONS: Record<Category, string[]> = {
    'Física': [
        'Calçada sem rebaixamento na esquina, cadeirante precisa descer na pista para atravessar',
        'Rampa de acesso com inclinação muito acima do permitido, impossível subir sozinho',
        'Buraco no meio da calçada há semanas, já causou queda de pedestre com muleta',
        'Elevador da estação parado desde o mês passado, sem previsão de reparo',
        'Vagas de estacionamento reservadas ocupadas por veículos sem credencial, sem fiscalização',
        'Banheiro acessível do terminal trancado, funcionário informa que a chave foi perdida',
        'Degrau único na entrada do posto de saúde, sem rampa nem plataforma',
        'Piso da passarela solto e escorregadio, perigoso para quem usa andador',
        'Faixa de pedestre sem rebaixo nas duas pontas, cadeira de rodas fica presa no meio',
        'Corrimão da escada de acesso arrancado, ninguém repôs',
    ],
    'Visual': [
        'Piso tátil interrompido no meio do trecho, direciona para um poste',
        'Semáforo sem sinal sonoro em cruzamento de movimento intenso',
        'Placas de sinalização sem braile no prédio da administração',
        'Obra na calçada sem tapume nem aviso tátil, risco alto para quem usa bengala',
        'Piso tátil coberto por mesas de bar, trecho inteiro inutilizado',
        'Iluminação queimada no acesso ao terminal, dificulta quem tem baixa visão',
        'Totem de autoatendimento sem recurso de áudio, impossível usar sem enxergar',
        'Piso tátil de alerta ausente no topo da escada, sem aviso de degrau',
    ],
    'Auditiva': [
        'Atendimento do posto sem intérprete de Libras, retorno sempre remarcado',
        'Chamada de senha apenas por voz, sem painel visual na sala de espera',
        'Alarme de emergência do prédio só sonoro, sem sinalização luminosa',
        'Videochamada de atendimento sem legenda nem intérprete',
        'Aviso de plataforma anunciado só no alto-falante, sem painel',
        'Balcão sem laço de indução, aparelho auditivo não capta nada com o ruído',
    ],
    'Outros': [
        'Site da prefeitura não funciona com leitor de tela na parte de agendamento',
        'Formulário de solicitação exige assinatura presencial, sem alternativa acessível',
        'Falta de assento preferencial identificado na sala de espera',
        'Atendimento prioritário não respeitado na fila do guichê',
        'Aplicativo de transporte sem opção de solicitar veículo adaptado',
        'Documento entregue somente em PDF de imagem, ilegível por leitor de tela',
    ],
};

type ProtocolStatus = 'Aberto' | 'Em Análise' | 'Concluído';

/**
 * `Atrasado` NAO entra aqui de proposito. Nenhum fluxo do sistema grava esse
 * status - o atraso e derivado de created_at contra o prazo da prioridade, em
 * src/utils/sla.ts. Semear o valor fabricaria um estado que o sistema real nunca
 * produz.
 */

/**
 * Chance de o chamado ja estar concluido, por idade.
 *
 * O status precisa depender da idade. Sorteado a parte, metade da base terminava
 * vencida - chamado de oito meses ainda aberto - e o painel abria com "Em
 * atraso" em 50%, numero que se le como sistema quebrado, nao como fila real. Na
 * pratica o antigo em geral ja foi resolvido, e o atraso concentra no meio: velho
 * o suficiente para vencer o prazo, novo o suficiente para ninguem ter fechado.
 */
const RESOLVED_CHANCE_BY_AGE: [number, number][] = [
    // idade maxima em horas, chance de estar concluido
    [24, 0.02],
    [168, 0.1],
    [720, 0.28],
    [2880, 0.62],
    [Number.POSITIVE_INFINITY, 0.82],
];

function statusForAge(ageHours: number): ProtocolStatus {
    const [, resolvedChance] = RESOLVED_CHANCE_BY_AGE.find(([maxHours]) => ageHours <= maxHours)!;
    if (random() < resolvedChance) return 'Concluído';
    return random() < 0.65 ? 'Aberto' : 'Em Análise';
}

type Priority = 'critica' | 'alta' | 'media' | 'baixa';

const PRIORITY_WEIGHTS: [Priority, number][] = [
    ['critica', 0.1],
    ['alta', 0.25],
    ['media', 0.4],
    ['baixa', 0.25],
];

/** Prazo por prioridade, em horas. Espelha SLA_DEADLINE_HOURS de sla.ts. */
const DEADLINE_HOURS: Record<Priority, number> = {
    critica: 48,
    alta: 120,
    media: 360,
    baixa: 720,
};

const UNTRIAGED_DEADLINE_HOURS = 360;

function weighted<T>(weights: [T, number][]): T {
    const roll = random();
    let cumulative = 0;
    for (const [value, weight] of weights) {
        cumulative += weight;
        if (roll <= cumulative) return value;
    }
    return weights[weights.length - 1][0];
}

/**
 * Faixas de idade do chamado. As duas ultimas e que dao ao painel algo para
 * mostrar: sem chamado velho e aberto, "Em atraso" fica em zero e Relatorios
 * anuncia conformidade total sobre uma base que nunca venceu prazo.
 */
const AGE_BUCKETS: [string, number, number, number][] = [
    // rotulo, horas minimas, horas maximas, peso
    ['hoje', 1, 20, 0.1],
    ['esta semana', 21, 168, 0.2],
    ['este mês', 169, 720, 0.26],
    ['último trimestre', 721, 2880, 0.26],
    ['mais de 4 meses', 2881, 9600, 0.18],
];

interface SeedProtocol {
    id: string;
    category: Category;
    description: string;
    address: string;
    ageHours: number;
    status: ProtocolStatus;
    userId: string;
    requester: string;
    priority: Priority | null;
    aiStatus: 'success' | 'pending' | 'failed';
    latitude: number | null;
    longitude: number | null;
    city: string;
}

const METERS_PER_DEGREE_LATITUDE = 111_320;

function scatter(city: City, focus: { latitude: number; longitude: number } | null, spreadMeters: number) {
    const base = focus ?? city;
    const longitudeScale = Math.max(Math.cos((city.latitude * Math.PI) / 180), 0.2);
    return {
        latitude: base.latitude + (gaussian() * spreadMeters) / METERS_PER_DEGREE_LATITUDE,
        longitude: base.longitude + (gaussian() * spreadMeters) / (METERS_PER_DEGREE_LATITUDE * longitudeScale),
    };
}

const protocols: SeedProtocol[] = [];

function buildProtocol(city: City, position: { latitude: number; longitude: number } | null): SeedProtocol {
    const category = weighted(CATEGORY_WEIGHTS);
    const user = pick(USERS);

    // 7% pendente e 5% falha na triagem: sem prioridade, o SLA cai no prazo
    // padrao. Serve para a tela de Logs de IA ter os tres estados.
    const triageRoll = random();
    const aiStatus = triageRoll < 0.07 ? 'pending' : triageRoll < 0.12 ? 'failed' : 'success';
    const priority = aiStatus === 'success' ? weighted(PRIORITY_WEIGHTS) : null;

    const bucket = weighted(AGE_BUCKETS.map(([label, , , weight]) => [label, weight] as [string, number]));
    const [, minHours, maxHours] = AGE_BUCKETS.find(([label]) => label === bucket)!;
    const ageHours = integerBetween(minHours, maxHours);

    return {
        id: uuid(),
        category,
        description: pick(DESCRIPTIONS[category]),
        address: `${pick(city.streets)}, ${integerBetween(20, 2400)} - ${city.name}/${city.state}`,
        ageHours,
        status: statusForAge(ageHours),
        userId: user.id,
        requester: user.fullName,
        priority,
        aiStatus,
        latitude: position ? Number(position.latitude.toFixed(6)) : null,
        longitude: position ? Number(position.longitude.toFixed(6)) : null,
        city: `${city.name}/${city.state}`,
    };
}

CITIES.forEach((city) => {
    // Focos com raio curto viram area quente no mapa de calor; o resto espalhado
    // pela cidade mantem o entorno frio, que e o contraste que a tela precisa.
    const hotspots = Array.from({ length: city.hotspots }, () => scatter(city, null, between(1200, 4000)));

    for (let index = 0; index < city.count; index += 1) {
        // 74% dentro de um foco, com desvio curto: e o que faz a densidade local
        // chegar ao topo da escala do mapa de calor. Com os pontos espalhados por
        // toda a cidade, nenhuma vizinhanca junta chamado suficiente e a tela
        // abre inteira na faixa fria - o recurso existe e nao aparece.
        const inHotspot = random() < 0.74 && hotspots.length > 0;
        const position = inHotspot
            ? scatter(city, pick(hotspots), between(90, 240))
            : scatter(city, null, between(2500, 6000));
        protocols.push(buildProtocol(city, position));
    }
});

/**
 * Chamados a vencer: dentro do prazo, nos ultimos 20% dele. A faixa e estreita
 * demais para cair por sorteio, e sem ela o painel nunca mostra o estado
 * intermediario entre "em dia" e "vencido".
 */
const DUE_SOON: [Priority, number][] = [
    ['critica', 44], ['critica', 46],
    ['alta', 104], ['alta', 112], ['alta', 118],
    ['media', 300], ['media', 330], ['media', 352],
    ['baixa', 600], ['baixa', 680],
];

DUE_SOON.forEach(([priority, ageHours]) => {
    const city = pick(CITIES.slice(0, 8));
    const position = scatter(city, null, between(800, 4000));
    const protocol = buildProtocol(city, position);
    protocols.push({
        ...protocol,
        ageHours,
        priority,
        aiStatus: 'success',
        status: random() < 0.5 ? 'Aberto' : 'Em Análise',
    });
});

/**
 * Chamados sem coordenada confirmada. Existem para a tela mostrar o que faz com
 * eles: ficam fora do mapa e sao contados a parte na legenda do calor, em vez de
 * receberem uma posicao inventada.
 */
for (let index = 0; index < 11; index += 1) {
    const city = pick(CITIES);
    protocols.push({ ...buildProtocol(city, null), latitude: null, longitude: null });
}

// ------------------------------------------------------------------- conferencia

function asProtocol(seed: SeedProtocol): Protocol {
    return {
        id: seed.id,
        service: seed.category,
        address: seed.address,
        date: '',
        status: seed.status,
        category: seed.category,
        description: seed.description,
        created_at: new Date(Date.now() - seed.ageHours * 3_600_000).toISOString(),
        ai_priority: seed.priority,
        ai_status: seed.aiStatus,
        latitude: seed.latitude,
        longitude: seed.longitude,
    };
}

const slaCount = new Map<SlaState, number>();
protocols.forEach((seed) => {
    const { state } = getSlaInfo(asProtocol(seed));
    slaCount.set(state, (slaCount.get(state) || 0) + 1);
});

const priorityCount = new Map<string, number>();
const statusCount = new Map<string, number>();
const categoryCount = new Map<string, number>();
protocols.forEach((seed) => {
    const priority = seed.priority ?? `sem triagem (${seed.aiStatus})`;
    priorityCount.set(priority, (priorityCount.get(priority) || 0) + 1);
    statusCount.set(seed.status, (statusCount.get(seed.status) || 0) + 1);
    categoryCount.set(seed.category, (categoryCount.get(seed.category) || 0) + 1);
});

const withoutLocation = protocols.filter((seed) => seed.latitude === null).length;

console.log(`\n${protocols.length} chamados, ${USERS.length} cidadãos, ${CITIES.length} cidades`);
console.log(`${withoutLocation} sem coordenada confirmada (ficam fora do mapa, contados na legenda)\n`);

const report = (title: string, counts: Map<string, number>) => {
    console.log(title);
    [...counts.entries()]
        .sort((first, second) => second[1] - first[1])
        .forEach(([label, count]) => console.log(`  ${label.padEnd(24)} ${String(count).padStart(4)}`));
    console.log('');
};

report('estado de SLA (calculado por src/utils/sla.ts):', slaCount as Map<string, number>);
report('prioridade da triagem:', priorityCount);
report('status:', statusCount);
report('categoria:', categoryCount);

// A demonstracao do mapa de calor depende de haver area densa: sem isso a tela
// abre inteira azul e o recurso nao aparece.
const { points } = buildHeatPoints(protocols.map(asProtocol));
[300, 400, 800].forEach((radiusMeters) => {
    const anchor = heatDensityAnchor(points, radiusMeters);
    const threshold = heatRedThreshold(heatUnitAlpha(anchor));
    console.log(`mapa de calor, raio ${radiusMeters} m: âncora ${anchor} chamados, vermelho a partir de ${threshold}`);
});

const required: SlaState[] = ['on-time', 'due-soon', 'late', 'resolved'];
const missing = required.filter((state) => !slaCount.get(state));
if (missing.length) {
    console.error(`\nFALHA: nenhum chamado nos estados ${missing.join(', ')}`);
    process.exit(1);
}

// ------------------------------------------------------------------------- SQL

function quote(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
}

function sqlValue(value: string | number | null): string {
    if (value === null) return 'NULL';
    return typeof value === 'number' ? String(value) : quote(value);
}

const header = `-- Base de demonstração do Cidadão Informa - GERADO, não editar à mão.
--
-- Origem: supabase/seed/gerar-demo.ts  (npx tsx supabase/seed/gerar-demo.ts)
-- ${protocols.length} chamados em ${CITIES.length} cidades, ${USERS.length} cidadãos fictícios.
--
-- NÃO é migração: este arquivo fica fora de db/migration e de supabase/migrations
-- justamente para nenhum deploy aplicá-lo sozinho. Rode à mão, no banco onde a
-- apresentação vai acontecer.
--
-- As datas são relativas a now(), então a base continua tendo chamados "de hoje"
-- e "de meses atrás" qualquer dia que você aplicar.
--
-- Para remover tudo depois: supabase/seed/demo-remover.sql
`;

const userRows = USERS.map((user) => `    (${[
    sqlValue(user.id),
    sqlValue(user.fullName),
    sqlValue(user.email),
    sqlValue(user.cpf),
    sqlValue('citizen'),
    sqlValue(PASSWORD_HASH),
].join(', ')}, now() - interval '${integerBetween(200, 9000)} hours')`).join(',\n');

const protocolRows = protocols.map((seed) => `    (${[
    sqlValue(seed.id),
    sqlValue(seed.category),
    sqlValue(seed.description),
    sqlValue(seed.address),
].join(', ')}, now() - interval '${seed.ageHours} hours', ${[
    sqlValue(seed.status),
    sqlValue(seed.userId),
    sqlValue(seed.requester),
    sqlValue(seed.priority),
    sqlValue(seed.aiStatus),
    sqlValue(seed.latitude),
    sqlValue(seed.longitude),
].join(', ')})`).join(',\n');

/**
 * Confere cada linha de VALUES antes de escrever o arquivo.
 *
 * O erro que este SQL pode ter e de aspas: uma apostrofe num endereco ou numa
 * descricao encerra a string mais cedo, e o que sobra vira sintaxe invalida no
 * meio de centenas de linhas - ou pior, um valor truncado que entra sem reclamar.
 * Aqui a linha e varrida contando virgula de topo fora de string, entao contagem
 * de campo errada e aspa desbalanceada nao passam.
 */
function assertRows(rows: string, expectedFields: number, label: string) {
    rows.split('\n').forEach((line, index) => {
        const trimmed = line.trim().replace(/,$/, '');
        if (!trimmed.startsWith('(') || !trimmed.endsWith(')')) {
            throw new Error(`${label}: linha ${index + 1} não é uma tupla: ${trimmed.slice(0, 60)}`);
        }

        const body = trimmed.slice(1, -1);
        let inString = false;
        let depth = 0;
        let fields = 1;

        for (let position = 0; position < body.length; position += 1) {
            const character = body[position];

            if (inString) {
                if (character !== "'") continue;
                // Duas aspas seguidas sao uma aspa escapada, nao o fim da string.
                if (body[position + 1] === "'") position += 1;
                else inString = false;
                continue;
            }

            if (character === "'") inString = true;
            else if (character === '(') depth += 1;
            else if (character === ')') depth -= 1;
            else if (character === ',' && depth === 0) fields += 1;
        }

        if (inString) throw new Error(`${label}: linha ${index + 1} tem aspa aberta`);
        if (depth !== 0) throw new Error(`${label}: linha ${index + 1} tem parêntese desbalanceado`);
        if (fields !== expectedFields) {
            throw new Error(`${label}: linha ${index + 1} tem ${fields} campos, esperado ${expectedFields}`);
        }
    });

    console.log(`  ${label}: ${rows.split('\n').length} linhas, ${expectedFields} campos cada`);
}

console.log('\nconferência do SQL:');
assertRows(userRows, 7, 'users');
assertRows(protocolRows, 12, 'protocols');

const dataSql = `${header}
BEGIN;

-- Cidadãos fictícios. O hash de senha é inválido de propósito: essas contas não
-- conseguem entrar no sistema. Use a sua conta real para apresentar.
INSERT INTO users (id, full_name, email, cpf, role, password_hash, created_at) VALUES
${userRows}
ON CONFLICT (id) DO NOTHING;

INSERT INTO protocols (
    id, category, description, address, created_at, status,
    user_id, requester, ai_priority, ai_status, latitude, longitude
) VALUES
${protocolRows}
ON CONFLICT (id) DO NOTHING;

COMMIT;
`;

const removeSql = `-- Remove a base de demonstração - GERADO por supabase/seed/gerar-demo.ts.
--
-- Apaga só o que o seed criou, pelos ids exatos. Nada de \`DELETE FROM protocols\`
-- sem WHERE: chamado real de cidadão não pode sair junto com o dado de vitrine.
--
-- Os protocolos vão primeiro porque jobs de IA, logs e a cadeia de auditoria
-- referenciam protocol_id com ON DELETE CASCADE.

BEGIN;

DELETE FROM protocols WHERE id IN (
${protocols.map((seed) => `    ${quote(seed.id)}`).join(',\n')}
);

DELETE FROM users WHERE id IN (
${USERS.map((user) => `    ${quote(user.id)}`).join(',\n')}
);

COMMIT;
`;

/**
 * Passa parte dos chamados para uma conta real. O painel do admin ja mostra a
 * base inteira, mas as telas de cidadao filtram por usuario do token: sem isso,
 * "Meus Protocolos" abre vazio na hora de demonstrar o outro lado do sistema.
 */
const adoptIds = protocols
    .filter((seed) => seed.ageHours < 900 && seed.latitude !== null)
    .slice(0, 9)
    .map((seed) => seed.id);

const adoptSql = `-- Passa alguns chamados de demonstração para a SUA conta - GERADO.
--
-- Opcional. Rode depois de demo-dados.sql, trocando o e-mail abaixo pelo da
-- conta com que você vai apresentar. Serve para "Meus Protocolos" e o dashboard
-- do cidadão não abrirem vazios.
--
-- Se o e-mail não existir, o UPDATE não altera nada e não dá erro.

BEGIN;

UPDATE protocols
SET user_id = dono.id,
    requester = dono.full_name
FROM (
    SELECT id, full_name
    FROM users
    WHERE lower(email) = lower('troque-pelo-seu@email.com')
    LIMIT 1
) AS dono
WHERE protocols.id IN (
${adoptIds.map((id) => `    ${quote(id)}`).join(',\n')}
);

COMMIT;
`;

const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(here, 'demo-dados.sql'), dataSql, 'utf8');
writeFileSync(join(here, 'demo-remover.sql'), removeSql, 'utf8');
writeFileSync(join(here, 'demo-adotar.sql'), adoptSql, 'utf8');

console.log('\nescritos:');
console.log('  supabase/seed/demo-dados.sql');
console.log('  supabase/seed/demo-remover.sql');
console.log('  supabase/seed/demo-adotar.sql\n');
