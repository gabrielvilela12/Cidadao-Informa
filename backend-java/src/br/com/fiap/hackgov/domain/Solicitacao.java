package br.com.fiap.hackgov.domain;

import java.util.Date;
import java.util.UUID;

public class Solicitacao {
    private String protocolo;
    private Cidadao cidadaoReclamante;
    private String descricaoProblema;
    private String latitude;
    private String longitude;
    private StatusSolicitacao statusAtual;
    private Date dataAbertura;
    private String motivoRejeicao;

    public Solicitacao(Cidadao cidadao, String descricao, String latitude, String longitude) {
        if (!cidadao.validarIdentidade()) {
            throw new IllegalArgumentException("Cidadão com identidade não validada (CPF inválido).");
        }
        
        this.protocolo = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.cidadaoReclamante = cidadao;
        this.descricaoProblema = descricao;
        this.latitude = latitude;
        this.longitude = longitude;
        this.statusAtual = StatusSolicitacao.ABERTA;
        this.dataAbertura = new Date();
    }

    public void rotearParaAnalise() {
        this.statusAtual = StatusSolicitacao.EM_ANALISE;
    }

    public void aprovarEResolver() {
        this.statusAtual = StatusSolicitacao.ATENDIDA;
    }

    public void rejeitar(String motivo) {
        this.statusAtual = StatusSolicitacao.REJEITADA;
        this.motivoRejeicao = motivo;
    }

    public void imprimirResumoProtocolo() {
        System.out.println("====== PROTOCOLO ZELADORIA ======");
        System.out.println("ID Protocolo: " + protocolo);
        System.out.println("Reclamante: " + cidadaoReclamante.getNomeCompleto() + " (" + cidadaoReclamante.getCpf() + ")");
        System.out.println("Data: " + dataAbertura.toString());
        System.out.println("Problema: " + descricaoProblema);
        System.out.println("Localização: [" + latitude + ", " + longitude + "]");
        System.out.println("Estatus do Chamado: " + statusAtual);
        if (motivoRejeicao != null) {
            System.out.println("Motivo da Rejeição: " + motivoRejeicao);
        }
        System.out.println("=================================\n");
    }
}
