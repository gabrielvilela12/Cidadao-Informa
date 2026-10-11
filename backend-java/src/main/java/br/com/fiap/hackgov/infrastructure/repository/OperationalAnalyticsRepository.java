package br.com.fiap.hackgov.infrastructure.repository;

import br.com.fiap.hackgov.application.dto.protocol.OperationalAnalyticsOutputDto;
import br.com.fiap.hackgov.application.dto.protocol.OperationalAnalyticsOutputDto.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;

@Repository
public class OperationalAnalyticsRepository {
    private final NamedParameterJdbcTemplate jdbc;
    private final String summary = sql("summary");
    private final String distribution = sql("distribution");
    private final String monthly = sql("monthly");
    private final String recurrence = sql("recurrence");

    public OperationalAnalyticsRepository(NamedParameterJdbcTemplate jdbc) { this.jdbc = jdbc; }

    public OperationalAnalyticsOutputDto query(LocalDate startDate, LocalDate endDate,
                                               Instant startAt, Instant endAt,
                                               boolean globalScope, String establishmentId, Set<String> states) {
        var parameters = new MapSqlParameterSource()
                .addValue("startAt", Timestamp.from(startAt))
                .addValue("endAt", Timestamp.from(endAt))
                .addValue("globalScope", globalScope)
                .addValue("establishmentId", establishmentId, java.sql.Types.VARCHAR)
                .addValue("states", states.isEmpty() ? Set.of("__NONE__") : states);
        Summary totals = jdbc.queryForObject(summary, parameters, (rs, row) -> new Summary(
                rs.getLong("total"), rs.getLong("completed"), rs.getBigDecimal("completion_rate"),
                rs.getBigDecimal("average_resolution_days"), rs.getLong("timed_completions"),
                rs.getBigDecimal("total_cost"), rs.getBigDecimal("average_cost"), rs.getLong("costed_completions")));
        var groups = jdbc.query(distribution, parameters, (rs, row) ->
                new Distribution(rs.getString("category"), rs.getString("status"), rs.getLong("total")));
        var months = jdbc.query(monthly, parameters, (rs, row) ->
                new Month(rs.getString("month"), rs.getLong("opened"), rs.getLong("completed")));
        var ranking = jdbc.query(recurrence, parameters, (rs, row) ->
                new Recurrence(rs.getLong("position"), rs.getString("address"), rs.getString("category"), rs.getLong("reports")));
        return new OperationalAnalyticsOutputDto(startDate, endDate, "America/Sao_Paulo", Instant.now(),
                totals, groups, months, ranking);
    }

    private static String sql(String name) {
        try { return new ClassPathResource("analytics/" + name + ".sql").getContentAsString(StandardCharsets.UTF_8); }
        catch (IOException exception) { throw new IllegalStateException("Consulta analítica indisponível: " + name, exception); }
    }
}
