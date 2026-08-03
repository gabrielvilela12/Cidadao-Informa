import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ESTADOS_BRASIL } from '../data/estados-brasil';
import {
    aggregateByState,
    CITY_JOIN_METERS,
    clusterCities,
    findState,
    insideState,
} from '../utils/regions';

/**
 * Agregacao por recorte administrativo (estado e cidade) do mapa de calor.
 */

/** Uma capital por UF: se a simplificacao do contorno distorcer uma fronteira
 *  ao ponto de trocar a UF de uma capital, e aqui que aparece. */
const CAPITALS: [string, number, number][] = [
    ['AC', -9.9754, -67.8249], ['AL', -9.6658, -35.7353], ['AM', -3.119, -60.0217],
    ['AP', 0.0349, -51.0694], ['BA', -12.9777, -38.5016], ['CE', -3.7319, -38.5267],
    ['DF', -15.7939, -47.8828], ['ES', -20.3155, -40.3128], ['GO', -16.6869, -49.2648],
    ['MA', -2.5307, -44.3068], ['MG', -19.9167, -43.9345], ['MS', -20.4697, -54.6201],
    ['MT', -15.6014, -56.0979], ['PA', -1.4558, -48.4902], ['PB', -7.1195, -34.845],
    ['PE', -8.0476, -34.877], ['PI', -5.0892, -42.8019], ['PR', -25.4284, -49.2733],
    ['RJ', -22.9068, -43.1729], ['RN', -5.7945, -35.211], ['RO', -8.7619, -63.9039],
    ['RR', 2.8235, -60.6758], ['RS', -30.0346, -51.2177], ['SC', -27.5954, -48.548],
    ['SE', -10.9472, -37.0731], ['SP', -23.5505, -46.6333], ['TO', -10.1689, -48.3317],
];

const at = (latitude: number, longitude: number) => ({ latitude, longitude });

describe('contorno dos estados', () => {
    it('traz as 27 unidades federativas', () => {
        expect(ESTADOS_BRASIL).toHaveLength(27);
        expect(new Set(ESTADOS_BRASIL.map((state) => state.uf)).size).toBe(27);
    });

    it('testa o Distrito Federal antes de Goiás', () => {
        // O DF e um enclave e o contorno de GO nesta fonte nao traz o buraco
        // correspondente. Quem procura o estado para na primeira
        // correspondencia, entao a ordem da lista e o que impede Brasilia de
        // virar Goias.
        const df = ESTADOS_BRASIL.findIndex((state) => state.uf === 'DF');
        const go = ESTADOS_BRASIL.findIndex((state) => state.uf === 'GO');
        expect(df).toBeLessThan(go);
    });

    it('tem caixa envolvente coerente com o contorno', () => {
        ESTADOS_BRASIL.forEach((state) => {
            const [south, west, north, east] = state.box;
            expect(north).toBeGreaterThan(south);
            expect(east).toBeGreaterThan(west);

            state.parts.flat().flat().forEach(([latitude, longitude]) => {
                expect(latitude).toBeGreaterThanOrEqual(south);
                expect(latitude).toBeLessThanOrEqual(north);
                expect(longitude).toBeGreaterThanOrEqual(west);
                expect(longitude).toBeLessThanOrEqual(east);
            });
        });
    });
});

