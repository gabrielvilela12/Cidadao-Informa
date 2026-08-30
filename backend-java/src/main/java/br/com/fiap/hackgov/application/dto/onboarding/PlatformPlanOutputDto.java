package br.com.fiap.hackgov.application.dto.onboarding;

import br.com.fiap.hackgov.domain.billing.PlatformPlan;

public record PlatformPlanOutputDto(
        String code,
        String name,
        String description,
        int sortOrder
) {
    public static PlatformPlanOutputDto from(PlatformPlan plan) {
        return new PlatformPlanOutputDto(
                plan.getCode(),
                plan.getName(),
                plan.getDescription(),
                plan.getSortOrder() == null ? 0 : plan.getSortOrder()
        );
    }
}
