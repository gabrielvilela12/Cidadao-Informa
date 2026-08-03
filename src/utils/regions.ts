/**
 * Agregacao do mapa de calor por recorte administrativo.
 *
 * A grade de quadrados que existia antes contava certo, mas desenhava areas que
 * nao significam nada: no zoom de pais uma celula de 500 km cobria metade de um
 * estado, um pedaco do vizinho e um naco de oceano. Numero correto sobre area
 * arbitraria nao serve para decidir onde mandar equipe.
 *
 * Aqui a area passa a ser o recorte que a gestao usa:
 *  - estado: o perimetro real da UF, com a contagem de chamados dentro dela;
 *  - cidade: um circulo em volta de onde os chamados de fato estao, agrupados
 *    por proximidade.
 *
 * Por que cidade nao vem de poligono: seriam 5.570 municipios, e nem o peso no
 * bundle nem a precisao se justificam para o que a tela responde ("onde esta
 * concentrado"). Agrupar por distancia usa a propria posicao confirmada dos
 * chamados, entao o circulo cobre exatamente onde a demanda esta - sem depender
 * de o endereco ter sido escrito com o nome certo da cidade.
 */

import { getMarkerPosition, type GeoLocatableProtocol } from './mapUtils';

const METERS_PER_DEGREE_LATITUDE = 111_320;

/** Um estado: perimetro em partes (ilhas) e aneis (buracos). */
export interface StateShape {
    uf: string;
    name: string;
    /** Cada parte e uma lista de aneis; o primeiro e o contorno, os outros buracos. */
    parts: [number, number][][][];
    /** [sul, oeste, norte, leste], para descartar sem testar o poligono. */
    box: [number, number, number, number];
}

/** Lancamento de raio num anel. Coordenadas em [lat, lng]. */
function insideRing(latitude: number, longitude: number, ring: [number, number][]): boolean {
    let inside = false;

    for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
        const [latitudeA, longitudeA] = ring[index];
        const [latitudeB, longitudeB] = ring[previous];

        const crosses = (latitudeA > latitude) !== (latitudeB > latitude)
            && longitude < ((longitudeB - longitudeA) * (latitude - latitudeA)) / (latitudeB - latitudeA) + longitudeA;

        if (crosses) inside = !inside;
    }

    return inside;
}

/** true quando a coordenada cai dentro do estado. */
export function insideState(latitude: number, longitude: number, state: StateShape): boolean {
    const [south, west, north, east] = state.box;
    if (latitude < south || latitude > north || longitude < west || longitude > east) return false;

    return state.parts.some(([outline, ...holes]) => (
        insideRing(latitude, longitude, outline)
        && !holes.some((hole) => insideRing(latitude, longitude, hole))
    ));
}

/**
 * Tolerancia para encostar a coordenada no estado mais proximo.
 *
 * Existe porque o contorno embarcado e simplificado (~1,7 km) e o litoral
 * brasileiro e recortado: ponto que esta em terra, numa ponta ou dentro de uma
 * baia que a simplificacao cortou, cai fora do poligono. Medido na base de
 * demonstracao, 53 de 543 chamados ficavam de fora - todos em cidade de costa
 * (Rio, Fortaleza, Salvador, Florianopolis, Vitoria), e nenhum atribuido a UF
 * errada. Sao chamados de endereco no continente perdidos pela minha
 * aproximacao, nao chamados no mar.
 *
 * 25 km cobre esse erro sem alcancar o estado vizinho: a menor distancia entre
 * duas capitais de UFs diferentes e uma ordem de grandeza maior.
 */
const STATE_SNAP_METERS = 25_000;

