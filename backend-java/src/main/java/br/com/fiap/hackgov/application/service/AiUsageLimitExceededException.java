package br.com.fiap.hackgov.application.service;

public class AiUsageLimitExceededException extends RuntimeException {
    public AiUsageLimitExceededException(String message) {
        super(message);
    }
}