describe('em que estado a coordenada cai', () => {
    it.each(CAPITALS)('acha %s pela capital', (uf, latitude, longitude) => {
        expect(findState(latitude, longitude, ESTADOS_BRASIL)?.uf).toBe(uf);
    });

    it('não coloca a capital em nenhum outro estado', () => {
        CAPITALS.forEach(([uf, latitude, longitude]) => {
            const hits = ESTADOS_BRASIL.filter((state) => insideState(latitude, longitude, state));
            // Brasilia e a excecao conhecida: cai dentro do desenho de Goias
            // tambem, porque o contorno da fonte nao tem o enclave vazado.
            if (uf === 'DF') expect(hits.map((state) => state.uf)).toContain('DF');
            else expect(hits.map((state) => state.uf)).toEqual([uf]);
        });
    });

    it('devolve null no meio do Atlântico', () => {
        expect(findState(-20, -25, ESTADOS_BRASIL)).toBeNull();
        expect(findState(-34, -60, ESTADOS_BRASIL)).toBeNull();
    });

    it('encosta no estado mais próximo quando o litoral simplificado deixa o ponto fora', () => {
        // O contorno embarcado e aproximado em ~1,7 km, e o litoral e recortado:
        // ponto em terra numa ponta ou baia cortada cai fora do poligono. Sem
        // esta tolerancia, chamado de endereco no continente ficava sem estado.
        const aLesteDoRio = at(-22.96, -43.05);
        expect(insideState(aLesteDoRio.latitude, aLesteDoRio.longitude, ESTADOS_BRASIL.find((s) => s.uf === 'RJ')!)
            || findState(aLesteDoRio.latitude, aLesteDoRio.longitude, ESTADOS_BRASIL)?.uf === 'RJ').toBe(true);
    });

    it('não encosta em estado nenhum quando a tolerância é desligada e o ponto está longe', () => {
        expect(findState(-20, -25, ESTADOS_BRASIL, 0)).toBeNull();
    });
});

describe('contagem por estado', () => {
    it('não perde chamado entre estados e fora do território', () => {
        const protocols = [
            at(-23.55, -46.63), at(-23.56, -46.64), at(-15.79, -47.88), at(-20, -25),
        ];
        const result = aggregateByState(protocols, ESTADOS_BRASIL);
        const counted = result.tallies.reduce((total, tally) => total + tally.count, 0);

        expect(counted + result.outside).toBe(protocols.length);
        expect(result.outside).toBe(1);
    });

    it('não pinta estado sem chamado', () => {
        // Cobrir as 27 UFs encheria o mapa de area fria e esconderia onde ha
        // demanda: a ausencia de cor ja diz "nenhum chamado aqui".
        const result = aggregateByState([at(-23.55, -46.63)], ESTADOS_BRASIL);
        expect(result.tallies).toHaveLength(1);
        expect(result.tallies[0].state.uf).toBe('SP');
    });

    it('ordena crescente, para o rótulo do estado quente ficar por cima', () => {
        const protocols = [
            at(-23.55, -46.63), at(-23.56, -46.64), at(-23.57, -46.65), at(-15.79, -47.88),
        ];
        const result = aggregateByState(protocols, ESTADOS_BRASIL);

        expect(result.tallies.map((tally) => tally.count)).toEqual([1, 3]);
        expect(result.maxCount).toBe(3);
    });

    it('ancora o rótulo dentro do próprio estado', () => {
        // O centro da caixa envolvente cairia na agua em estado com ilha.
        const protocols = ESTADOS_BRASIL.map((state) => {
            const [latitude, longitude] = state.parts[0][0][0];
            return at(latitude, longitude);
        });
        const result = aggregateByState(protocols, ESTADOS_BRASIL);

        result.tallies.forEach((tally) => {
            const [latitude, longitude] = tally.labelPosition;
            expect(findState(latitude, longitude, ESTADOS_BRASIL)?.uf).toBe(tally.state.uf);
        });
    });

    it('não quebra com base vazia', () => {
        expect(aggregateByState([], ESTADOS_BRASIL).tallies).toHaveLength(0);
    });
});

