/**
 * Densidade geografica de chamados para a camada de calor do Mapa Estrategico.
 *
 * Duas leituras da mesma base, escolhidas pelo admin:
 *  - gradiente: acumulo continuo de intensidade em volta de cada coordenada,
 *    que responde "onde esta quente" antes de qualquer numero ser lido;
 *  - grade: celulas de tamanho fixo em metros com a contagem exata dentro,
 *    para quando a pergunta e "quantos chamados nesta area".
 *
 * A posicao vem sempre de getMarkerPosition, ou seja, da coordenada que o
 * solicitante confirmou. Protocolo sem coordenada fica fora da conta e e
 * reportado a parte na legenda: um mapa de calor que descarta parte da base em
 * silencio faz parecer que a demanda esta onde ela apenas foi geolocalizada.
 */

import { getMarkerPosition, type GeoLocatableProtocol } from './mapUtils';

const METERS_PER_DEGREE_LATITUDE = 111_320;

/** Metros por pixel no zoom 0, no equador (Web Mercator, tile de 256px). */
const METERS_PER_PIXEL_AT_ZOOM_ZERO = 156_543.03392;

/** ~1 m de resolucao: agrupa protocolos abertos no mesmo ponto. */
const COORDINATE_PRECISION = 5;

/**
 * Sequencia de cores da escala, do frio ao quente. As duas visualizacoes usam
 * as mesmas seis cores - o que muda e onde cada uma entra (HEAT_STOPS).
 */
const HEAT_HUES: [number, number, number][] = [
    [19, 81, 180],   // #1351B4 azul institucional
    [6, 182, 212],   // #06B6D4 ciano
    [34, 197, 94],   // #22C55E verde
    [250, 204, 21],  // #FACC15 amarelo
    [249, 115, 22],  // #F97316 laranja
    [229, 34, 7],    // #E52207 vermelho institucional
];

export type HeatScale = 'gradient' | 'grid';

/**
 * Onde cada cor entra, por visualizacao.
 *
 * gradiente: o azul ocupa toda a faixa abaixo do primeiro stop, e nao se
 * dissolve no mapa - e o que forma o halo frio de contorno definido em volta de
 * cada mancha, separando na hora "tem chamado aqui" de "aqui esta quente". O
 * platao e mais estreito que o do leaflet.heat (0.4) porque com dado real a
 * distribuicao e torta: a maioria das areas tem poucos chamados, e um platao
 * largo pintaria quase o mapa inteiro de azul chapado.
 *
 * grade: as cores se distribuem por igual, porque cada celula e um valor
 * discreto - um platao no azul desperdicaria 40% da escala e achataria a
 * diferenca entre celulas de pouca demanda.
 */
const HEAT_STOPS: Record<HeatScale, number[]> = {
    gradient: [0.22, 0.42, 0.58, 0.74, 0.88, 1],
    grid: [0, 0.2, 0.4, 0.6, 0.8, 1],
};

/**
 * Escalas arco-iris nao tem luminosidade monotona, e por isso podem sugerir
 * fronteiras que nao existem nos dados (o salto para o amarelo chama mais
 * atencao que a diferenca real de contagem). Foi mantida por ser a convencao
 * que o servidor le sem legenda - "vermelho e onde doi" - e o risco esta
 * coberto de outro jeito: a grade escreve a contagem dentro de cada celula e a
 * legenda mostra os extremos numericos, entao a cor nunca e o unico portador do
 * dado.
 */
function interpolate(ratio: number, scale: HeatScale): [number, number, number] {
    const stops = HEAT_STOPS[scale];
    const clamped = Math.min(1, Math.max(0, ratio));
    const upperIndex = stops.findIndex((stop) => stop >= clamped);

    // Abaixo do primeiro stop a escala nao interpola: fica na cor mais fria.
    if (upperIndex <= 0) return HEAT_HUES[0];

    const lower = HEAT_HUES[upperIndex - 1];
    const upper = HEAT_HUES[upperIndex];
    const span = stops[upperIndex] - stops[upperIndex - 1];
    const position = span > 0 ? (clamped - stops[upperIndex - 1]) / span : 0;

    return [
        Math.round(lower[0] + (upper[0] - lower[0]) * position),
        Math.round(lower[1] + (upper[1] - lower[1]) * position),
        Math.round(lower[2] + (upper[2] - lower[2]) * position),
    ];
}

