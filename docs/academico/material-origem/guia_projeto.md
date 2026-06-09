# PROMPT — Documentação Completa de Projeto de Aplicativo Móvel

## Contexto

Você é um engenheiro de software sênior especialista em produtos móveis, arquitetura de software moderna e documentação técnica. Sua tarefa é produzir a documentação completa e profissional de um projeto de aplicativo móvel, do zero ao nível de prontidão para desenvolvimento. Este é um projeto real e sério — o padrão esperado é equivalente ao que uma empresa de tecnologia de médio/grande porte produziria antes de iniciar o desenvolvimento.

Leia as instruções abaixo com atenção e **produza todos os artefatos solicitados sequencialmente**, sem pular seções, sem resumir onde foi pedido detalhe, e sem inventar restrições que não foram impostas.

***

## O Projeto

### Nome sugerido: GarageTrack

**Conceito:** Aplicativo móvel focado em gestão inteligente e histórico técnico de veículos. O app permite que proprietários de carros e motos cadastrem seus veículos, registrem todas as manutenções realizadas com contexto completo (o que foi feito, quando, onde, quanto custou, com qual quilometragem), calculem automaticamente quando a próxima revisão deve ocorrer com base em regras configuráveis, salvem a localização geográfica de onde cada serviço foi prestado, e recebam alertas inteligentes proativos antes do vencimento de revisões críticas.

### Visão

Proprietários de veículos, especialmente no Brasil, perdem o histórico de manutenção de seus carros e motos com frequência: trocas de óleo sem registro, revisões sem data, oficinas sem referência. Esse problema gera insegurança na hora de vender o veículo, gera retrabalho quando uma peça falha sem histórico conhecido, e gera custos evitáveis por manutenção preventiva negligenciada. O GarageTrack resolve isso sendo a memória técnica do veículo do usuário — organizada, inteligente e consultável a qualquer momento.

### Posicionamento de Mercado

O mercado global de software automotivo ultrapassa USD 50 bilhões e cresce a um CAGR acima de 10% ao ano. O segmento específico de apps de manutenção preditiva de veículos foi avaliado em USD 4,8 bilhões em 2025 com projeção de atingir USD 14,7 bilhões até 2034. Os concorrentes diretos existentes (CARFAX Car Care, Simply Auto, FixD, Car Minder) são majoritariamente focados no mercado norte-americano, com fraca aderência ao contexto brasileiro, sem suporte a motos como primeiro cidadão, sem mapas de histórico de oficinas e sem lógica de alertas baseada em uso combinado (tempo + quilometragem). Esse gap representa uma oportunidade clara de posicionamento local com diferencial técnico real.

### Diferenciais esperados do produto

1. Suporte nativo a múltiplos tipos de veículos (carros e motos) com campos e categorias de manutenção adaptados para cada tipo.
2. Cálculo inteligente da próxima revisão baseado em regras combinadas: data, quilometragem estimada por uso médio semanal informado pelo usuário, ou ambos — com o sistema alertando pelo critério que vencer primeiro.
3. Mapa de histórico de serviços: cada manutenção registrada pode ter a localização geográfica salva, criando um mapa pessoal de oficinas e referências do proprietário.
4. Checklist contextual dinâmico: ao registrar um tipo de serviço, o app sugere campos e sub-itens específicos daquele serviço (ex: troca de óleo → tipo de óleo, viscosidade, filtro; freios → pastilha, disco, fluido).
5. Painel de saúde do veículo: tela-resumo com indicadores de status por categoria de manutenção, total gasto, próximo vencimento e última revisão.
6. Modo pré-viagem: o usuário ativa antes de viagens longas e o app verifica quais itens estão próximos do vencimento e emite alerta consolidado.
7. Memória de peças e marcas: ao registrar uma troca, o app persiste marca e especificação do produto usado, permitindo consultar o que foi colocado da última vez.
8. Alertas com antecedência configurável: o usuário define com quantos dias ou quilômetros de antecedência quer ser notificado para cada categoria de manutenção.

***

## O que você deve produzir

Gere os seguintes artefatos completos, nesta ordem:

***

### ARTEFATO 1 — Visão Geral do Produto (Product Overview)

Escreva um documento de visão do produto com:
- Resumo executivo do app (3 a 5 parágrafos)
- Problema detalhado que resolve, com contexto real
- Solução e proposta de valor única (UVP)
- Público-alvo primário e secundário com personas detalhadas (ao menos 2 personas com nome fictício, perfil, comportamento, dores e ganhos esperados)
- Análise de concorrentes diretos e indiretos (ao menos 4 concorrentes, com tabela comparativa de funcionalidades)
- Oportunidade de mercado com dados concretos
- Métricas de sucesso do produto (KPIs)

***

### ARTEFATO 2 — Especificação de Requisitos do Sistema (SRS)

