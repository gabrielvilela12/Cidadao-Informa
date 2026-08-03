import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { Rectangle, Tooltip, useMap } from 'react-leaflet';
import { heatColorAt, type HeatGridCell } from '../../utils/heatmap';

/**
 * Densidade em celulas, com a contagem exata dentro.
 *
 * A cor da celula e linear na contagem (count / maxCount), de proposito: uma
 * escala raiz quadrada deixaria a grade mais colorida, porem faria uma area com
 * 6 chamados parecer metade de uma com 40. Como o numero esta escrito na
 * celula, a distorcao seria percebida como erro do mapa.
 *
 * O lado da celula vem do zoom (heatCellMeters), calculado em AdminMap. Duas
 * consequencias tratadas aqui:
 *
 *  - so as celulas que cruzam a tela sao desenhadas. Com a base espalhada pelo
 *    pais sao centenas de celulas, e a maioria esta fora da vista;
 *  - o rotulo permanente entra quando a celula tem pixel suficiente para o
 *    numero caber. Antes a decisao era pela contagem total de celulas, o que
 *    escondia o numero em qualquer base real - 543 chamados geram ~270 celulas,
 *    e o modo Grade existe justamente para mostrar a contagem.
 */

/** Lado minimo, em pixels, para o numero caber dentro da celula. */
const LABEL_MIN_PIXELS = 34;

interface HeatGridLayerProps {
    cells: HeatGridCell[];
    maxCount: number;
    /** Mesmo controle de opacidade do gradiente, de 0 a 1. */
    opacity: number;
}

export function HeatGridLayer({ cells, maxCount, opacity }: HeatGridLayerProps) {
    const map = useMap();

    // Contador de revisao: muda a cada movimento para o recorte e o tamanho da
    // celula serem recalculados sem guardar bounds no estado.
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        const sync = () => setRevision((value) => value + 1);
        map.on('moveend zoomend resize', sync);
        return () => {
            map.off('moveend zoomend resize', sync);
        };
    }, [map]);

    const { visible, cellPixels } = useMemo(() => {
        // A folga evita celula faltando na borda enquanto o mapa nao terminou
        // de se mover.
        const bounds = map.getBounds().pad(0.2);
        const onScreen = cells.filter((cell) => bounds.intersects(
            L.latLngBounds([cell.south, cell.west], [cell.north, cell.east]),
        ));

        if (!onScreen.length) return { visible: onScreen, cellPixels: 0 };

        // Tamanho real na tela, medido pelo proprio Leaflet.
        const [first] = onScreen;
        const top = map.latLngToLayerPoint([first.north, first.west]);
        const bottom = map.latLngToLayerPoint([first.south, first.west]);

        return { visible: onScreen, cellPixels: Math.abs(bottom.y - top.y) };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cells, map, revision]);

    const showLabels = cellPixels >= LABEL_MIN_PIXELS;

    return (
        <>
            {visible.map((cell) => {
                const bounds: [[number, number], [number, number]] = [[cell.south, cell.west], [cell.north, cell.east]];
                const ratio = maxCount > 0 ? cell.count / maxCount : 0;

                return (
                    <Rectangle
                        key={`${cell.key}-${showLabels ? 'label' : 'hover'}`}
                        bounds={bounds}
                        pathOptions={{
                            color: '#ffffff',
                            weight: 1,
                            opacity: opacity * 0.85,
                            fillColor: heatColorAt(ratio, 'grid'),
                            fillOpacity: opacity,
                        }}
                        eventHandlers={{ click: () => map.fitBounds(bounds, { maxZoom: 17 }) }}
                    >
                        <Tooltip
                            className="heat-cell-label"
                            direction="center"
                            permanent={showLabels}
                            opacity={1}
                        >
                            {showLabels ? cell.count : `${cell.count} ${cell.count === 1 ? 'chamado' : 'chamados'}`}
                        </Tooltip>
                    </Rectangle>
                );
            })}
        </>
    );
}