/** Distancia do ponto ao segmento, em metros, num plano local. */
function segmentDistanceMeters(
    latitude: number,
    longitude: number,
    [latitudeA, longitudeA]: [number, number],
    [latitudeB, longitudeB]: [number, number],
): number {
    const scale = Math.max(Math.cos((latitude * Math.PI) / 180), 0.2);
    const x = (longitude - longitudeA) * METERS_PER_DEGREE_LATITUDE * scale;
    const y = (latitude - latitudeA) * METERS_PER_DEGREE_LATITUDE;
    const dx = (longitudeB - longitudeA) * METERS_PER_DEGREE_LATITUDE * scale;
    const dy = (latitudeB - latitudeA) * METERS_PER_DEGREE_LATITUDE;

    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) return Math.hypot(x, y);

    const t = Math.max(0, Math.min(1, (x * dx + y * dy) / lengthSquared));
    return Math.hypot(x - t * dx, y - t * dy);
}

/** Menor distancia do ponto ao contorno do estado, em metros. */
function distanceToStateMeters(latitude: number, longitude: number, state: StateShape): number {
    let nearest = Number.POSITIVE_INFINITY;

    state.parts.forEach((part) => part.forEach((ring) => {
        for (let index = 0; index < ring.length - 1; index += 1) {
            const distance = segmentDistanceMeters(latitude, longitude, ring[index], ring[index + 1]);
            if (distance < nearest) nearest = distance;
        }
    }));

    return nearest;
}

/**
 * Qual estado contem a coordenada. Quando nenhum contem, devolve o mais proximo
 * dentro de `snapMeters` - ver STATE_SNAP_METERS. Passar 0 desliga a tolerancia e
 * exige que o ponto esteja dentro do poligono.
 */
export function findState(
    latitude: number,
    longitude: number,
    states: StateShape[],
    snapMeters: number = STATE_SNAP_METERS,
): StateShape | null {
    const containing = states.find((state) => insideState(latitude, longitude, state));
    if (containing || snapMeters <= 0) return containing || null;

    const margin = snapMeters / METERS_PER_DEGREE_LATITUDE;
    let nearest: StateShape | null = null;
    let nearestDistance = snapMeters;

    states.forEach((state) => {
        const [south, west, north, east] = state.box;
        if (
            latitude < south - margin || latitude > north + margin
            || longitude < west - margin || longitude > east + margin
        ) return;

        const distance = distanceToStateMeters(latitude, longitude, state);
        if (distance < nearestDistance) {
            nearest = state;
            nearestDistance = distance;
        }
    });

    return nearest;
}

export interface StateTally {
    state: StateShape;
    count: number;
    /** Centro da maior parte, onde o rotulo da contagem e ancorado. */
    labelPosition: [number, number];
}

export interface StateAggregation {
    tallies: StateTally[];
    maxCount: number;
    /** Chamados com coordenada que nao cairam em nenhum estado. */
    outside: number;
}

/**
 * Conta os chamados por estado.
 *
 * Estado sem chamado nao entra: pintar as 27 UFs deixaria o mapa coberto de
 * area fria e esconderia onde ha demanda. A ausencia de cor ja diz "nenhum
 * chamado aqui".
 */
export function aggregateByState(protocols: GeoLocatableProtocol[], states: StateShape[]): StateAggregation {
    const counts = new Map<string, number>();
    let outside = 0;

    protocols.forEach((protocol) => {
        const position = getMarkerPosition(protocol);
        if (!position) return;

        const state = findState(position[0], position[1], states);
        if (!state) {
            outside += 1;
            return;
        }

        counts.set(state.uf, (counts.get(state.uf) || 0) + 1);
    });

    const tallies = states
        .filter((state) => counts.has(state.uf))
        .map((state) => ({
            state,
            count: counts.get(state.uf) as number,
            labelPosition: stateLabelPosition(state),
        }))
        // Crescente: o rotulo do estado quente fica por cima na sobreposicao.
        .sort((first, second) => first.count - second.count);

    return {
        tallies,
        maxCount: tallies.reduce((max, tally) => Math.max(max, tally.count), 0),
        outside,
    };
}

/**
 * Centro da maior parte do estado.
 *
 * O centro da caixa envolvente nao serve: no Para ele cai perto da foz, e em
 * estados com ilha o rotulo escaparia para a agua. A media dos vertices do maior
 * contorno fica dentro da massa de terra nos 27 casos.
 */