Produza uma Especificação de Requisitos de Software completa seguindo estrutura moderna, contendo:

**2.1 Introdução**
- Propósito do documento
- Escopo do sistema
- Definições, siglas e abreviações
- Visão geral do documento

**2.2 Descrição Geral**
- Perspectiva do produto
- Funções do produto (sumário)
- Características dos usuários
- Restrições gerais
- Premissas e dependências

**2.3 Requisitos Funcionais** — listados com identificadores únicos (RF-001, RF-002…) organizados por módulo:
- Módulo: Autenticação e Perfil
- Módulo: Gestão de Veículos
- Módulo: Registro de Manutenção
- Módulo: Cálculo e Alertas Inteligentes
- Módulo: Mapa e Localização
- Módulo: Painel e Relatórios
- Módulo: Configurações

Cada requisito deve ter: identificador, nome curto, descrição, prioridade (Alta/Média/Baixa), e critério de aceite objetivo.

**2.4 Requisitos Não-Funcionais** — listados com identificadores únicos (RNF-001…) abordando:
- Desempenho
- Disponibilidade
- Segurança e privacidade
- Usabilidade e acessibilidade
- Portabilidade
- Manutenibilidade

**2.5 Restrições do Sistema**

**2.6 Regras de Negócio** — listadas com identificadores (RN-001…) abordando:
- Lógica de cálculo da próxima revisão
- Lógica de disparo de alertas
- Comportamento do modo pré-viagem
- Regras de categoria de manutenção por tipo de veículo

***

### ARTEFATO 3 — Casos de Uso (Use Cases)

Documente ao menos 8 casos de uso principais no formato estruturado, cada um contendo:
- Identificador (UC-001…)
- Nome
- Ator principal
- Pré-condições
- Fluxo principal (passo a passo numerado)
- Fluxos alternativos
- Fluxos de exceção
- Pós-condições
- Regras de negócio relacionadas

Casos de uso obrigatórios:
- UC-001: Cadastrar veículo
- UC-002: Registrar manutenção realizada
- UC-003: Calcular próxima revisão
- UC-004: Visualizar mapa de histórico de serviços
- UC-005: Receber alerta de revisão próxima
- UC-006: Ativar modo pré-viagem
- UC-007: Consultar painel de saúde do veículo
- UC-008: Consultar histórico por categoria

***

### ARTEFATO 4 — Modelo de Domínio e Estrutura de Dados

Produza:

**4.1 Diagrama de entidades em formato textual** descrevendo entidades, atributos e relacionamentos. Use a notação:

```
ENTIDADE: NomeDaEntidade
  - campo: tipo [restrição]
  ...
RELACIONAMENTO: EntidadeA →[cardinalidade]→ EntidadeB
```

Entidades mínimas obrigatórias:
- Usuario
- Veiculo
- TipoVeiculo
- Manutencao
- CategoriaManutencao
- ItemManutencao
- LocalServico
- AlertaManutencao
- ConfiguracaoAlerta
- RegistroQuilometragem

**4.2 Descrição de cada entidade** com propósito, atributos detalhados e regras de integridade.

**4.3 Regras de negócio derivadas do modelo** (constraints, defaults, cálculos).

***

### ARTEFATO 5 — Arquitetura de Software

Documente a arquitetura recomendada para o app, com base nas melhores práticas modernas de desenvolvimento móvel (2025), sem prescrever tecnologias específicas — foque nos padrões, responsabilidades e fluxos.

**5.1 Visão geral da arquitetura**
Descreva o padrão arquitetural adotado (ex: Clean Architecture + MVVM ou MVI) e justifique a escolha com base nos requisitos do projeto.

**5.2 Camadas da arquitetura**
Para cada camada, descreva:
- Nome e responsabilidade
- Componentes que ela contém
- O que ela conhece e o que ela não pode conhecer (regra de dependência)
- Exemplos de classes ou módulos pertencentes a essa camada

Camadas obrigatórias:
- Camada de Apresentação (UI)
- Camada de Domínio (lógica de negócio, casos de uso)
- Camada de Dados (repositórios, fontes de dados locais e externas)

**5.3 Fluxo de dados**
Descreva textualmente o fluxo completo de uma ação do usuário, da tela até o banco de dados e de volta, usando o exemplo de "registrar manutenção".

**5.4 Módulos do sistema**
Liste e descreva os módulos (feature modules) do app com suas responsabilidades e dependências entre si.

**5.5 Estratégia de persistência local**
Descreva como os dados são organizados localmente, incluindo estratégia de migração de schema e sincronização futura.

**5.6 Integração com serviços externos**
Descreva os pontos de integração com APIs externas (mapas, geolocalização, notificações push) e como eles são abstraídos das camadas internas via interfaces.

