package br.com.fiap.hackgov.domain.ai;

public enum Priority {
    BAIXA("baixa"),
    MEDIA("media"),
    ALTA("alta"),
    CRITICA("critica");

    private final String value;

    Priority(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static Priority fromValue(String value) {
        for (Priority p : Priority.values()) {
            if (p.value.equalsIgnoreCase(value)) {
                return p;
            }
        }
        throw new IllegalArgumentException("Invalid priority: " + value);
    }
}
