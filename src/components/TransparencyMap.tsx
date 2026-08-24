import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';

interface TransparencyMapProps {
    clusters: Array<{
        latitude: number;
        longitude: number;
        count: number;
    }>;
}

export function TransparencyMap({ clusters }: TransparencyMapProps) {
    return (
        <MapContainer
            center={[-14.2, -51.9]}
            zoom={4}
            minZoom={3}
            scrollWheelZoom={false}
            style={{ width: '100%', height: '100%' }}
            aria-label="Mapa com volume agregado de solicitações"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {clusters.map((cluster) => (
                <CircleMarker
                    key={`${cluster.latitude}:${cluster.longitude}`}
                    center={[cluster.latitude, cluster.longitude]}
                    radius={Math.min(28, 7 + Math.sqrt(cluster.count) * 2.6)}
                    pathOptions={{
                        color: '#0758BD',
                        fillColor: '#0B63CE',
                        fillOpacity: 0.58,
                        weight: 2,
                    }}
                >
                    <Popup>
                        <strong>{cluster.count.toLocaleString('pt-BR')}</strong>{' '}
                        {cluster.count === 1 ? 'solicitação nesta área' : 'solicitações nesta área'}
                    </Popup>
                </CircleMarker>
            ))}
        </MapContainer>
    );
}
