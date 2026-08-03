import { describe, expect, it } from 'vitest';
import {
    buildHeatPoints,
    heatAlphaLut,
    heatColorAt,
    heatColorLut,
    heatDensityAnchor,
    heatRadiusPixels,
    heatRedThreshold,
    heatUnitAlpha,
    HEAT_CONTROLS,
    metersPerPixel,
} from '../utils/heatmap';

/**
 * Camada de calor do Mapa Estrategico.
 *
 * Os testes aqui travam decisoes que ja foram erradas uma vez, e cada bloco diz
 * qual: normalizacao pela coordenada em vez da vizinhanca (mapa todo vermelho),
 * legenda anunciando um limiar que a escala nao alcanca, e raio em pixel fixo.
 */

const AZUL = 'rgb(19, 81, 180)';
const CIANO = 'rgb(6, 182, 212)';
const VERMELHO = 'rgb(229, 34, 7)';

const at = (latitude: number | null, longitude: number | null) => ({ latitude, longitude });

describe('escala de cor', () => {
    it('vai do azul institucional ao vermelho institucional', () => {
        expect(heatColorAt(0, 'region')).toBe(AZUL);
        expect(heatColorAt(1, 'region')).toBe(VERMELHO);
    });

    it('prende nos extremos fora da faixa 0-1', () => {
        expect(heatColorAt(-3, 'region')).toBe(heatColorAt(0, 'region'));
        expect(heatColorAt(9, 'region')).toBe(heatColorAt(1, 'region'));
    });

    it('espalha as cores por igual no recorte por região', () => {
        // Cada estado ou cidade e um valor discreto: um platao desperdicaria
        // faixa e achataria a diferenca entre as regioes de pouca demanda.
        expect(heatColorAt(0.2, 'region')).toBe(CIANO);
        expect(heatColorAt(0.1, 'region')).not.toBe(AZUL);
    });

    it('mantém um platô azul no gradiente, que é o halo de borda definida', () => {
        expect(heatColorAt(0, 'gradient')).toBe(AZUL);
        expect(heatColorAt(0.1, 'gradient')).toBe(AZUL);
        expect(heatColorAt(0.21, 'gradient')).toBe(AZUL);
        expect(heatColorAt(0.3, 'gradient')).not.toBe(AZUL);
    });
});

describe('tabelas de cor e opacidade do canvas', () => {
    const colors = heatColorLut();
    const alphas = heatAlphaLut();

    it('tem uma cor por nível de intensidade', () => {
        expect(colors).toHaveLength(256 * 3);
        expect(alphas).toHaveLength(256);
    });

    it('chega em cada cor declarada no stop correspondente', () => {
        const HUES: [number, number, number][] = [
            [19, 81, 180], [6, 182, 212], [34, 197, 94], [250, 204, 21], [249, 115, 22], [229, 34, 7],
        ];
        const STOPS = [0.22, 0.42, 0.58, 0.74, 0.88, 1];

        STOPS.forEach((stop, index) => {
            const offset = Math.round(stop * 255) * 3;
            HUES[index].forEach((channel, position) => {
                expect(Math.abs(colors[offset + position] - channel)).toBeLessThanOrEqual(2);
            });
        });
    });

    it('interpola sem salto de cor', () => {
        for (let index = 1; index < 256; index += 1) {
            for (let channel = 0; channel < 3; channel += 1) {
                const step = Math.abs(colors[index * 3 + channel] - colors[(index - 1) * 3 + channel]);
                expect(step).toBeLessThanOrEqual(12);
            }
        }
    });

    it('começa transparente para a borda da mancha não serrilhar', () => {
        expect(alphas[0]).toBe(0);
        expect(alphas[5]).toBeLessThan(255);
    });

    it('fica opaca logo depois da borda', () => {
        // A translucidez sobre o mapa vem do slider da camada, nao da
        // intensidade: e o que da a borda definida do visual classico.
        expect(alphas[10]).toBe(255);
        expect(alphas[255]).toBe(255);
    });

    it('nunca decresce', () => {
        alphas.forEach((value, index) => {
            if (index > 0) expect(value).toBeGreaterThanOrEqual(alphas[index - 1]);
        });
    });
});

describe('escala do mapa e raio de influência', () => {
    it('dobra a escala a cada nível de zoom', () => {
        expect(metersPerPixel(-15, 12) / metersPerPixel(-15, 13)).toBeCloseTo(2, 9);
    });

    it('tem escala plausível no zoom de cidade', () => {
        expect(metersPerPixel(-15.79, 13)).toBeGreaterThan(15);
        expect(metersPerPixel(-15.79, 13)).toBeLessThan(21);
    });

    it('cresce na tela conforme aproxima, porque o raio vale em metros', () => {
        // Raio em pixel fixo mudaria a area representada a cada zoom, e a
        // leitura deixaria de significar a mesma coisa.
        expect(heatRadiusPixels(420, -15.79, 16)).toBeGreaterThan(heatRadiusPixels(420, -15.79, 13));
    });

    it('respeita piso e teto para não desaparecer nem lavar a tela', () => {
        expect(heatRadiusPixels(420, -15.79, 4)).toBe(10);
        expect(heatRadiusPixels(420, -15.79, 20)).toBe(140);
    });
});