function stateLabelPosition(state: StateShape): [number, number] {
    const biggest = state.parts.reduce((largest, part) => (
        part[0].length > largest[0].length ? part : largest
    ));
    const outline = biggest[0];

    const total = outline.reduce<[number, number]>(
        (sum, [latitude, longitude]) => [sum[0] + latitude, sum[1] + longitude],
        [0, 0],
    );

    return [total[0] / outline.length, total[1] / outline.length];
}

export interface CityCluster {
    key: string;
    latitude: number;
    longitude: number;
    count: number;
    /** Raio que cobre os chamados do grupo, em metros. */
    radiusMeters: number;
}

export interface CityAggregation {
    clusters: CityCluster[];
    maxCount: number;
}

function distanceMeters(latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number): number {
    const northing = (latitudeA - latitudeB) * METERS_PER_DEGREE_LATITUDE;
    const scale = Math.max(Math.cos((latitudeA * Math.PI) / 180), 0.2);
    const easting = (longitudeA - longitudeB) * METERS_PER_DEGREE_LATITUDE * scale;
    return Math.hypot(northing, easting);
}

/**
 * Distancia de juncao dos grupos: e o que define o que conta como "uma cidade".
 *
 * 12 km mantem uma capital num circulo so e ainda separa municipio vizinho da
 * regiao metropolitana. Medido na base de demonstracao: 39 circulos, com Sao
 * Paulo em um de 13 km de raio.
 *
 * Era um controle de tres niveis (4, 12 e 30 km) na legenda. Saiu porque a
 * pergunta da tela e "em que cidade esta concentrado", e para ela existe uma
 * resposta certa - as outras duas escalas produziam recortes que ninguem pediu e
 * so davam o que errar na hora de ler o mapa.
 */
export const CITY_JOIN_METERS = 12_000;

/** Raio minimo do circulo, para cidade com um chamado so nao virar um ponto. */
const MIN_CITY_RADIUS_METERS = 1200;

/**
 * Agrupa chamados por proximidade, um grupo por mancha urbana.
 *
 * Guloso e de uma passada: cada chamado entra no grupo mais proximo dentro de
 * `joinMeters`, ou abre um grupo novo. Depende da ordem da lista, o que aqui nao
 * pesa - o que muda entre duas ordens e qual ponto virou semente, nao onde a
 * concentracao esta.
 */
export function clusterCities(
    protocols: GeoLocatableProtocol[],
    joinMeters: number = CITY_JOIN_METERS,
): CityAggregation {
    const clusters: { latitude: number; longitude: number; count: number; members: [number, number][] }[] = [];

    protocols.forEach((protocol) => {
        const position = getMarkerPosition(protocol);
        if (!position) return;

        let nearest: typeof clusters[number] | null = null;
        let nearestDistance = Number.POSITIVE_INFINITY;

        clusters.forEach((cluster) => {
            const distance = distanceMeters(position[0], position[1], cluster.latitude, cluster.longitude);
            if (distance <= joinMeters && distance < nearestDistance) {
                nearest = cluster;
                nearestDistance = distance;
            }
        });

        if (!nearest) {
            clusters.push({ latitude: position[0], longitude: position[1], count: 1, members: [position] });
            return;
        }

        // Centro movel: a media dos membros, atualizada a cada entrada.
        const target = nearest as typeof clusters[number];
        target.members.push(position);
        target.count += 1;
        target.latitude += (position[0] - target.latitude) / target.count;
        target.longitude += (position[1] - target.longitude) / target.count;
    });

    const result = clusters.map((cluster, index) => {
        const spread = cluster.members.reduce((furthest, [latitude, longitude]) => Math.max(
            furthest,
            distanceMeters(latitude, longitude, cluster.latitude, cluster.longitude),
        ), 0);

        return {
            key: `city-${index}`,
            latitude: cluster.latitude,
            longitude: cluster.longitude,
            count: cluster.count,
            radiusMeters: Math.max(MIN_CITY_RADIUS_METERS, Math.round(spread * 1.15)),
        };
    }).sort((first, second) => first.count - second.count);

    return {
        clusters: result,
        maxCount: result.reduce((max, cluster) => Math.max(max, cluster.count), 0),
    };
}
