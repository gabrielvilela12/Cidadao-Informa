package br.com.fiap.hackgov.application.service;

public class InsufficientAiCreditsException extends RuntimeException {
    public InsufficientAiCreditsException(String message) {
        super(message);
    }
}