/** Cor da escala para uma intensidade relativa (0 = frio, 1 = quente). */
export function heatColorAt(ratio: number, scale: HeatScale = 'grid'): string {
    const [red, green, blue] = interpolate(ratio, scale);
    return `rgb(${red}, ${green}, ${blue})`;
}

/** A escala como gradiente CSS, para a barra da legenda. */
export function heatScaleCss(scale: HeatScale): string {
    const stops = HEAT_STOPS[scale];
    const steps = [0, ...stops].map((stop) => `${heatColorAt(stop, scale)} ${Math.round(stop * 100)}%`);
    return `linear-gradient(to right, ${steps.join(', ')})`;
}

/**
 * Tabela de 256 cores da escala do gradiente, indexada pela intensidade
 * acumulada no canvas. Evita reinterpolar a escala por pixel a cada quadro.
 */
export function heatColorLut(): Uint8ClampedArray {
    const lut = new Uint8ClampedArray(256 * 3);

    for (let intensity = 0; intensity < 256; intensity += 1) {
        const [red, green, blue] = interpolate(intensity / 255, 'gradient');
        lut[intensity * 3] = red;
        lut[intensity * 3 + 1] = green;
        lut[intensity * 3 + 2] = blue;
    }

    return lut;
}

/** Intensidade a partir da qual a mancha e opaca. */
const EDGE_INTENSITY = 10;

/**
 * Opacidade final por intensidade acumulada.
 *
 * A mancha e opaca em quase toda a extensao, e a translucidez sobre o mapa vem
 * de um controle unico da camada inteira (o slider de opacidade). E o que da a
 * borda definida do visual classico: se a opacidade acompanhasse a intensidade,
 * a mancha se dissolveria no basemap e o contorno azul desapareceria.
 *
 * A rampa curta no inicio existe so para nao serrilhar essa borda; comeca em
 * zero porque um piso transformaria cada ponto num disco de contorno duro.
 */
export function heatAlphaLut(): Uint8ClampedArray {
    const lut = new Uint8ClampedArray(256);

    for (let intensity = 0; intensity < 256; intensity += 1) {
        lut[intensity] = intensity >= EDGE_INTENSITY
            ? 255
            : Math.round((intensity / EDGE_INTENSITY) * 255);
    }

    return lut;
}

/** Escala do mapa na latitude e zoom informados. */
export function metersPerPixel(latitude: number, zoom: number): number {
    const latitudeScale = Math.max(Math.cos((latitude * Math.PI) / 180), 0.2);
    return (METERS_PER_PIXEL_AT_ZOOM_ZERO * latitudeScale) / 2 ** zoom;
}

/**
 * Raio de influencia em pixels. O raio e definido em metros para que a mancha
 * signifique sempre a mesma area no chao: ao dar zoom a mancha cresce na tela e
 * a leitura continua valendo. Os limites evitam pontos invisiveis no zoom de
 * pais e uma tela inteira lavada no zoom de rua.
 */
export function heatRadiusPixels(radiusMeters: number, latitude: number, zoom: number): number {
    const raw = radiusMeters / metersPerPixel(latitude, zoom);
    return Math.min(140, Math.max(10, raw));
}

export interface WeightedHeatPoint {
    latitude: number;
    longitude: number;
    /** Quantos protocolos estao exatamente nesta coordenada. */
    weight: number;
}

export interface HeatPointsResult {
    points: WeightedHeatPoint[];
    /** Protocolos que entraram no calculo. */
    plotted: number;
}

/**
 * Agrupa protocolos por coordenada. Sem isso, dez chamados no mesmo endereco
 * empilhariam dez manchas identicas e o desenho ficaria refem da ordem de
 * pintura em vez da contagem.
 */
