// In-memory cache to avoid rate-limiting Nominatim
const geocodeCache: Record<string, [number, number]> = {};

export async function getMarkerPosition(protocolId: string, address: string): Promise<[number, number]> {
    // 1. Try Cache
    if (geocodeCache[address]) {
        return geocodeCache[address];
    }

    // 2. Try Nominatim Geocoding
    try {
        if (address && address.trim().length > 5) {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
                headers: { 'Accept-Language': 'pt-BR' }
            });
            const data = await res.json();
            if (data && data.length > 0) {
                const position: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                geocodeCache[address] = position;
                return position;
            }
        }
    } catch (e) {
        console.error("Geocoding failed for address:", address, e);
    }

    // 3. Fallback to Pseudo-Random based on ID
    let hash = 0;
    for (let i = 0; i < protocolId.length; i++) {
        hash = protocolId.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use a pseudo-random number generator algorithm with the hash
    const random1 = Math.abs(Math.sin(hash++) * 10000) % 1;
    const random2 = Math.abs(Math.sin(hash++) * 10000) % 1;

    // Center of Brasília
    const baseLat = -15.7942;
    const baseLng = -47.8822;

    // Add small offset (approx 5km radius)
    const latOffset = (random1 - 0.5) * 0.05;
    const lngOffset = (random2 - 0.5) * 0.05;

    const fallbackPosition: [number, number] = [baseLat + latOffset, baseLng + lngOffset];
    geocodeCache[address] = fallbackPosition;
    return fallbackPosition;
}
