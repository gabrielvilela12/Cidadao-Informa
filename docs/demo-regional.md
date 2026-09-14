# Demonstrações municipais

Na tela de login, **Servidor RP** abre somente a campanha demonstrativa de Ribeirão Preto. A senha pública dessa conta é `Demo@123`. O funcionário de São Paulo entra pelo formulário normal de servidor, com credencial individual provisionada fora do repositório:

| Acesso | CPF | Prefeitura |
|---|---|---|
| Servidor demo de Ribeirão Preto | `22233344455` | `est-demo-campanha-ribeirao-preto` |
| Mariana Costa, funcionária de São Paulo | `55566677788` | `est-demo-sao-paulo` |

As migrações Flyway V30 e V31 criam **100 cidadãos e 350 chamados fictícios por cidade**, totalizando **200 cadastros e 700 chamados**. A V32 move a campanha e os dados demo de Ribeirão Preto para uma prefeitura exclusiva, impede que novos cadastros públicos sejam roteados para essa campanha, desativa o antigo login público de servidor de São Paulo e cria a conta individual de Mariana. A conta nova começa inativa e sem senha utilizável; em produção, a senha é definida e a conta é ativada diretamente no banco. Ribeirão Preto já tinha um cidadão demo com login; os outros cidadãos fictícios têm senha inválida e não conseguem entrar.

Os painéis de protocolos, cidadãos, relatórios diários, registros de IA e eventos em tempo real usam a prefeitura da conta autenticada para separar os dados. O servidor demo só pertence ao tenant da campanha fictícia; a funcionária de São Paulo pertence à prefeitura de São Paulo. Os relatórios diários aparecem depois que o fechamento agendado for gerado; o seed não fabrica fechamentos anteriores.

O seed opcional em `supabase/seed/demo-dados.sql` é uma base nacional independente e não é necessário para essas duas demonstrações. Ele continua sendo aplicado somente de forma manual.

