package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.infrastructure.repository.OperationalAnalyticsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

import java.io.Reader;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.DriverManager;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Properties;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/** Opt-in: tabelas temporarias na propria conexao; rollback preserva o banco do projeto. */
@EnabledIfEnvironmentVariable(named = "HACKGOV_ANALYTICS_DB_TESTS", matches = "true")
class OperationalAnalyticsDatabaseTest {
    @Test
    void runsRealPostgresQueriesOnIsolatedFixture() throws Exception {
        var config = new Properties();
        try (Reader reader = Files.newBufferedReader(Path.of("../.env.local"))) { config.load(reader); }
        try (var connection = DriverManager.getConnection(config.getProperty("SPRING_DATASOURCE_URL"),
                config.getProperty("SPRING_DATASOURCE_USERNAME"), config.getProperty("SPRING_DATASOURCE_PASSWORD"))) {
            connection.setAutoCommit(false);
            try {
                var datasource = new SingleConnectionDataSource(connection, true);
                var jdbc = new JdbcTemplate(datasource);
                jdbc.execute("SET LOCAL search_path = pg_temp");
                jdbc.execute("""
                        CREATE TEMP TABLE protocols (
                            id text, category text, status text, created_at timestamptz, resolved_at timestamptz,
                            resolution_cost numeric, deleted_at timestamptz, establishment_id text,
                            state_code text, location_key text, cause_key text, address text
                        ) ON COMMIT DROP
                        """);
                jdbc.execute("""
                        INSERT INTO protocols VALUES
                        ('p1','Física','Concluído','2026-09-01 03:00Z','2026-09-03 03:00Z',100,NULL,'a','SP','local','causa','Local A'),
                        ('p2','Física','Concluído','2026-09-02 03:00Z',NULL,NULL,NULL,'a','SP','local','causa','Local A'),
                        ('p3','Visual','Aberto','2026-09-30 23:59-03',NULL,NULL,NULL,'a','SP','outro','causa','Local B'),
                        ('outside','Visual','Aberto','2026-10-01 00:00-03',NULL,NULL,NULL,'a','SP','outro','causa','Local B'),
                        ('deleted','Física','Aberto','2026-09-01 03:00Z',NULL,NULL,'2026-09-02 03:00Z','a','SP','local','causa','Local A'),
                        ('other-city','Física','Aberto','2026-09-01 03:00Z',NULL,NULL,NULL,'b','SP','local','causa','Local A'),
                        ('old','Física','Concluído','2026-08-20 03:00Z','2026-09-04 03:00Z',50,NULL,'a','SP','other','causa','Local C'),
                        ('other-state','Física','Aberto','2026-09-01 03:00Z',NULL,NULL,NULL,'c','RJ','local','causa','Local A')
                        """);
                var repository = new OperationalAnalyticsRepository(new NamedParameterJdbcTemplate(datasource));
                var start = LocalDate.of(2026, 9, 1);
                var end = LocalDate.of(2026, 9, 30);
                var zone = ZoneId.of("America/Sao_Paulo");
                var startAt = start.atStartOfDay(zone).toInstant();
                var septemberEnd = LocalDate.of(2026, 10, 1).atStartOfDay(zone).toInstant();
                var result = repository.query(start, end, startAt, septemberEnd, false, "a", Set.of());
                assertEquals(3, result.summary().total());
                assertEquals(2, result.summary().completed());
                assertEquals(new BigDecimal("66.67"), result.summary().completionRate());
                assertEquals(new BigDecimal("2.00"), result.summary().averageResolutionDays());
                assertEquals(1, result.summary().timedCompletions());
                assertEquals(1, result.summary().costedCompletions());
                assertEquals(0, new BigDecimal("100").compareTo(result.summary().totalCost()));
                assertEquals(2, result.monthly().getFirst().completed());
                assertEquals(3, result.monthly().getFirst().opened());
                assertEquals(1, result.recurrence().size());
                assertEquals(2, result.recurrence().getFirst().reports());
                assertEquals(3, result.distribution().stream().mapToLong(item -> item.total()).sum());
                assertEquals(4, repository.query(start, end, startAt, septemberEnd, false, null, Set.of("SP")).summary().total());
                assertEquals(5, repository.query(start, end, startAt, septemberEnd, true, null, Set.of()).summary().total());
                assertEquals(0, repository.query(start, end, startAt, septemberEnd, false, null, Set.of()).summary().total());
                var emptyStart = LocalDate.of(2026, 10, 2);
                var emptyEnd = LocalDate.of(2026, 11, 30);
                var empty = repository.query(emptyStart, emptyEnd, emptyStart.atStartOfDay(zone).toInstant(),
                        emptyEnd.plusDays(1).atStartOfDay(zone).toInstant(), false, "a", Set.of());
                assertEquals(0, empty.summary().total());
                assertNull(empty.summary().averageResolutionDays());
                assertNull(empty.summary().averageCost());
                assertEquals(0, empty.monthly().getFirst().opened());
                assertEquals(2, empty.monthly().size());
            } finally { connection.rollback(); }
        }
    }
}
