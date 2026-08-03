import { useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import {
    heatAlphaLut,
    heatColorLut,
    heatRadiusPixels,
    type WeightedHeatPoint,
} from '../../utils/heatmap';

/**
 * Mancha continua de densidade desenhada num canvas sobre o mapa.
 *
 * Como funciona: cada ponto estampa um borrao radial em tons de cinza com
 * opacidade proporcional ao seu peso; onde os borroes se sobrepoem, a
 * intensidade acumula. No fim o canvas e recolorido pixel a pixel, trocando o
 * cinza acumulado pela cor da escala fria -> quente. E o mesmo principio do
 * leaflet.heat, reescrito aqui para nao adicionar dependencia e para a escala
 * ficar sob controle do projeto (utils/heatmap.ts).
 *
 * Sincronia com o mapa (o motivo do canvas viver num pane):
 *
 * O canvas fica dentro do pane proprio, filho do mapPane, e nao no container do
 * Leaflet. Assim ele herda a translacao do pane durante o arraste e nao precisa
 * de redesenho nenhum para acompanhar - de graca, isso tira o getImageData de
 * recolorir do caminho do arraste.
 *
 * No zoom, o mapa nao pode ser seguido por redesenho: `Map._animateZoom` chama
 * `_move` com o center e o zoom FINAIS no primeiro quadro e so depois desliza os
 * tiles por 250 ms. Quem redesenha ao ouvir 'zoom' aparece no destino enquanto o
 * mapa ainda esta viajando, e o resultado se le como travamento. A saida e a
 * mesma dos tiles e do renderer de canvas do Leaflet: no 'zoomanim', aplicar
 * scale + translate por CSS e deixar a transicao de .leaflet-zoom-anim levar o
 * canvas em sincronia, redesenhando so no fim. Em pinca o 'zoomanim' dispara a
 * cada quadro e sem a classe de transicao, entao a mancha segue o dedo.
 */

/** Folga alem da viewport, em fracao da tela, para cobrir o arraste. */
const VIEWPORT_PADDING = 0.2;

/** Vira a classe .leaflet-heatgradient-pane, estilizada no index.css. */
const PANE_NAME = 'heatgradient';

const COLOR_LUT = heatColorLut();
const ALPHA_LUT = heatAlphaLut();

/** Estado do ultimo desenho, base do transform aplicado no zoom. */
interface DrawnView {
    /** Canto superior esquerdo do canvas em pixels projetados. */
    origin: L.Point;
    zoom: number;
}

/**
 * Borrao radial reaproveitado por todos os pontos do quadro.
 *
 * O circulo e desenhado fora do canvas e o que aparece e a sombra deslocada
 * para dentro - o mesmo truque do simpleheat. A sombra do canvas produz uma
 * queda gaussiana de verdade, mais limpa que empilhar paradas de um gradiente
 * radial, e o raio do nucleo solido fica separado da largura da borda difusa.
 */
function buildStamp(radius: number, blur: number): HTMLCanvasElement {
    const outerRadius = radius + blur;
    const size = Math.ceil(outerRadius * 2);
    const stamp = document.createElement('canvas');
    stamp.width = size;
    stamp.height = size;

    const context = stamp.getContext('2d');
    if (!context) return stamp;

    context.shadowOffsetX = outerRadius * 2;
    context.shadowOffsetY = outerRadius * 2;
    context.shadowBlur = blur;
    context.shadowColor = '#000000';

    context.beginPath();
    context.arc(-outerRadius, -outerRadius, radius, 0, Math.PI * 2, true);
    context.closePath();
    context.fill();

    return stamp;
}

interface HeatGradientLayerProps {
    points: WeightedHeatPoint[];
    /** Opacidade de um chamado, de heatUnitAlpha(ancora de densidade). */
    unitAlpha: number;
    radiusMeters: number;
    /** Largura da borda difusa, em fracao do raio. */
    softness: number;
    /** Opacidade da camada sobre o mapa, de 0 a 1. */
    opacity: number;
}

export function HeatGradientLayer({ points, unitAlpha, radiusMeters, softness, opacity }: HeatGradientLayerProps) {
    const map = useMap();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const drawnRef = useRef<DrawnView | null>(null);

    useEffect(() => {
        const pane = map.getPane(PANE_NAME) || map.createPane(PANE_NAME);
        const canvas = L.DomUtil.create('canvas', 'heat-gradient-canvas leaflet-zoom-animated');
        pane.appendChild(canvas);
        canvasRef.current = canvas;

        return () => {
            canvas.remove();
            canvasRef.current = null;
            drawnRef.current = null;
        };
    }, [map]);

    // Opacidade e do elemento, nao do desenho: mexer no slider nao redesenha
    // nada, e as cores da escala continuam sendo as da legenda.
    useEffect(() => {
        if (canvasRef.current) canvasRef.current.style.opacity = String(opacity);
    }, [opacity]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;

        const viewport = map.getSize();
        const width = Math.max(1, Math.round(viewport.x * (1 + VIEWPORT_PADDING * 2)));
        const height = Math.max(1, Math.round(viewport.y * (1 + VIEWPORT_PADDING * 2)));
        const topLeft = map.containerPointToLayerPoint(viewport.multiplyBy(-VIEWPORT_PADDING)).round();

        // setPosition escreve um translate puro, o que tambem descarta a escala
        // que o zoom anterior tinha deixado no elemento.
        L.DomUtil.setPosition(canvas, topLeft);

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }

        const zoom = map.getZoom();
        drawnRef.current = { origin: topLeft.add(map.getPixelOrigin()), zoom };

        context.clearRect(0, 0, width, height);
        if (!points.length || unitAlpha <= 0) return;

        const radius = heatRadiusPixels(radiusMeters, map.getCenter().lat, zoom);
        const blur = Math.max(1, radius * softness);
        const outerRadius = radius + blur;
        const stamp = buildStamp(radius, blur);
        let stamped = 0;

        points.forEach((point) => {
            const position = map.latLngToLayerPoint([point.latitude, point.longitude]).subtract(topLeft);

            // Fora do canvas com folga do raio total: nao influencia pixel visivel.
            if (
                position.x < -outerRadius || position.x > width + outerRadius
                || position.y < -outerRadius || position.y > height + outerRadius
            ) return;

            // Coordenada com varios protocolos vale por varios chamados, na
            // mesma composicao que aconteceria se estivessem lado a lado.
            context.globalAlpha = point.weight > 1
                ? 1 - (1 - unitAlpha) ** point.weight
                : unitAlpha;
            context.drawImage(stamp, position.x - outerRadius, position.y - outerRadius);
            stamped += 1;
        });

        context.globalAlpha = 1;
        if (!stamped) return;

        const image = context.getImageData(0, 0, width, height);
        const pixels = image.data;

        for (let offset = 0; offset < pixels.length; offset += 4) {
            const intensity = pixels[offset + 3];
            if (!intensity) continue;

            const color = intensity * 3;
            pixels[offset] = COLOR_LUT[color];
            pixels[offset + 1] = COLOR_LUT[color + 1];
            pixels[offset + 2] = COLOR_LUT[color + 2];
            pixels[offset + 3] = ALPHA_LUT[intensity];
        }

        context.putImageData(image, 0, 0);
    }, [map, points, radiusMeters, softness, unitAlpha]);

    /**
     * Escala e desloca o bitmap ja desenhado para o zoom de destino, do mesmo
     * jeito que TileLayer._setZoomTransform faz com cada nivel de tiles.
     *
     * A origem de pixel do destino e recalculada aqui em vez de usar o
     * `_getNewPixelOrigin` do Leaflet, que e privado: e a projecao do centro
     * menos meia tela, mais a posicao do mapPane.
     */
    const applyZoomTransform = useCallback((center: L.LatLng, zoom: number) => {
        const canvas = canvasRef.current;
        const drawn = drawnRef.current;
        const mapPane = map.getPane('mapPane');
        if (!canvas || !drawn || !mapPane) return;

        const scale = map.getZoomScale(zoom, drawn.zoom);
        // A mesma guarda de Map._getMapPanePos: getPosition e undefined enquanto
        // o mapa nao passou pelo primeiro _resetView.
        const panePosition = L.DomUtil.getPosition(mapPane) || new L.Point(0, 0);
        const pixelOrigin = map.project(center, zoom)
            .subtract(map.getSize().divideBy(2))
            .add(panePosition)
            .round();

        L.DomUtil.setTransform(canvas, drawn.origin.multiplyBy(scale).subtract(pixelOrigin).round(), scale);
    }, [map]);

    useEffect(() => {
        draw();

        const onZoomAnim = (event: L.ZoomAnimEvent) => applyZoomTransform(event.center, event.zoom);
        map.on('zoomanim', onZoomAnim);
        map.on('moveend zoomend resize viewreset', draw);

        return () => {
            map.off('zoomanim', onZoomAnim);
            map.off('moveend zoomend resize viewreset', draw);
        };
    }, [applyZoomTransform, draw, map]);

    return null;
}
