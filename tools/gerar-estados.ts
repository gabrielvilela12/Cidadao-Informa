/**
 * Gera src/data/estados-brasil.ts a partir de um GeoJSON das UFs.
 *
 * Rodar:  npx tsx tools/gerar-estados.ts
 *
 * A fonte tem 3,3 MB e 85 mil vertices - inviavel de embarcar. O contorno e
 * simplificado por Ramer-Douglas-Peucker e as coordenadas cortadas em 3 casas
 * (~110 m), precisao muito acima do que um mapa de densidade por estado exige.
 *
 * No fim, o gerador se confere: usa o insideState do proprio app para checar que
 * 27 coordenadas conhecidas (uma capital por UF) continuam caindo no estado
 * certo depois da simplificacao. Fronteira distorcida a ponto de errar a UF de
 * uma capital reprova o arquivo, em vez de virar contagem errada na tela.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { insideState, type StateShape } from '../src/utils/regions';

const SOURCE_URL = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson';

/** Tolerancia do RDP em graus (~1,7 km). */
const TOLERANCE = 0.015;

/** Ilha menor que isto (lado da caixa, em graus) sai fora. */
const MIN_ISLAND_DEGREES = 0.08;

const DECIMALS = 3;

interface GeoFeature {
    properties: { name: string; sigla: string };
    geometry: { type: string; coordinates: number[][][][] | number[][][] };
}

/** Distancia do ponto ao segmento, no plano de graus. */
function perpendicular(point: [number, number], start: [number, number], end: [number, number]): number {
    const [x, y] = point;
    const [x1, y1] = start;
    const [x2, y2] = end;
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);

    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

function simplify(points: [number, number][], tolerance: number): [number, number][] {
    if (points.length <= 3) return points;

    let worst = 0;
    let worstIndex = 0;

    for (let index = 1; index < points.length - 1; index += 1) {
        const distance = perpendicular(points[index], points[0], points[points.length - 1]);
        if (distance > worst) {
            worst = distance;
            worstIndex = index;
        }
    }

    if (worst <= tolerance) return [points[0], points[points.length - 1]];

    return [
        ...simplify(points.slice(0, worstIndex + 1), tolerance).slice(0, -1),
        ...simplify(points.slice(worstIndex), tolerance),
    ];
}

function round(value: number): number {
    return Number(value.toFixed(DECIMALS));
}

/** GeoJSON vem em [lng, lat]; o Leaflet quer [lat, lng]. */
function toRing(coordinates: number[][]): [number, number][] {
    const ring = coordinates.map(([longitude, latitude]) => [latitude, longitude] as [number, number]);
    const simplified = simplify(ring, TOLERANCE).map(([latitude, longitude]) => (
        [round(latitude), round(longitude)] as [number, number]
    ));

    // O arredondamento pode colar vertices vizinhos.
    return simplified.filter(([latitude, longitude], index) => (
        index === 0 || latitude !== simplified[index - 1][0] || longitude !== simplified[index - 1][1]
    ));
}

function ringSpan(ring: [number, number][]): number {
    const latitudes = ring.map(([latitude]) => latitude);
    const longitudes = ring.map(([, longitude]) => longitude);
    return Math.max(Math.max(...latitudes) - Math.min(...latitudes), Math.max(...longitudes) - Math.min(...longitudes));
}

const here = dirname(fileURLToPath(import.meta.url));
const cachePath = join(here, '..', 'node_modules', '.cache', 'brazil-states.geojson');

if (!existsSync(cachePath)) {
    mkdirSync(dirname(cachePath), { recursive: true });
    console.log(`baixando ${SOURCE_URL}`);
    const response = await fetch(SOURCE_URL);
    if (!response.ok) throw new Error(`fonte respondeu ${response.status}`);
    writeFileSync(cachePath, await response.text(), 'utf8');
}

const source = JSON.parse(readFileSync(cachePath, 'utf8')) as { features: GeoFeature[] };

let verticesBefore = 0;
let verticesAfter = 0;
let islandsDropped = 0;

const states: StateShape[] = source.features.map((feature) => {
    const raw = feature.geometry.type === 'MultiPolygon'
        ? (feature.geometry.coordinates as number[][][][])
        : [feature.geometry.coordinates as number[][][]];

    raw.forEach((part) => part.forEach((ring) => { verticesBefore += ring.length; }));

    const parts = raw
        .map((part) => part.map(toRing).filter((ring) => ring.length >= 4))
        .filter((part) => part.length > 0);

    // Mantem sempre a maior parte; descarta ilhota que so custa bytes.
    const biggest = parts.reduce((largest, part) => (part[0].length > largest[0].length ? part : largest), parts[0]);
    const kept = parts.filter((part) => part === biggest || ringSpan(part[0]) >= MIN_ISLAND_DEGREES);
    islandsDropped += parts.length - kept.length;

    const all = kept.flat().flat();
    kept.forEach((part) => part.forEach((ring) => { verticesAfter += ring.length; }));

    const latitudes = all.map(([latitude]) => latitude);
    const longitudes = all.map(([, longitude]) => longitude);

    return {
        uf: feature.properties.sigla,
        name: feature.properties.name,
        parts: kept,
        box: [Math.min(...latitudes), Math.min(...longitudes), Math.max(...latitudes), Math.max(...longitudes)],
    };
});

console.log(`\n${states.length} estados`);
console.log(`vertices: ${verticesBefore} -> ${verticesAfter} (${Math.round((1 - verticesAfter / verticesBefore) * 100)}% menor)`);
console.log(`ilhas descartadas: ${islandsDropped}`);

