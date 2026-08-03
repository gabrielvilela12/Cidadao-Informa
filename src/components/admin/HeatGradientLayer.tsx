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
 * O canvas e filho do container do Leaflet, nao de um pane: assim as
 * coordenadas de desenho sao pontos de tela puros, sem a transformacao que o
 * Leaflet aplica ao pane durante o arraste. Em troca, e preciso redesenhar a
 * cada evento de movimento - o que e barato porque o desenho e feito em
 * resolucao logica (1 px de CSS = 1 px de canvas, sem devicePixelRatio: a
 * mancha e difusa e nao ganha nada com o dobro de pixels, enquanto o
 * getImageData de recolorir custaria quatro vezes mais) e coalescido por
 * requestAnimationFrame.
 */

const COLOR_LUT = heatColorLut();
const ALPHA_LUT = heatAlphaLut();

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
    /** Opacidade de um chamado, de heatUnitAlpha(pico de densidade). */
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
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = L.DomUtil.create('canvas', 'heat-gradient-canvas');
        map.getContainer().appendChild(canvas);
        canvasRef.current = canvas;

        return () => {
            canvas.remove();
            canvasRef.current = null;
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

        const size = map.getSize();
        const width = Math.max(1, size.x);
        const height = Math.max(1, size.y);

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }

        context.clearRect(0, 0, width, height);
        if (!points.length || unitAlpha <= 0) return;

        const radius = heatRadiusPixels(radiusMeters, map.getCenter().lat, map.getZoom());
        const blur = Math.max(1, radius * softness);
        const outerRadius = radius + blur;
        const stamp = buildStamp(radius, blur);
        let stamped = 0;

        points.forEach((point) => {
            const screenPoint = map.latLngToContainerPoint([point.latitude, point.longitude]);

            // Fora da tela com folga do raio total: nao influencia pixel visivel.
            if (
                screenPoint.x < -outerRadius || screenPoint.x > width + outerRadius
                || screenPoint.y < -outerRadius || screenPoint.y > height + outerRadius
            ) return;

            // Coordenada com varios protocolos vale por varios chamados, na
            // mesma composicao que aconteceria se estivessem lado a lado.
            context.globalAlpha = point.weight > 1
                ? 1 - (1 - unitAlpha) ** point.weight
                : unitAlpha;
            context.drawImage(stamp, screenPoint.x - outerRadius, screenPoint.y - outerRadius);
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

    useEffect(() => {
        const schedule = () => {
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
            frameRef.current = requestAnimationFrame(() => {
                frameRef.current = null;
                draw();
            });
        };

        schedule();
        map.on('move zoom resize viewreset', schedule);

        return () => {
            map.off('move zoom resize viewreset', schedule);
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        };
    }, [draw, map]);

    return null;
}
