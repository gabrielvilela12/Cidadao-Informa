/**
 * Posicionamento de protocolos no mapa.
 *
 * Regra central: a posicao exibida e SEMPRE a coordenada que o solicitante
 * confirmou no mapa ao abrir o chamado, persistida em protocols.latitude /
 * protocols.longitude. Quando ela nao existe, a funcao retorna null e o
 * protocolo simplesmente nao recebe pin.
 *
 * O que existia antes e por que foi removido:
 *  - Geocodificacao do endereco chamando o Nominatim direto do browser. Em
 *    producao 100% das chamadas falhavam por CORS, e geocoding em massa no
 *    cliente viola a politica de uso do servico.
 *  - Um fallback que derivava lat/lng de um hash do id do protocolo, com
 *    dispersao de +/-0.025 grau em torno de Brasilia. Isso fabricava
 *    localizacoes com aparencia plausivel: enderecos de Sao Paulo, Ribeirao
 *    Preto e Pernambuco apareciam todos no Distrito Federal. Um mapa que mente
 *    de forma convincente e pior que um mapa vazio, porque equipes sao
 *    despachadas com base nele.
 *
 * Para localizar registros antigos que nao tem coordenada, a geocodificacao
 * deve ser feita no servidor e o resultado gravado no banco.
 */

/** Centro padrao unico da aplicacao (Praca dos Tres Poderes, Brasilia). */
export const DEFAULT_MAP_CENTER: [number, number] = [-15.7942, -47.8822];

export const MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const MAP_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Subconjunto de Protocol suficiente para posicionar no mapa. */
export interface GeoLocatableProtocol {
    latitude?: number | null;
    longitude?: number | null;
}

function isValidCoordinate(latitude: unknown, longitude: unknown): boolean {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
    if (latitude < -90 || latitude > 90) return false;
    if (longitude < -180 || longitude > 180) return false;
    // (0, 0) no Atlantico e o sintoma classico de coordenada nao preenchida.
    if (latitude === 0 && longitude === 0) return false;
    return true;
}

/**
 * Retorna a posicao confirmada do protocolo, ou null quando nao houver
 * localizacao confiavel. Nunca estima nem inventa uma posicao.
 */
export function getMarkerPosition(protocol: GeoLocatableProtocol): [number, number] | null {
    if (!isValidCoordinate(protocol.latitude, protocol.longitude)) return null;
    return [protocol.latitude as number, protocol.longitude as number];
}

/** true quando o protocolo pode ser plotado. */
export function hasConfirmedLocation(protocol: GeoLocatableProtocol): boolean {
    return getMarkerPosition(protocol) !== null;
}

/** Quantos protocolos da lista estao sem localizacao confirmada. */
export function countWithoutLocation(protocols: GeoLocatableProtocol[]): number {
    return protocols.reduce((total, protocol) => total + (hasConfirmedLocation(protocol) ? 0 : 1), 0);
}
