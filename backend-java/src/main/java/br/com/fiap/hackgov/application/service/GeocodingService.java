package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

/**
 * Preenche protocols.latitude/longitude a partir do endereco, para chamados
 * abertos antes de a posicao do mapa passar a ser persistida.
 *
 * A geocodificacao roda AQUI, no servidor, nunca no browser: no cliente ela
 * falhava 100% das vezes por CORS e violava a politica de uso do Nominatim, que
 * exige User-Agent identificavel e no maximo 1 requisicao por segundo. O
 * resultado e gravado no banco e vira cache permanente: cada endereco e
 * consultado uma unica vez na vida.
 */
@Service
public class GeocodingService {

    private static final Logger LOGGER = LoggerFactory.getLogger(GeocodingService.class);

    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
    private static final String USER_AGENT = "CidadaoInforma/1.0 (suporte@cidadaoinforma.com.br)";
    private static final long MIN_INTERVAL_MS = 1100;
    private static final int DEFAULT_BATCH = 8;
    private static final int MAX_BATCH = 15;

    private final ProtocolRepository repository;
    private final RestClient restClient;

    public GeocodingService(ProtocolRepository repository, RestClient restClient) {
        this.repository = repository;
        this.restClient = restClient;
    }

    /**
     * Processa um lote pequeno para respeitar o limite do Nominatim sem prender
     * a requisicao por muito tempo. Chame de novo enquanto `remaining` for > 0.
     */
    public BackfillResult backfill(Integer requestedLimit) {
        int limit = requestedLimit == null
                ? DEFAULT_BATCH
                : Math.min(Math.max(requestedLimit, 1), MAX_BATCH);

        List<Protocol> pending = repository.getWithoutCoordinates(limit);

        int located = 0;
        int skipped = 0;
        int failed = 0;
        boolean didRequest = false;

        for (Protocol protocol : pending) {
            String address = protocol.getAddress() == null ? "" : protocol.getAddress();

            if (!looksGeocodable(address)) {
                skipped++;
                continue;
            }

            // 1 req/s conforme a politica de uso do Nominatim.
            if (didRequest) {
                throttle();
            }
            didRequest = true;

            Coordinates found = geocode(address);
            if (found == null) {
                failed++;
                continue;
            }

            try {
                protocol.setLatitude(found.latitude());
                protocol.setLongitude(found.longitude());
                repository.update(protocol);
                located++;
            } catch (Exception exception) {
                LOGGER.error(
                        "Failed to persist coordinates for protocol {}: {}",
                        protocol.getId(),
                        exception.getMessage()
                );
                failed++;
            }
        }

        return new BackfillResult(
                pending.size(),
                located,
                skipped,
                failed,
                repository.countWithoutCoordinates()
        );
    }

    /**
     * Descarta enderecos degenerados antes de gastar requisicao. A base tem
     * registros como "av ,  - " e "222, 2-2, 2-2", que nunca vao geocodificar.
     */
    private boolean looksGeocodable(String address) {
        String trimmed = address.trim();
        if (trimmed.length() < 8) {
            return false;
        }
        long letters = trimmed.chars().filter(Character::isLetter).count();
        return letters >= 5;
    }

    private Coordinates geocode(String address) {
        try {
            String uri = UriComponentsBuilder.fromUriString(NOMINATIM_URL)
                    .queryParam("format", "json")
                    .queryParam("limit", 1)
                    .queryParam("countrycodes", "br")
                    .queryParam("q", address)
                    .encode()
                    .toUriString();

            NominatimPlace[] places = restClient.get()
                    .uri(uri)
                    .header(HttpHeaders.USER_AGENT, USER_AGENT)
                    .header(HttpHeaders.ACCEPT_LANGUAGE, "pt-BR")
                    .retrieve()
                    .body(NominatimPlace[].class);

            if (places == null || places.length == 0) {
                return null;
            }

            double latitude = Double.parseDouble(places[0].lat());
            double longitude = Double.parseDouble(places[0].lon());

            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                return null;
            }

            return new Coordinates(latitude, longitude);
        } catch (Exception exception) {
            LOGGER.warn("Geocoding failed for address: {}", exception.getMessage());
            return null;
        }
    }

    private void throttle() {
        try {
            Thread.sleep(MIN_INTERVAL_MS);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }

    private record Coordinates(double latitude, double longitude) {
    }

    private record NominatimPlace(String lat, String lon) {
    }

    public record BackfillResult(
            int processed,
            int located,
            int skipped,
            int failed,
            long remaining
    ) {
    }
}
