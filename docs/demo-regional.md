# Demonstrações municipais

Na tela de login, escolha **Entrar como demonstração → Servidor** e depois **Ribeirão Preto** ou **São Paulo**. As duas contas usam a senha `Demo@123`:

| Região | CPF do servidor demo | Prefeitura |
|---|---|---|
| Ribeirão Preto | `22233344455` | `est-demo-ribeirao-preto` |
| São Paulo | `44455566677` | `est-demo-sao-paulo` |

As migrações Flyway `V30__seed_regional_demo_accounts.sql` e `V31__expand_regional_demo_to_200_citizens_700_protocols.sql` cadastram a prefeitura de São Paulo, sua assinatura e campanha, mantêm o servidor demo existente de Ribeirão Preto e criam um servidor para São Paulo. A base final tem **100 cidadãos e 350 chamados por cidade**, totalizando **200 cadastros e 700 chamados**. Ribeirão Preto já tinha um cidadão demo com login; os outros cidadãos fictícios têm senha inválida e não conseguem entrar. Os chamados incluem endereços, coordenadas, situações e prioridades da própria cidade.

Os painéis de protocolos, cidadãos, relatórios diários, registros de IA e eventos em tempo real usam a prefeitura da conta autenticada para separar Ribeirão Preto de São Paulo, mesmo que as duas estejam na UF `SP`. Os relatórios diários aparecem depois que o fechamento agendado for gerado; o seed não fabrica fechamentos anteriores.

O seed opcional em `supabase/seed/demo-dados.sql` é uma base nacional independente e não é necessário para essas duas demonstrações. Ele continua sendo aplicado somente de forma manual.