export function buildHeatPoints(protocols: GeoLocatableProtocol[]): HeatPointsResult {
    const groups = new Map<string, WeightedHeatPoint>();
    let plotted = 0;

    protocols.forEach((protocol) => {
        const position = getMarkerPosition(protocol);
        if (!position) return;

        plotted += 1;
        const key = `${position[0].toFixed(COORDINATE_PRECISION)},${position[1].toFixed(COORDINATE_PRECISION)}`;
        const existing = groups.get(key);

        if (existing) {
            existing.weight += 1;
            return;
        }

        groups.set(key, { latitude: position[0], longitude: position[1], weight: 1 });
    });

    return { points: [...groups.values()], plotted };
}

/** Acima disto, a varredura de densidade anda de N em N pontos. */
const DENSITY_SAMPLE_LIMIT = 3000;

/**
 * Percentil das densidades que recebe o topo da escala.
 *
 * Ancorar no maximo absoluto entrega o mapa a um outlier: um unico ponto com
 * densidade tres vezes maior que a segunda colocada empurra todo o resto para a
 * faixa fria, e o mapa fica azul chapado com uma mancha vermelha. No percentil
 * 90, as areas do decil mais quente chegam ao vermelho - inclusive o outlier,
 * que satura - e a escala inteira volta a ser usada.
 */
const DENSITY_ANCHOR_PERCENTILE = 0.9;

/**
 * Quantos chamados a area do decil mais denso concentra dentro de um raio.
 *
 * E o denominador do gradiente. O peso de uma coordenada (protocolos abertos no
 * mesmo ponto) nao serve para isso: como quase todo chamado chega com GPS
 * proprio, o maior peso e 1 quase sempre, e normalizar por ele pintaria cada
 * ponto isolado como se fosse o pico da cidade. Densidade e uma propriedade da
 * vizinhanca, nao da coordenada.
 *
 * Com bases grandes a varredura anda por amostragem: e uma constante de
 * normalizacao, e o percentil de uma amostra de 3000 pontos fica a poucos
 * chamados do real - enquanto a varredura completa em base de dezenas de
 * milhares travaria a troca de filtro.
 */
export function heatDensityAnchor(points: WeightedHeatPoint[], radiusMeters: number): number {
    if (!points.length) return 0;

    const referenceLatitude = points.reduce((total, point) => total + point.latitude, 0) / points.length;
    const longitudeScale = Math.max(Math.cos((referenceLatitude * Math.PI) / 180), 0.2);
    const latitudeStep = radiusMeters / METERS_PER_DEGREE_LATITUDE;
    const longitudeStep = radiusMeters / (METERS_PER_DEGREE_LATITUDE * longitudeScale);

    // Celulas do tamanho do raio: os vizinhos de um ponto estao, no maximo, na
    // celula adjacente.
    const buckets = new Map<string, WeightedHeatPoint[]>();
    points.forEach((point) => {
        const key = `${Math.floor(point.latitude / latitudeStep)}:${Math.floor(point.longitude / longitudeStep)}`;
        const bucket = buckets.get(key);
        if (bucket) {
            bucket.push(point);
            return;
        }
        buckets.set(key, [point]);
    });

    const stride = Math.max(1, Math.ceil(points.length / DENSITY_SAMPLE_LIMIT));
    const squaredRadius = radiusMeters * radiusMeters;
    const densities: number[] = [];

    for (let index = 0; index < points.length; index += stride) {
        const point = points[index];
        const row = Math.floor(point.latitude / latitudeStep);
        const column = Math.floor(point.longitude / longitudeStep);
        let total = 0;

        for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
            for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
                const bucket = buckets.get(`${row + rowOffset}:${column + columnOffset}`);
                if (!bucket) continue;

                bucket.forEach((other) => {
                    const northing = (other.latitude - point.latitude) * METERS_PER_DEGREE_LATITUDE;
                    const easting = (other.longitude - point.longitude) * METERS_PER_DEGREE_LATITUDE * longitudeScale;
                    if (northing * northing + easting * easting <= squaredRadius) total += other.weight;
                });
            }
        }

        densities.push(total);
    }

    densities.sort((first, second) => first - second);
    const position = Math.floor((densities.length - 1) * DENSITY_ANCHOR_PERCENTILE);

    // Piso 2: com uma base toda espalhada, ancorar em 1 faria de cada ponto
    // isolado um foco vermelho.
    return Math.max(2, densities[position]);
}

