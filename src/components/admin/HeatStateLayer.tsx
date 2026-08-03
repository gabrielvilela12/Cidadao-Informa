import { Fragment } from 'react';
import L from 'leaflet';
import { Marker, Polygon, Tooltip } from 'react-leaflet';
import { heatColorAt } from '../../utils/heatmap';
import type { StateTally } from '../../utils/regions';

/**
 * Densidade por unidade federativa, pintada sobre o perimetro real do estado.
 *
 * Substitui a grade de quadrados no recorte amplo. A grade contava certo, mas
 * sobre area sem significado: uma celula cobria parte de um estado, parte do
 * vizinho e um naco de oceano. Aqui a area e a mesma que a gestao usa para
 * distribuir equipe, entao a contagem passa a ser acionavel.
 *
 * Estado sem chamado nao e desenhado. Pintar as 27 UFs cobriria o mapa de area
 * fria e esconderia onde ha demanda - a ausencia de cor ja diz o que precisa.
 */

/** Rotulo da contagem: divIcon em vez de tooltip porque a posicao e escolhida
 *  por StateTally.labelPosition, e nao pelo centro que o Leaflet calcularia
 *  (que em estado com ilha cai na agua). */
function countIcon(count: number): L.DivIcon {
    return L.divIcon({
        className: 'heat-count-icon',
        html: `<span class="heat-count-pill">${count}</span>`,
        iconSize: [52, 22],
        iconAnchor: [26, 11],
    });
}

interface HeatStateLayerProps {
    tallies: StateTally[];
    maxCount: number;
    /** Mesmo controle de opacidade do gradiente, de 0 a 1. */
    opacity: number;
}

export function HeatStateLayer({ tallies, maxCount, opacity }: HeatStateLayerProps) {
    return (
        <>
            {tallies.map(({ state, count, labelPosition }) => {
                const ratio = maxCount > 0 ? count / maxCount : 0;

                return (
                    <Fragment key={state.uf}>
                        <Polygon
                            positions={state.parts}
                            pathOptions={{
                                color: '#ffffff',
                                weight: 1.5,
                                opacity: opacity * 0.9,
                                fillColor: heatColorAt(ratio, 'region'),
                                fillOpacity: opacity,
                            }}
                        >
                            <Tooltip sticky className="heat-region-tooltip">
                                <strong>{state.name}</strong>
                                {` · ${count} ${count === 1 ? 'chamado' : 'chamados'}`}
                            </Tooltip>
                        </Polygon>
                        <Marker position={labelPosition} icon={countIcon(count)} interactive={false} />
                    </Fragment>
                );
            })}
        </>
    );
}
