import { useEffect, useState } from 'react';
import { Circle, Tooltip, useMap } from 'react-leaflet';
import { heatColorAt, metersPerPixel } from '../../utils/heatmap';
import type { CityCluster } from '../../utils/regions';

/**
 * Densidade por cidade, num circulo em volta de onde os chamados estao.
 *
 * O raio e geografico: cobre os chamados do grupo, entao ao aproximar o circulo
 * mostra a extensao real da mancha urbana.
 *
 * Ele nunca encolhe abaixo de um piso em pixels, porque raio geografico puro
 * desaparece ao afastar - uma cidade de 8 km vira meio pixel no zoom de pais, o
 * mesmo defeito que a grade de lado fixo em metros tinha. E o piso cresce com a
 * contagem: no zoom de pais, onde todo circulo esta no piso, o tamanho passa a
 * ordenar por volume em vez de deixar tudo do mesmo tamanho. Ao aproximar, o
 * raio geografico volta a mandar.
 */

/** Piso do raio na tela, em pixels, para a cidade menor da base. */
const MIN_RADIUS_PIXELS = 8;

/** Quanto o piso cresce, em pixels, da cidade menor para a maior. */
const RADIUS_PIXELS_BY_COUNT = 14;

/** Raio minimo na tela para o numero caber dentro do circulo. */
const LABEL_MIN_PIXELS = 13;

interface HeatCityLayerProps {
    clusters: CityCluster[];
    maxCount: number;
    /** Mesmo controle de opacidade do gradiente, de 0 a 1. */
    opacity: number;
}

export function HeatCityLayer({ clusters, maxCount, opacity }: HeatCityLayerProps) {
    const map = useMap();

    // Contador de revisao: o piso em pixels depende do zoom, entao o raio de
    // cada circulo precisa ser recalculado quando a escala muda.
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        const sync = () => setRevision((value) => value + 1);
        map.on('zoomend resize', sync);
        return () => {
            map.off('zoomend resize', sync);
        };
    }, [map]);

    const scale = metersPerPixel(map.getCenter().lat, map.getZoom());

    return (
        <>
            {clusters.map((cluster) => {
                const ratio = maxCount > 0 ? cluster.count / maxCount : 0;
                const floorPixels = MIN_RADIUS_PIXELS + Math.sqrt(ratio) * RADIUS_PIXELS_BY_COUNT;
                const radius = Math.max(cluster.radiusMeters, floorPixels * scale);
                const showLabel = radius / scale >= LABEL_MIN_PIXELS;

                return (
                    <Circle
                        // Sem `revision` na chave: o raio e prop, e o Leaflet
                        // atualiza sozinho. Remontar todo circulo a cada zoom
                        // piscaria a camada inteira sem motivo. So a troca de
                        // rotulo permanente exige remontagem.
                        key={`${cluster.key}-${showLabel ? 'label' : 'hover'}`}
                        center={[cluster.latitude, cluster.longitude]}
                        radius={radius}
                        pathOptions={{
                            color: '#ffffff',
                            weight: 1.5,
                            opacity: opacity * 0.9,
                            fillColor: heatColorAt(ratio, 'region'),
                            fillOpacity: opacity,
                        }}
                        eventHandlers={{
                            click: () => map.fitBounds(
                                [[cluster.latitude, cluster.longitude], [cluster.latitude, cluster.longitude]],
                                { maxZoom: 13, padding: [80, 80] },
                            ),
                        }}
                    >
                        <Tooltip
                            className={showLabel ? 'heat-count-label' : 'heat-region-tooltip'}
                            direction="center"
                            permanent={showLabel}
                            opacity={1}
                        >
                            {showLabel ? cluster.count : `${cluster.count} ${cluster.count === 1 ? 'chamado' : 'chamados'}`}
                        </Tooltip>
                    </Circle>
                );
            })}
        </>
    );
}