/** Onde a escala termina: 0.97 de intensidade e vermelho pleno. */
const PEAK_INTENSITY = 0.97;

/**
 * Contribuicao de opacidade de um unico chamado.
 *
 * A intensidade acumula por composicao, nao por soma: n chamados sobrepostos
 * chegam a 1 - (1 - a)^n. Entao `a` sai invertendo essa conta na ancora, para
 * que a area do decil mais denso termine em vermelho e a escala seja usada por
 * inteiro.
 *
 * O teto de 0.2 garante que um chamado sozinho fique sempre na faixa fria (o
 * gradiente so sai do azul acima de 0.22): em base pequena, onde a ancora e 3 ou
 * 4, sem o teto um ponto isolado apareceria verde. O preco e que abaixo de ~14
 * de ancora a escala para no laranja em vez do vermelho - o certo nessa troca,
 * porque uma base pequena nao tem hotspot para anunciar.
 *
 * O piso mantem visivel o ponto isolado de uma base enorme. Fica baixo (0.012, ~3
 * de 255) porque a visibilidade nao depende dele: a opacidade final tem borda
 * dura, e qualquer intensidade acima de zero ja aparece. Um piso alto custaria
 * caro do outro lado - comprimiria o topo, e metade da ancora pintaria quase tao
 * quente quanto a ancora inteira.
 */
export function heatUnitAlpha(anchor: number): number {
    if (anchor <= 1) return 0.2;
    const exact = 1 - (1 - PEAK_INTENSITY) ** (1 / anchor);
    return Math.min(0.2, Math.max(0.012, exact));
}

/**
 * Quantos chamados no raio de influencia sao necessarios para a area chegar ao
 * topo da escala. E a inversa de heatUnitAlpha, e e o numero que a legenda
 * anuncia.
 *
 * Existe porque a ancora nao serve para isso quando o teto ou o piso de
 * heatUnitAlpha entram em acao: com ancora 3, a opacidade fica travada no teto e
 * a escala para no verde, entao anunciar "vermelho = 3+ chamados" seria falso.
 * Derivar da opacidade efetiva mantem a legenda verdadeira nos dois casos.
 */
export function heatRedThreshold(unitAlpha: number): number {
    if (unitAlpha <= 0 || unitAlpha >= 1) return 1;
    const exact = Math.log(1 - PEAK_INTENSITY) / Math.log(1 - unitAlpha);
    // A folga absorve o erro de ponto flutuante da ida e volta pelo log: sem
    // ela, um valor que deveria ser 27 sai como 27.0000000001 e o teto anuncia
    // 28 chamados para uma area que ja pinta vermelho com 27.
    return Math.max(1, Math.ceil(exact - 1e-9));
}

export interface HeatGridCell {
    key: string;
    count: number;
    south: number;
    west: number;
    north: number;
    east: number;
}

export interface HeatGridResult {
    cells: HeatGridCell[];
    maxCount: number;
    plotted: number;
}

/**
 * Distribui os protocolos em celulas de `cellMeters` de lado.
 *
 * A largura da celula em graus e calculada num unico paralelo de referencia (a
 * latitude media dos pontos). Recalcular por linha faria celulas de linhas
 * diferentes terem areas diferentes, e comparar contagem entre elas deixaria de
 * ser valido.
 */
export function buildHeatGrid(protocols: GeoLocatableProtocol[], cellMeters: number): HeatGridResult {
    const positioned = protocols.flatMap((protocol) => {
        const position = getMarkerPosition(protocol);
        return position ? [position] : [];
    });

    if (!positioned.length) return { cells: [], maxCount: 0, plotted: 0 };

    const referenceLatitude = positioned.reduce((total, [latitude]) => total + latitude, 0) / positioned.length;
    const latitudeStep = cellMeters / METERS_PER_DEGREE_LATITUDE;
    const longitudeScale = Math.max(Math.cos((referenceLatitude * Math.PI) / 180), 0.2);
    const longitudeStep = cellMeters / (METERS_PER_DEGREE_LATITUDE * longitudeScale);

    const cells = new Map<string, HeatGridCell>();

    positioned.forEach(([latitude, longitude]) => {
        const row = Math.floor(latitude / latitudeStep);
        const column = Math.floor(longitude / longitudeStep);
        const key = `${row}:${column}`;
        const cell = cells.get(key);

        if (cell) {
            cell.count += 1;
            return;
        }

        cells.set(key, {
            key,
            count: 1,
            south: row * latitudeStep,
            north: (row + 1) * latitudeStep,
            west: column * longitudeStep,
            east: (column + 1) * longitudeStep,
        });
    });

    // Crescente: as celulas quentes sao desenhadas por ultimo e ficam por cima
    // das vizinhas frias nas bordas compartilhadas.
    const list = [...cells.values()].sort((first, second) => first.count - second.count);

    return {
        cells: list,
        maxCount: list.reduce((max, cell) => Math.max(max, cell.count), 0),
        plotted: positioned.length,
    };
}

