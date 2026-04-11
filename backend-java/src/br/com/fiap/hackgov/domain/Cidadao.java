package br.com.fiap.hackgov.domain;

public class Cidadao {
    private String cpf;
    private String nomeCompleto;

    public Cidadao(String cpf, String nomeCompleto) {
        this.cpf = cpf;
        this.nomeCompleto = nomeCompleto;
    }

    public boolean validarIdentidade() {
        return this.cpf != null && this.cpf.length() == 11;
    }

    public String getNomeCompleto() { return this.nomeCompleto; }
    public String getCpf() { return this.cpf; }
}
