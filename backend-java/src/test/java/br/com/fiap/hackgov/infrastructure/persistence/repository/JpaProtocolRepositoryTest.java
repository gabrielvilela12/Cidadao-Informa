package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.entity.Protocol;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.query.parser.PartTree;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class JpaProtocolRepositoryTest {

    @Test
    void parsesRecentEventProjectionQueryAgainstProtocolEntity() {
        PartTree query = new PartTree(
                "findAllProjectedByCreatedAtAfterOrderByCreatedAtAsc",
                Protocol.class
        );

        assertEquals(1, query.getParts().stream().count());
        Sort.Order createdAtOrder = query.getSort().getOrderFor("createdAt");
        assertNotNull(createdAtOrder);
        assertEquals(Sort.Direction.ASC, createdAtOrder.getDirection());
    }
}