describe('agrupamento de pontos por coordenada', () => {
    it('junta protocolos na mesma coordenada num ponto com peso', () => {
        const result = buildHeatPoints([
            at(-15.7942, -47.8822), at(-15.7942, -47.8822), at(-15.7942, -47.8822),
            at(-15.8, -47.9),
        ]);

        expect(result.points).toHaveLength(2);
        expect(Math.max(...result.points.map((point) => point.weight))).toBe(3);
    });

    it('ignora coordenada ausente, (0,0) e valor fora de faixa', () => {
        const result = buildHeatPoints([
            at(-15.7942, -47.8822), at(null, null), at(0, 0), at(-15.9, 200),
        ]);

        expect(result.plotted).toBe(1);
    });

    it('conserva a contagem na soma dos pesos', () => {
        const result = buildHeatPoints([
            at(-15.7942, -47.8822), at(-15.7942, -47.8822), at(-15.8, -47.9),
        ]);

        expect(result.points.reduce((total, point) => total + point.weight, 0)).toBe(result.plotted);
    });

    it('não quebra com base vazia', () => {
        expect(buildHeatPoints([]).points).toHaveLength(0);
    });
});

describe('âncora de densidade', () => {
    it('mede a vizinhança, e não o peso da coordenada', () => {
        // O defeito que isto trava: normalizar pelo peso da coordenada. Como
        // quase todo chamado chega com GPS proprio, o maior peso e 1, e a
        // normalizacao pintava cada ponto isolado como se fosse o pico da
        // cidade - o mapa inteiro saia vermelho.
        const aglomerado = Array.from({ length: 12 }, (_, index) => at(-15.7942 + index * 0.0001, -47.8822 + index * 0.0001));
        const distante = [at(-15.9, -47.95), at(-15.9002, -47.9502)];
        const { points } = buildHeatPoints([...aglomerado, ...distante]);

        expect(heatDensityAnchor(points, 400)).toBe(12);
    });

    it('conta a coordenada repetida como vários chamados', () => {
        const { points } = buildHeatPoints(Array.from({ length: 8 }, () => at(-15.7942, -47.8822)));
        expect(heatDensityAnchor(points, 400)).toBe(8);
    });

    it('enxerga menos vizinhos com raio menor', () => {
        const { points } = buildHeatPoints(
            Array.from({ length: 12 }, (_, index) => at(-15.7942 + index * 0.0002, -47.8822)),
        );
        expect(heatDensityAnchor(points, 50)).toBeLessThan(heatDensityAnchor(points, 400));
    });

    it('não vira mapa de focos com a base toda espalhada', () => {
        const { points } = buildHeatPoints(
            Array.from({ length: 30 }, (_, index) => at(-15.79 + index * 0.05, -47.88)),
        );
        expect(heatDensityAnchor(points, 400)).toBe(2);
    });

    it('devolve zero sem pontos', () => {
        expect(heatDensityAnchor([], 400)).toBe(0);
    });
});

describe('faixa útil da escala', () => {
    /** A intensidade acumula por composicao: n chamados chegam a 1-(1-a)^n. */
    const accumulated = (unitAlpha: number, count: number) => 1 - (1 - unitAlpha) ** count;

    it.each([3, 10, 27, 200])('âncora %i: chamado isolado fica na faixa fria', (anchor) => {
        const unit = heatUnitAlpha(anchor);
        expect(heatColorAt(accumulated(unit, 1), 'gradient')).toBe(AZUL);
    });

    it.each([3, 10, 27, 200])('âncora %i: o limiar anunciado é onde a escala chega ao topo', (anchor) => {
        // A promessa da legenda ("vermelho = N+ chamados no raio") tem de ser
        // exatamente onde a cor satura, nem antes nem depois.
        const unit = heatUnitAlpha(anchor);
        const threshold = heatRedThreshold(unit);

        expect(accumulated(unit, threshold)).toBeGreaterThanOrEqual(0.97 - 1e-6);
        if (threshold > 1) expect(accumulated(unit, threshold - 1)).toBeLessThan(0.97);
    });

    it('anuncia limiar acima da âncora quando a base é pequena', () => {
        // Com ancora baixa o teto da opacidade trava a escala no laranja.
        // Anunciar a ancora seria prometer vermelho onde o mapa pinta verde.
        expect(heatRedThreshold(heatUnitAlpha(3))).toBeGreaterThan(3);
    });

    it('anuncia a própria âncora quando nada trava a escala', () => {
        expect(heatRedThreshold(heatUnitAlpha(27))).toBe(27);
    });

    it('nunca deixa um chamado isolado sair da faixa fria', () => {
        expect(heatUnitAlpha(2)).toBeLessThanOrEqual(0.21);
        expect(heatUnitAlpha(0)).toBeGreaterThan(0);
        expect(heatUnitAlpha(1)).toBeGreaterThan(0);
    });
});

describe('limites dos controles', () => {
    it('tem padrão dentro dos limites e alinhado ao passo', () => {
        Object.values(HEAT_CONTROLS).forEach((bounds) => {
            expect(bounds.default).toBeGreaterThanOrEqual(bounds.min);
            expect(bounds.default).toBeLessThanOrEqual(bounds.max);
            expect((bounds.default - bounds.min) % bounds.step).toBe(0);
        });
    });
});