**5.7 Estratégia de testes**
Descreva a pirâmide de testes recomendada para este projeto:
- Testes unitários (o que testar, exemplos de casos)
- Testes de integração
- Testes de UI/E2E

***

### ARTEFATO 6 — User Stories e Critérios de Aceite (Backlog Inicial)

Escreva o backlog inicial organizado em Épicos e User Stories no formato:

**Como** [persona], **quero** [ação], **para que** [benefício].

Cada User Story deve ter:
- Identificador (US-001…)
- Épico ao qual pertence
- User Story no formato padrão
- Critérios de aceite (no mínimo 3 por story, no formato: "Dado [contexto], quando [ação], então [resultado]")
- Story Points estimados (1, 2, 3, 5, 8, 13)
- Prioridade (Must Have / Should Have / Could Have / Won't Have — MoSCoW)

Épicos obrigatórios:
- EP-01: Onboarding e Gestão de Conta
- EP-02: Gestão de Veículos
- EP-03: Registro de Manutenção
- EP-04: Inteligência e Alertas
- EP-05: Mapa de Histórico
- EP-06: Painel e Relatórios

Produza ao menos 20 User Stories distribuídas entre os épicos.

***

### ARTEFATO 7 — Wireframes Textuais (Fluxo de Telas)

Documente as telas principais do app com descrição estruturada dos elementos visuais, hierarquia de informação e comportamento esperado. Para cada tela, descreva:
- Nome da tela
- Propósito
- Componentes visuais listados de cima para baixo
- Ações disponíveis e para onde levam
- Estados possíveis (vazio, carregado, erro, loading)

Telas obrigatórias:
- Tela: Splash / Onboarding
- Tela: Home / Dashboard de Veículos
- Tela: Painel de Saúde do Veículo
- Tela: Registrar Nova Manutenção
- Tela: Histórico de Manutenções (com filtros)
- Tela: Detalhe de Manutenção
- Tela: Mapa de Histórico de Serviços
- Tela: Configurar Alertas
- Tela: Modo Pré-Viagem

***

### ARTEFATO 8 — Roadmap de Desenvolvimento (MVP + Evolução)

**8.1 Definição do MVP**
Liste exatamente quais requisitos e funcionalidades compõem o MVP (Minimum Viable Product), justificando cada inclusão e exclusão.

**8.2 Roadmap por fase**
Organize em 3 fases:
- **Fase 1 — MVP:** O que é estritamente necessário para validar o produto com usuários reais.
- **Fase 2 — Crescimento:** Funcionalidades que aumentam retenção e profundidade de uso.
- **Fase 3 — Escala:** Funcionalidades que abrem novos segmentos ou modelos de negócio.

Para cada fase: objetivos, funcionalidades incluídas, critério de conclusão.

**8.3 Riscos e mitigações**
Liste ao menos 5 riscos do projeto com nível de impacto, probabilidade e estratégia de mitigação.

***

## Instruções de Formato e Qualidade

- Escreva em **português do Brasil**, com linguagem técnica precisa e direta.
- Use **Markdown** com hierarquia clara de títulos (H1 para artefato, H2 para seções, H3 para subseções).
- Use **tabelas** onde houver comparação ou estrutura matricial.
- Use **listas numeradas** para passos e fluxos sequenciais.
- Use **listas com marcadores** para itens não sequenciais.
- Use **blocos de código** para estruturas de dados, identificadores e exemplos técnicos.
- **Nunca resuma onde foi pedido detalhe.** Se uma seção pede "ao menos X itens", respeite o mínimo.
- Cada artefato deve ser autocontido e compreensível sem precisar de contexto externo.
- **Não use frases genéricas** como "melhora a experiência do usuário" sem explicar como e por quê.
- Seja específico com números, regras e critérios. Evite ambiguidade.
- Ao final de cada artefato, insira uma linha horizontal (`---`) separando o próximo.

***

## Checklist de Entrega

Antes de finalizar a resposta, verifique:
- [ ] Todos os 8 artefatos foram produzidos?
- [ ] Cada requisito tem identificador único?
- [ ] Cada caso de uso tem fluxo principal, alternativo e de exceção?
- [ ] O modelo de domínio tem ao menos as 10 entidades listadas?
- [ ] A arquitetura está descrita em camadas com regra de dependência clara?
- [ ] O backlog tem ao menos 20 User Stories com critérios de aceite?
- [ ] Os wireframes textuais cobrem os 9 fluxos obrigatórios?
- [ ] O roadmap separa claramente MVP, Crescimento e Escala?
- [ ] Nenhuma tecnologia específica foi prescrita (sem mencionar nomes de frameworks, bancos de dados ou bibliotecas)?
- [ ] O documento está em português do Brasil com linguagem técnica?

***

*Este prompt foi estruturado para produzir documentação de nível profissional. Execute todos os artefatos na sequência indicada sem interrupções ou resumos não solicitados.*