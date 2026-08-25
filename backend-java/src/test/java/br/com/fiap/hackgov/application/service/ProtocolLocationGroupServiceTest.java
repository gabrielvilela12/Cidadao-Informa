package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.protocol.ProtocolSummaryOutputDto;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProtocolLocationGroupServiceTest {

    private final ProtocolRepository repository = mock(ProtocolRepository.class);
    private final ProtocolLocationGroupService service = new ProtocolLocationGroupService(repository);

    @Test
    void groupsFromSecondReportAndAlertsOnlyAboveTen() {
        List<ProtocolSummaryOutputDto> one = service.summarizeForAdmin(protocols(1));
        List<ProtocolSummaryOutputDto> two = service.summarizeForAdmin(protocols(2));
        List<ProtocolSummaryOutputDto> ten = service.summarizeForAdmin(protocols(10));
        List<ProtocolSummaryOutputDto> eleven = service.summarizeForAdmin(protocols(11));

        assertFalse(one.getFirst().locationGrouped());
        assertTrue(two.getFirst().locationGrouped());
        assertFalse(ten.getFirst().locationAlert());
        assertTrue(eleven.getFirst().locationAlert());
        assertEquals("protocol-0", eleven.getLast().primaryProtocolId());
        assertEquals(11, eleven.getLast().locationGroupCount());
    }

    @Test
    void synchronizesFromTheSecondReport() {
        List<Protocol> one = protocols(1);
        when(repository.getByLocationAndCause("praca da se 10 se sao paulo sp", "fisica|calcada sem rampa"))
                .thenReturn(one);
        assertEquals(1, service.membersForStatusSync(one.getFirst()).size());

        List<Protocol> two = protocols(2);
        when(repository.getByLocationAndCause("praca da se 10 se sao paulo sp", "fisica|calcada sem rampa"))
                .thenReturn(two);
        assertEquals(2, service.membersForStatusSync(two.getFirst()).size());
    }

    @Test
    void doesNotJoinDifferentCausesAtTheSameAddress() {
        List<Protocol> protocols = protocols(2);
        protocols.get(1).setCauseKey("fisica|semaforo apagado");

        List<ProtocolSummaryOutputDto> summaries = service.summarizeForAdmin(protocols);

        assertTrue(summaries.stream().noneMatch(ProtocolSummaryOutputDto::locationGrouped));
    }

    private List<Protocol> protocols(int count) {
        return IntStream.range(0, count).mapToObj(index -> {
            Protocol protocol = new Protocol();
            protocol.setId("protocol-" + index);
            protocol.setCategory("Física");
            protocol.setDescription("Calçada sem rampa");
            protocol.setAddress("Praça da Sé, 10 - Sé, São Paulo - SP");
            protocol.setLocationKey("praca da se 10 se sao paulo sp");
            protocol.setCauseKey("fisica|calcada sem rampa");
            protocol.setStateCode("SP");
            protocol.setCreatedAt(Instant.parse("2026-08-01T00:00:00Z").plusSeconds(index));
            protocol.setStatus("Aberto");
            protocol.setUserId("citizen-" + index);
            protocol.setRequester("Cidadão " + index);
            return protocol;
        }).toList();
    }
}