describe('agrupamento por cidade', () => {
    it('junta o que está perto num círculo só', () => {
        const protocols = Array.from({ length: 20 }, (_, index) => at(-23.55 + index * 0.002, -46.63));
        const { clusters, maxCount } = clusterCities(protocols);

        expect(clusters).toHaveLength(1);
        expect(maxCount).toBe(20);
    });

    it('separa cidades distantes', () => {
        const { clusters } = clusterCities([at(-23.55, -46.63), at(-22.9, -43.17), at(-15.79, -47.88)]);
        expect(clusters).toHaveLength(3);
    });

    it('não perde chamado no agrupamento', () => {
        const protocols = [
            ...Array.from({ length: 15 }, (_, index) => at(-23.55 + index * 0.003, -46.63)),
            ...Array.from({ length: 7 }, (_, index) => at(-22.9 + index * 0.003, -43.17)),
        ];
        const { clusters } = clusterCities(protocols);

        expect(clusters.reduce((total, cluster) => total + cluster.count, 0)).toBe(protocols.length);
    });

    it('usa a distância fixa do módulo, sem controle na tela', () => {
        expect(CITY_JOIN_METERS).toBe(12_000);
    });

    it('agrupa em menos círculos quando a distância aumenta', () => {
        const protocols = Array.from({ length: 40 }, (_, index) => at(-23.55 + index * 0.03, -46.63));
        expect(clusterCities(protocols, 30_000).clusters.length)
            .toBeLessThan(clusterCities(protocols, 4000).clusters.length);
    });

    it('dá raio mínimo à cidade com um chamado só, para não virar um ponto', () => {
        const { clusters } = clusterCities([at(-23.55, -46.63)]);
        expect(clusters[0].radiusMeters).toBeGreaterThanOrEqual(1200);
    });

    it('cobre a extensão dos chamados do grupo', () => {
        // ~3,3 km de espalhamento em latitude: o raio tem de alcancar a ponta.
        const protocols = Array.from({ length: 10 }, (_, index) => at(-23.55 + index * 0.003, -46.63));
        const { clusters } = clusterCities(protocols);

        expect(clusters[0].radiusMeters).toBeGreaterThan(1400);
        expect(clusters[0].radiusMeters).toBeLessThan(6000);
    });

    it('ordena crescente, como a camada de estado', () => {
        const protocols = [
            ...Array.from({ length: 9 }, (_, index) => at(-23.55 + index * 0.002, -46.63)),
            at(-22.9, -43.17),
        ];
        const { clusters } = clusterCities(protocols);

        expect(clusters.map((cluster) => cluster.count)).toEqual([1, 9]);
    });

    it('ignora chamado sem coordenada', () => {
        const { clusters } = clusterCities([
            at(-23.55, -46.63),
            { latitude: null, longitude: null },
        ]);

        expect(clusters).toHaveLength(1);
        expect(clusters[0].count).toBe(1);
    });
});

/**
 * Conferencia contra a base de demonstracao, quando ela estiver gerada.
 *
 * Vale mais que qualquer coordenada escolhida a mao: cada chamado do seed traz a
 * UF escrita no endereco, entao da para checar a deducao geometrica contra o
 * texto, em centenas de casos de uma vez.
 */
const SEED = 'supabase/seed/demo-dados.sql';

describe.skipIf(!existsSync(SEED))('base de demonstração como fixture', () => {
    const sql = existsSync(SEED) ? readFileSync(SEED, 'utf8') : '';
    const rows = [...sql.matchAll(/ - ([^'/]+)\/([A-Z]{2})'.*?, (-?\d+\.\d+), (-?\d+\.\d+)\)/g)]
        .map((match) => ({
            city: match[1],
            uf: match[2],
            latitude: Number(match[3]),
            longitude: Number(match[4]),
        }));

    it('extrai centenas de endereços com UF e coordenada', () => {
        expect(rows.length).toBeGreaterThan(400);
    });

    it('deduz da coordenada a mesma UF escrita no endereço, em todos', () => {
        const wrong = rows
            .filter((row) => findState(row.latitude, row.longitude, ESTADOS_BRASIL)?.uf !== row.uf)
            .map((row) => `${row.city}/${row.uf}`);

        expect(wrong).toEqual([]);
    });

    it('não deixa nenhum chamado fora do território', () => {
        expect(aggregateByState(rows, ESTADOS_BRASIL).outside).toBe(0);
    });

    it('mantém cada capital grande num círculo só', () => {
        const { clusters } = clusterCities(rows);
        expect(clusters.filter((cluster) => cluster.count >= 60).length).toBeGreaterThanOrEqual(3);
    });

    it('conserva a contagem total no agrupamento por cidade', () => {
        const { clusters } = clusterCities(rows);
        expect(clusters.reduce((total, cluster) => total + cluster.count, 0)).toBe(rows.length);
    });
});
