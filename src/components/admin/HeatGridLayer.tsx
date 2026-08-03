import { Rectangle, Tooltip, useMap } from 'react-leaflet';
import { heatColorAt, type HeatGridCell } from '../../utils/heatmap';

/**
 * Densidade em celulas de tamanho fixo, com a contagem exata dentro.
 *
 * A cor da celula e linear na contagem (count / maxCount), de proposito: uma
 * escala raiz quadrada deixaria a grade mais colorida, porem faria uma area com
 * 6 chamados parecer metade de uma com 40. Como o numero esta escrito na
 * celula, a distorcao seria percebida como erro do mapa.
 *
 * Acima de LABEL_LIMIT celulas visiveis, os numeros permanentes viram sopa de
 * rotulos - nesse caso a contagem passa a aparecer no hover.
 */

const LABEL_LIMIT = 70;

interface HeatGridLayerProps {
    cells: HeatGridCell[];
    maxCount: number;
    /** Mesmo controle de opacidade do gradiente, de 0 a 1. */
    opacity: number;
}

export function HeatGridLayer({ cells, maxCount, opacity }: HeatGridLayerProps) {
    const map = useMap();
    const showLabels = cells.length <= LABEL_LIMIT;

    return (
        <>
            {cells.map((cell) => {
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