// ------------------------------------------------------------------ conferencia

/** Uma capital por UF, para conferir que a fronteira simplificada nao trocou. */
const CAPITALS: [string, string, number, number][] = [
    ['AC', 'Rio Branco', -9.9754, -67.8249], ['AL', 'Maceió', -9.6658, -35.7353],
    ['AM', 'Manaus', -3.119, -60.0217], ['AP', 'Macapá', 0.0349, -51.0694],
    ['BA', 'Salvador', -12.9777, -38.5016], ['CE', 'Fortaleza', -3.7319, -38.5267],
    ['DF', 'Brasília', -15.7939, -47.8828], ['ES', 'Vitória', -20.3155, -40.3128],
    ['GO', 'Goiânia', -16.6869, -49.2648], ['MA', 'São Luís', -2.5307, -44.3068],
    ['MG', 'Belo Horizonte', -19.9167, -43.9345], ['MS', 'Campo Grande', -20.4697, -54.6201],
    ['MT', 'Cuiabá', -15.6014, -56.0979], ['PA', 'Belém', -1.4558, -48.4902],
    ['PB', 'João Pessoa', -7.1195, -34.845], ['PE', 'Recife', -8.0476, -34.877],
    ['PI', 'Teresina', -5.0892, -42.8019], ['PR', 'Curitiba', -25.4284, -49.2733],
    ['RJ', 'Rio de Janeiro', -22.9068, -43.1729], ['RN', 'Natal', -5.7945, -35.211],
    ['RO', 'Porto Velho', -8.7619, -63.9039], ['RR', 'Boa Vista', 2.8235, -60.6758],
    ['RS', 'Porto Alegre', -30.0346, -51.2177], ['SC', 'Florianópolis', -27.5954, -48.548],
    ['SE', 'Aracaju', -10.9472, -37.0731], ['SP', 'São Paulo', -23.5505, -46.6333],
    ['TO', 'Palmas', -10.1689, -48.3317],
];

const wrong: string[] = [];
CAPITALS.forEach(([uf, city, latitude, longitude]) => {
    const hits = states.filter((state) => insideState(latitude, longitude, state));
    const found = hits.map((state) => state.uf).join('+') || 'nenhum';

    // Brasilia cai dentro de Goias no desenho: o DF e um enclave, e o contorno
    // de GO da fonte nao tem o buraco. Aceita desde que o DF esteja entre os
    // achados - a ordem da lista resolve, com o DF antes de GO.
    const ok = uf === 'DF' ? hits.some((state) => state.uf === 'DF') : found === uf;
    if (!ok) wrong.push(`${city} (${uf}) caiu em ${found}`);
});

if (wrong.length) {
    console.error(`\nFALHA: simplificação trocou a UF de ${wrong.length} capital(is)`);
    wrong.forEach((line) => console.error(`  ${line}`));
    process.exit(1);
}

console.log(`conferência: as ${CAPITALS.length} capitais caem no estado certo`);

// ------------------------------------------------------------------------ saida

// O DF antes de GO: o enclave tem de ser testado primeiro, porque o contorno de
// Goias da fonte nao traz o buraco correspondente e conteria Brasilia.
const ordered = [
    ...states.filter((state) => state.uf === 'DF'),
    ...states.filter((state) => state.uf !== 'DF').sort((first, second) => first.uf.localeCompare(second.uf)),
];

const body = ordered.map((state) => {
    const parts = state.parts.map((part) => {
        const rings = part.map((ring) => `[${ring.map(([latitude, longitude]) => `[${latitude},${longitude}]`).join(',')}]`);
        return `[${rings.join(',')}]`;
    });

    return `    { uf: '${state.uf}', name: '${state.name.replace(/'/g, "\\'")}', box: [${state.box.join(',')}], parts: [${parts.join(',')}] },`;
}).join('\n');

const output = `/**
 * Perímetro das 27 unidades federativas - GERADO, não editar à mão.
 *
 * Origem: tools/gerar-estados.ts  (npx tsx tools/gerar-estados.ts)
 * Fonte:  ${SOURCE_URL}
 *
 * Contorno simplificado por Ramer-Douglas-Peucker com tolerância de ${TOLERANCE}° (~1,7 km)
 * e coordenadas em ${DECIMALS} casas (~110 m). ${verticesBefore} vértices viraram ${verticesAfter}.
 * Ilhas com menos de ${MIN_ISLAND_DEGREES}° de lado foram descartadas.
 *
 * Coordenadas em [lat, lng], a ordem que o Leaflet espera. Cada estado tem
 * partes (ilhas) e cada parte tem anéis: o primeiro é o contorno, os seguintes
 * são buracos.
 *
 * O Distrito Federal vem primeiro de propósito: é um enclave, e o contorno de
 * Goiás nesta fonte não traz o buraco correspondente. Quem procura o estado de
 * uma coordenada para na primeira correspondência, então o DF tem de ser testado
 * antes de Goiás.
 *
 * Este módulo é carregado sob demanda (import dinâmico), só quando a camada por
 * estado é acionada: são ~${Math.round(verticesAfter * 16 / 1024)} KB que não fazem falta em nenhuma outra tela.
 */

import type { StateShape } from '../utils/regions';

export const ESTADOS_BRASIL: StateShape[] = [
${body}
];
`;

const target = join(here, '..', 'src', 'data');
mkdirSync(target, { recursive: true });
const file = join(target, 'estados-brasil.ts');
writeFileSync(file, output, 'utf8');

console.log(`\nescrito: src/data/estados-brasil.ts (${Math.round(output.length / 1024)} KB)\n`);
