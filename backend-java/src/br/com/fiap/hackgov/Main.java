package br.com.fiap.hackgov;

import br.com.fiap.hackgov.domain.Cidadao;
import br.com.fiap.hackgov.domain.Solicitacao;

public class Main {
    public static void main(String[] args) {
        System.out.println("Iniciando Sistema HackGov (Cidadão Informa)...\n");

        // 1. Instanciando Cidadãos
        Cidadao cidadao1 = new Cidadao("12345678901", "Gabriel Vilela");
        Cidadao cidadaoInvalido = new Cidadao("123", "Hacker Cidadão");

        // 2. Criando o fluxo de solicitação com sucesso
        System.out.println("--- Cenário 1: Cidadão Registrando um Buraco Válido ---");
        Solicitacao s1 = new Solicitacao(cidadao1, 
                                        "Buraco gigantesco na Avenida Paulista em frente ao MASP.", 
                                        "-23.561414", "-46.655881");
        s1.imprimirResumoProtocolo();

        // 3. Atendente Puxa a solicitação e roteia
        System.out.println("--- Cenário 2: Atendente Tria e Atende ---");
        s1.rotearParaAnalise();
        s1.aprovarEResolver();
        s1.imprimirResumoProtocolo();

        // 4. Fluxo de Regra de Negócio (Rejeitando chamado Falso/Inválido)
        System.out.println("--- Cenário 3: Cadastrando chamado e sendo rejeitado na Triagem ---");
        Solicitacao s2 = new Solicitacao(cidadao1, "Lixeira na minha rua está feia, não gostei da cor", "-23.511", "-46.122");
        s2.imprimirResumoProtocolo(); // Status ABERTA
        
        s2.rotearParaAnalise();
        s2.rejeitar("Motivo fútil, lixeira funcional. Não é caso de zeladoria urbana.");
        s2.imprimirResumoProtocolo(); // Status REJETIADA com motivo

        // 5. Teste de Exceção (Validação de Domínio)
        System.out.println("--- Cenário 4: Prevenindo Fraudes (Cidadão Inválido tentando abrir chamado) ---");
        try {
            Solicitacao fraude = new Solicitacao(cidadaoInvalido, "Rachadura na ponte", "0.0", "0.0");
        } catch (IllegalArgumentException ex) {
            System.err.println("SISTEMA BLOQUEOU: " + ex.getMessage());
        }
    }
}