export type HeatResolutionId = 'fine' | 'medium' | 'broad';

/**
 * Refinamento da grade, em tamanho alvo da celula na tela.
 *
 * O controle e relativo, e nao um lado fixo em metros, porque o lado sai do zoom
 * (heatCellMeters). Celula com lado fixo em metros e invisivel fora do zoom de
 * rua: 500 m viram 0,05 px no zoom de pais, e a grade simplesmente desaparece
 * justamente quando se quer ver o pais inteiro.
 */
export const HEAT_RESOLUTIONS: {
    id: HeatResolutionId;
    label: string;
    description: string;
    /** Lado desejado da celula na tela, em pixels. */
    targetPixels: number;
}[] = [
    { id: 'fine', label: 'Fina', description: 'Mais células, menos chamados em cada', targetPixels: 28 },
    { id: 'medium', label: 'Média', description: 'Equilíbrio entre detalhe e contagem', targetPixels: 46 },
    { id: 'broad', label: 'Ampla', description: 'Menos células, mais chamados em cada', targetPixels: 76 },
];

export function heatResolution(id: HeatResolutionId) {
    return HEAT_RESOLUTIONS.find((resolution) => resolution.id === id) || HEAT_RESOLUTIONS[1];
}

/**
 * Lados de celula disponiveis, em metros.
 *
 * A escada existe para o rotulo ser legivel: "células de 2 km" se entende, "de
 * 1.847 m" nao. Vai de quadra a pedaco de estado, porque a grade tem de
 * funcionar do zoom de rua ao de pais.
 */
const CELL_LADDER = [
    50, 100, 250, 500, 1000, 2000, 5000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000,
];

/**
 * Lado da celula para o zoom atual: o passo da escada que chega mais perto do
 * tamanho alvo na tela. A comparacao e feita em escala logaritmica, senao os
 * passos grandes ganhariam sempre - a distancia absoluta de 250 km at 400 km e
 * maior que de 100 m a 400 m, mas em proporcao e muito menor.
 */
export function heatCellMeters(zoom: number, latitude: number, resolution: HeatResolutionId): number {
    const target = heatResolution(resolution).targetPixels * metersPerPixel(latitude, zoom);
    return CELL_LADDER.reduce((best, step) => (
        Math.abs(Math.log(step / target)) < Math.abs(Math.log(best / target)) ? step : best
    ));
}

/** Lado da celula em texto curto, para a legenda. */
export function formatCellSize(meters: number): string {
    return meters >= 1000
        ? `${(meters / 1000).toString().replace('.', ',')} km`
        : `${meters} m`;
}

/**
 * Limites dos controles do gradiente.
 *
 * O raio e em metros, e nao em pixels como na maioria das ferramentas: assim a
 * mancha representa sempre a mesma area no chao e a leitura nao muda de
 * significado a cada zoom. A suavizacao e uma fracao do raio pelo mesmo motivo
 * - em pixels absolutos ela dominaria a mancha no zoom de cidade.
 */
export const HEAT_CONTROLS = {
    radius: { min: 100, max: 2000, step: 50, default: 400 },
    /** Largura da borda difusa, em % do raio. */
    softness: { min: 20, max: 100, step: 5, default: 60 },
    /** Opacidade da camada sobre o mapa, em %. */
    opacity: { min: 30, max: 100, step: 5, default: 70 },
} as const;
