# Documentação do Produto — GarageTrack

## ARTEFATO 1 — Visão Geral do Produto

## Resumo Executivo

O GarageTrack é um aplicativo móvel para gestão inteligente e histórico técnico de veículos, desenhado para proprietários de carros e motos que precisam manter manutenção preventiva sob controle. O produto centraliza registros de serviços, peças usadas, custo, quilometragem, oficina, localização, fotos e áudios, formando uma memória técnica confiável do veículo.

O aplicativo resolve uma dor recorrente no Brasil: a perda de histórico de manutenção. Muitos proprietários fazem trocas de óleo, revisões, serviços de freio e correções pontuais sem registrar data, quilometragem ou especificação de peças. Isso reduz previsibilidade, aumenta custo de manutenção corretiva e enfraquece a confiança em negociações de compra e venda.

O diferencial do GarageTrack está na combinação entre histórico estruturado e inteligência preventiva. O sistema calcula a próxima revisão usando data, quilometragem e média semanal de uso, alertando pelo critério que vencer primeiro. Além disso, registra localização de serviços, permite anexar mídia e oferece modo pré-viagem para evitar deslocamentos longos com itens críticos próximos do vencimento.

O MVP é realista para desenvolvimento acadêmico em 20 dias porque prioriza experiência local, banco embarcado e integração direta com recursos do dispositivo. A evolução natural inclui sincronização em nuvem, compartilhamento de laudo com compradores, integração com oficinas e recomendações baseadas no perfil de uso.

## Problema Detalhado

Proprietários de veículos geralmente dependem de memória, mensagens antigas, notas fiscais soltas ou adesivos no para-brisa para saber quando fizeram manutenção. Essa prática falha em três situações críticas: quando o veículo começa a apresentar defeito, quando uma viagem longa se aproxima e quando o proprietário precisa comprovar histórico para venda.

Em carros e motos usados diariamente, o vencimento de manutenção não depende apenas de data. Um veículo que roda 1.200 km por semana consome intervalo técnico muito antes de outro que roda 80 km por semana. Sem cálculo combinado, o usuário pode acreditar que ainda há tempo quando, na prática, a quilometragem já venceu.

Também há perda de especificação técnica. O usuário esquece qual óleo foi usado, qual marca de pastilha foi instalada, quando trocou bateria ou onde realizou determinado serviço. Isso dificulta diagnósticos e pode gerar compras erradas de peças.

## Solução e UVP

O GarageTrack é a memória técnica inteligente do veículo. Ele permite registrar cada manutenção com contexto completo e transforma o histórico em alertas acionáveis.

Proposta de valor única: manter carros e motos tecnicamente acompanhados com histórico confiável, cálculo preventivo por uso real e evidências multimídia, sem depender de planilhas, papel ou memória do proprietário.

## Público-Alvo

### Persona 1 — Mariana Alves

- Perfil: 34 anos, analista administrativa, usa carro diariamente para trabalho e família.
- Comportamento: faz manutenção em oficinas diferentes conforme disponibilidade.
- Dores: esquece datas de revisão, perde notas fiscais e fica insegura antes de viagens.
- Ganhos: recebe alertas claros, consulta histórico por categoria e comprova cuidado com o veículo.

### Persona 2 — Rafael Nascimento

- Perfil: 27 anos, motociclista, usa moto para deslocamento urbano e viagens curtas.
- Comportamento: acompanha corrente, óleo e pneus com frequência, mas registra pouco.
- Dores: manutenção de moto exige intervalos menores e mais dependentes de quilometragem.
- Ganhos: checklist específico para moto, alertas por km e registro de peças usadas.

## Concorrentes

| Produto | Histórico | Alertas por km + tempo | Motos como primeiro cidadão | Mapa de serviços | Mídia no registro | Aderência Brasil |
| --- | --- | --- | --- | --- | --- | --- |
| CARFAX Car Care | Sim | Parcial | Baixa | Não focado | Baixa | Baixa |
| Simply Auto | Sim | Parcial | Média | Não | Média | Média |
| FixD | Sim | Focado em diagnóstico | Baixa | Não | Baixa | Baixa |
| Car Minder | Sim | Parcial | Baixa | Não | Baixa | Baixa |
| Planilhas/Notas | Manual | Não | Depende do usuário | Não | Não estruturado | Alta, mas frágil |

## Oportunidade de Mercado

O mercado global de software automotivo ultrapassa USD 50 bilhões e cresce acima de 10% ao ano. Apps de manutenção preditiva foram estimados em USD 4,8 bilhões em 2025, com projeção de USD 14,7 bilhões até 2034. No Brasil, a frota circulante elevada, o mercado forte de seminovos e o uso expressivo de motos criam oportunidade para um produto localizado, simples e tecnicamente confiável.

## Métricas de Sucesso

| KPI | Meta inicial |
| --- | --- |
| Veículos cadastrados por usuário ativo | 1,4 em 90 dias |
| Registros de manutenção por veículo | 3 nos primeiros 6 meses |
| Uso do modo pré-viagem | 25% dos usuários ativos mensais |
| Alertas configurados | 80% dos veículos com ao menos 4 categorias ativas |
| Retenção D30 | 35% no MVP validado |
| Tempo médio para registrar manutenção | Menos de 2 minutos |

---

## ARTEFATO 2 — Especificação de Requisitos do Sistema

## 2.1 Introdução

### Propósito

Definir os requisitos funcionais, não funcionais, restrições e regras de negócio do GarageTrack, servindo como base para desenvolvimento, validação acadêmica e evolução do produto.

### Escopo

O sistema contempla cadastro local de usuário, veículos, oficinas, manutenções, alertas, localização de serviços, anexos multimídia, painel de saúde e modo pré-viagem. Sincronização em nuvem e marketplace de oficinas ficam fora do MVP.

### Definições

- RF: requisito funcional.
- RNF: requisito não funcional.
- RN: regra de negócio.
- MVP: produto mínimo viável.
- Categoria de manutenção: grupo técnico como óleo, freios, pneus ou bateria.

### Visão Geral

O documento apresenta descrição geral, requisitos por módulo, requisitos não funcionais, restrições e regras de negócio.

## 2.2 Descrição Geral

### Perspectiva do Produto

O GarageTrack é um aplicativo móvel centrado no proprietário do veículo. O app funciona inicialmente offline, com armazenamento local e integração com recursos do dispositivo.

### Funções do Produto

- Gerenciar veículos.
- Registrar manutenções.
- Anexar foto, áudio e localização.
- Calcular próximas revisões.
- Exibir histórico e mapa.
- Configurar alertas.
- Executar modo pré-viagem.

### Características dos Usuários

Usuários são proprietários de carros e motos, com conhecimento técnico variado. A interface deve evitar termos excessivamente complexos, mas preservar campos técnicos relevantes.

### Restrições Gerais

- O MVP deve funcionar sem backend obrigatório.
- O app deve priorizar Android.
- Recursos nativos dependem de permissões do usuário.
- Mapa e localização dependem dos serviços do dispositivo.

### Premissas e Dependências

- O usuário informa quilometragem atual com boa precisão.
- A média semanal de uso é estimada pelo usuário.
- A primeira versão utiliza regras configuráveis, não diagnóstico mecânico automático.

## 2.3 Requisitos Funcionais

### Autenticação e Perfil

| ID | Nome | Descrição | Prioridade | Critério de aceite |
| --- | --- | --- | --- | --- |
| RF-001 | Perfil local | Permitir criar ou carregar perfil do usuário. | Alta | Ao abrir o app, existe um usuário ativo para associar veículos. |
| RF-002 | Dados do perfil | Manter nome e e-mail do usuário. | Média | Perfil exibe nome e e-mail persistidos. |
| RF-003 | Sessão local | Manter acesso sem login repetido no MVP. | Alta | Fechar e abrir o app preserva os dados. |

### Gestão de Veículos

| ID | Nome | Descrição | Prioridade | Critério de aceite |
| --- | --- | --- | --- | --- |
| RF-004 | Cadastrar veículo | Registrar carro ou moto com dados básicos. | Alta | Veículo aparece no seletor após cadastro. |
| RF-005 | Múltiplos veículos | Permitir mais de um veículo por usuário. | Alta | Usuário alterna entre veículos cadastrados. |
| RF-006 | Tipo do veículo | Diferenciar carro e moto. | Alta | Categorias específicas mudam conforme tipo. |
| RF-007 | Quilometragem atual | Armazenar km atual e média semanal. | Alta | Cálculos usam esses valores. |

### Registro de Manutenção

| ID | Nome | Descrição | Prioridade | Critério de aceite |
| --- | --- | --- | --- | --- |
| RF-008 | Nova manutenção | Registrar categoria, data, km, custo e notas. | Alta | Registro aparece no histórico do veículo. |
| RF-009 | Checklist dinâmico | Sugerir campos conforme categoria. | Alta | Troca de óleo exibe óleo, viscosidade e filtro. |
| RF-010 | Peças e marcas | Salvar marca e especificação usadas. | Alta | Detalhe exibe produto registrado. |
| RF-011 | Foto | Anexar foto via câmera ou galeria. | Média | Detalhe mostra imagem anexada. |
| RF-012 | Áudio | Gravar áudio descritivo. | Média | Registro mantém URI do áudio. |
| RF-013 | Oficina | Associar manutenção a uma oficina. | Média | Detalhe mostra oficina quando informada. |

### Cálculo e Alertas Inteligentes

| ID | Nome | Descrição | Prioridade | Critério de aceite |
| --- | --- | --- | --- | --- |
| RF-014 | Próxima revisão | Calcular vencimento por data e km. | Alta | Painel mostra próximo vencimento por categoria. |
| RF-015 | Critério mais próximo | Alertar pelo que vencer primeiro. | Alta | Se km vencer antes da data, status muda por km. |
| RF-016 | Antecedência configurável | Configurar dias e km de aviso. | Alta | Alterações afetam status no painel. |
| RF-017 | Notificação local | Emitir lembrete de manutenção. | Média | App agenda ou dispara notificação local permitida. |

### Mapa e Localização

| ID | Nome | Descrição | Prioridade | Critério de aceite |
| --- | --- | --- | --- | --- |
| RF-018 | Capturar GPS | Salvar localização do serviço. | Alta | Registro contém latitude e longitude. |
| RF-019 | Mapa de histórico | Exibir serviços e oficinas em mapa. | Média | Marcadores aparecem no mapa. |
| RF-020 | Oficinas | Listar oficinas e serviços disponíveis. | Média | Oficina exibe endereço, telefone e categorias. |
| RF-021 | Avaliar oficina | Registrar avaliação local. | Média | Avaliação aparece na lista de oficinas. |

### Painel e Relatórios

| ID | Nome | Descrição | Prioridade | Critério de aceite |
| --- | --- | --- | --- | --- |
| RF-022 | Dashboard | Exibir KPIs do veículo. | Alta | Mostra km, total gasto, último serviço e próximo alerta. |
| RF-023 | Saúde por categoria | Exibir OK, atenção ou vencido. | Alta | Cada categoria apresenta status e motivo. |
| RF-024 | Histórico filtrável | Filtrar histórico por categoria. | Alta | Filtro altera lista exibida. |
| RF-025 | Modo pré-viagem | Avaliar risco para distância informada. | Média | App indica itens a revisar antes da viagem. |

### Configurações

| ID | Nome | Descrição | Prioridade | Critério de aceite |
| --- | --- | --- | --- | --- |
| RF-026 | Ajustar intervalos | Editar intervalo em dias e km. | Alta | Valores persistem e recalculam saúde. |
| RF-027 | Ativar/desativar alerta | Permitir desligar categoria. | Média | Categoria desativada não gera atenção. |
| RF-028 | Preferências por veículo | Regras variam por veículo. | Alta | Moto e carro possuem configurações independentes. |

## 2.4 Requisitos Não Funcionais

| ID | Categoria | Requisito | Critério |
| --- | --- | --- | --- |
| RNF-001 | Desempenho | Carregar dashboard em até 2 segundos no MVP. | Base local com até 1.000 registros. |
| RNF-002 | Desempenho | Registro de manutenção deve salvar em até 1 segundo localmente. | Operação local concluída sem rede. |
| RNF-003 | Disponibilidade | App deve funcionar offline para fluxos principais. | Registro e histórico disponíveis sem internet. |
| RNF-004 | Segurança | Dados não devem ser enviados sem consentimento. | MVP não transmite histórico para terceiros. |
| RNF-005 | Privacidade | Localização e mídia exigem permissão explícita. | Sem permissão, recurso informa bloqueio. |
| RNF-006 | Usabilidade | Fluxo de registro deve ser objetivo. | Campos essenciais em uma tela rolável. |
| RNF-007 | Acessibilidade | Cores de status devem ter texto complementar. | Status não depende só de cor. |
| RNF-008 | Portabilidade | Base deve permitir evolução multiplataforma. | Regras de domínio não dependem da UI. |
| RNF-009 | Manutenibilidade | Regras devem ficar separadas da apresentação. | Cálculos testáveis sem tela. |

## 2.5 Restrições do Sistema

- MVP sem backend obrigatório.
- Notificações remotas ficam fora do escopo inicial.
- Geolocalização depende de permissão e disponibilidade do dispositivo.
- Dados de oficinas no MVP podem ser locais ou cadastrados previamente.
- Diagnóstico automático por OBD não faz parte do MVP.

## 2.6 Regras de Negócio

| ID | Regra |
| --- | --- |
| RN-001 | A próxima revisão deve considerar data e quilometragem. |
| RN-002 | O status deve ser vencido se dias restantes ou km restantes forem menores ou iguais a zero. |
| RN-003 | O status deve ser atenção se estiver dentro da antecedência configurada. |
| RN-004 | A estimativa por km usa média semanal informada pelo usuário. |
| RN-005 | Se não houver histórico para uma categoria, o status inicial deve recomendar linha de base. |
| RN-006 | Modo pré-viagem deve somar a distância planejada ao risco de quilometragem. |
| RN-007 | Categorias de moto devem incluir relação/corrente. |
| RN-008 | Categoria de arrefecimento deve ser aplicada por padrão a carros. |
| RN-009 | Registro com km maior que o atual atualiza a quilometragem do veículo. |
| RN-010 | Alertas desativados não devem gerar atenção preventiva. |

---

## ARTEFATO 3 — Casos de Uso

## UC-001 — Cadastrar veículo

- Ator principal: Usuário.
- Pré-condições: Usuário possui perfil ativo.
- Fluxo principal: 1. Abre gestão de veículos. 2. Informa tipo, modelo, ano, placa, km atual e km semanal. 3. Confirma cadastro. 4. Sistema salva veículo e cria preferências padrão.
- Fluxos alternativos: Usuário cadastra moto e recebe categorias específicas de moto.
- Fluxos de exceção: Placa ou km inválidos impedem salvamento.
- Pós-condições: Veículo fica disponível no seletor.
- Regras: RN-007, RN-008.

## UC-002 — Registrar manutenção realizada

- Ator principal: Usuário.
- Pré-condições: Existe veículo cadastrado.
- Fluxo principal: 1. Seleciona veículo. 2. Abre registrar manutenção. 3. Escolhe categoria. 4. Preenche data, km, custo, oficina e notas. 5. Completa checklist. 6. Anexa GPS, foto ou áudio. 7. Salva.
- Fluxos alternativos: Registro pode ser salvo sem mídia.
- Fluxos de exceção: Km ou custo inválidos bloqueiam salvamento.
- Pós-condições: Histórico e painel são atualizados.
- Regras: RN-009.

## UC-003 — Calcular próxima revisão

- Ator principal: Sistema.
- Pré-condições: Existe histórico ou preferência de categoria.
- Fluxo principal: 1. Recupera último registro da categoria. 2. Aplica intervalo em dias. 3. Aplica intervalo em km. 4. Estima data por uso semanal. 5. Define vencimento pelo menor prazo. 6. Gera status.
- Fluxos alternativos: Sem histórico, recomenda linha de base.
- Fluxos de exceção: Média semanal zero usa mínimo técnico para evitar divisão inválida.
- Pós-condições: Painel mostra status atualizado.
- Regras: RN-001 a RN-005.

## UC-004 — Visualizar mapa de histórico de serviços

- Ator principal: Usuário.
- Pré-condições: Existem oficinas ou registros com localização.
- Fluxo principal: 1. Abre mapa. 2. Sistema carrega marcadores. 3. Usuário toca oficina ou serviço. 4. Visualiza nome, endereço ou data.
- Fluxos alternativos: Sem GPS no registro, apenas oficinas cadastradas aparecem.
- Fluxos de exceção: Permissão de localização negada não bloqueia mapa de registros existentes.
- Pós-condições: Usuário consulta referências geográficas.
- Regras: RN-009.

## UC-005 — Receber alerta de revisão próxima

- Ator principal: Sistema.
- Pré-condições: Categoria ativa e permissão de notificação concedida.
- Fluxo principal: 1. Calcula status. 2. Verifica antecedência. 3. Cria notificação local. 4. Usuário recebe aviso.
- Fluxos alternativos: Sem permissão, alerta fica visível no painel.
- Fluxos de exceção: Recurso de notificação indisponível não impede uso do app.
- Pós-condições: Usuário é informado preventivamente.
- Regras: RN-002, RN-003, RN-010.

## UC-006 — Ativar modo pré-viagem

- Ator principal: Usuário.
- Pré-condições: Veículo selecionado.
- Fluxo principal: 1. Abre modo pré-viagem. 2. Informa distância prevista. 3. Sistema avalia categorias. 4. Exibe itens OK, atenção ou vencidos.
- Fluxos alternativos: Distância zero gera avaliação pelo estado atual.
- Fluxos de exceção: Entrada inválida é tratada como zero.
- Pós-condições: Usuário decide revisar antes da viagem.
- Regras: RN-006.

## UC-007 — Consultar painel de saúde do veículo

- Ator principal: Usuário.
- Pré-condições: Veículo selecionado.
- Fluxo principal: 1. Abre painel. 2. Sistema calcula itens. 3. Exibe total gasto, última revisão e status por categoria.
- Fluxos alternativos: Categoria sem histórico mostra recomendação de linha de base.
- Fluxos de exceção: Falha de leitura local mostra mensagem de erro.
- Pós-condições: Usuário visualiza prioridades técnicas.
- Regras: RN-001 a RN-005.

## UC-008 — Consultar histórico por categoria

- Ator principal: Usuário.
- Pré-condições: Existem registros.
- Fluxo principal: 1. Abre histórico. 2. Seleciona categoria. 3. Sistema filtra registros. 4. Usuário seleciona detalhe. 5. Sistema mostra peças, checklist, custo e oficina.
- Fluxos alternativos: Usuário escolhe todos os registros.
- Fluxos de exceção: Sem registros, tela mostra estado vazio.
- Pós-condições: Usuário recupera informação técnica específica.
- Regras: RN-009.

---

## ARTEFATO 4 — Modelo de Domínio e Estrutura de Dados

## 4.1 Diagrama Textual

```text
ENTIDADE: Usuario
  - id: string [PK]
  - nome: string [obrigatorio]
  - email: string [unico]
  - criadoEm: date

ENTIDADE: Veiculo
  - id: string [PK]
  - usuarioId: string [FK]
  - tipo: TipoVeiculo [carro|moto]
  - nome: string
  - marca: string
  - modelo: string
  - ano: integer
  - placa: string
  - quilometragemAtual: integer
  - kmSemanal: integer

ENTIDADE: TipoVeiculo
  - id: string [PK]
  - nome: string

ENTIDADE: Manutencao
  - id: string [PK]
  - veiculoId: string [FK]
  - oficinaId: string [FK opcional]
  - categoriaId: string [FK]
  - data: date
  - quilometragem: integer
  - custoCentavos: integer
  - observacoes: string
  - fotoUri: string [opcional]
  - audioUri: string [opcional]

ENTIDADE: CategoriaManutencao
  - id: string [PK]
  - nome: string
  - aplicaCarro: boolean
  - aplicaMoto: boolean

ENTIDADE: ItemManutencao
  - id: string [PK]
  - manutencaoId: string [FK]
  - rotulo: string
  - valor: string

ENTIDADE: LocalServico
  - id: string [PK]
  - manutencaoId: string [FK]
  - latitude: decimal
  - longitude: decimal
  - enderecoEstimado: string [opcional]

ENTIDADE: AlertaManutencao
  - id: string [PK]
  - veiculoId: string [FK]
  - categoriaId: string [FK]
  - status: string [ok|atencao|vencido]
  - vencimentoData: date
  - vencimentoKm: integer

ENTIDADE: ConfiguracaoAlerta
  - id: string [PK]
  - veiculoId: string [FK]
  - categoriaId: string [FK]
  - intervaloDias: integer
  - intervaloKm: integer
  - antecedenciaDias: integer
  - antecedenciaKm: integer
  - ativo: boolean

ENTIDADE: RegistroQuilometragem
  - id: string [PK]
  - veiculoId: string [FK]
  - data: date
  - quilometragem: integer

RELACIONAMENTO: Usuario →[1:N]→ Veiculo
RELACIONAMENTO: Veiculo →[1:N]→ Manutencao
RELACIONAMENTO: Manutencao →[N:1]→ CategoriaManutencao
RELACIONAMENTO: Manutencao →[1:N]→ ItemManutencao
RELACIONAMENTO: Manutencao →[0:1]→ LocalServico
RELACIONAMENTO: Veiculo →[1:N]→ ConfiguracaoAlerta
RELACIONAMENTO: Veiculo →[1:N]→ RegistroQuilometragem
```

## 4.2 Descrição das Entidades

- Usuario: proprietário dos veículos. Deve ter e-mail único.
- Veiculo: entidade central do app. Tipo define categorias aplicáveis.
- TipoVeiculo: classificação técnica para carro ou moto.
- Manutencao: registro técnico realizado em uma data e quilometragem.
- CategoriaManutencao: agrupa regras e checklists.
- ItemManutencao: item contextual preenchido no registro.
- LocalServico: coordenadas do serviço.
- AlertaManutencao: resultado calculado a partir de histórico e configuração.
- ConfiguracaoAlerta: regra persistida por veículo e categoria.
- RegistroQuilometragem: evolução histórica de km para previsões futuras.

## 4.3 Regras Derivadas

- Quilometragem não pode ser negativa.
- Custo deve ser armazenado em centavos.
- Uma configuração de alerta é única por veículo e categoria.
- Registros de moto podem usar categoria de relação/corrente.
- Registros de carro podem usar categoria de arrefecimento.
- Local de serviço é opcional, mas deve conter latitude e longitude quando existir.

---

## ARTEFATO 5 — Arquitetura de Software

## 5.1 Visão Geral

A arquitetura recomendada combina separação por camadas com padrão de apresentação reativo. A camada de apresentação cuida de estado visual e interação; a camada de domínio concentra regras de cálculo; a camada de dados abstrai persistência local e fontes externas. Essa escolha reduz acoplamento e permite testar regras críticas sem depender de telas ou recursos nativos.

## 5.2 Camadas

### Apresentação

- Responsabilidade: telas, componentes, estado visual, validações imediatas e navegação.
- Contém: dashboard, histórico, mapa, formulário, alertas e pré-viagem.
- Conhece: casos de uso e modelos de domínio.
- Não conhece: detalhes de tabelas, comandos de banco ou APIs nativas brutas.

### Domínio

- Responsabilidade: regras de negócio, entidades, cálculo de revisão, status e pré-viagem.
- Contém: modelos, regras, validadores e casos de uso.
- Conhece: entidades e contratos abstratos.
- Não conhece: interface, banco, mapa, câmera ou framework de tela.

### Dados

- Responsabilidade: persistência, migração, seed, repositórios e mapeamento entre linhas e entidades.
- Contém: repositórios, fontes locais, adaptadores e políticas de migração.
- Conhece: contratos de domínio e mecanismo de armazenamento.
- Não conhece: layout ou componentes visuais.

## 5.3 Fluxo de Dados — Registrar Manutenção

1. Usuário preenche a tela de registro.
2. Apresentação valida campos básicos.
3. Serviço nativo coleta GPS, foto ou áudio quando solicitado.
4. Caso de uso recebe os dados normalizados.
5. Repositório salva manutenção e atualiza quilometragem do veículo.
6. Domínio recalcula saúde e próximo vencimento.
7. Apresentação atualiza histórico, dashboard e painel.
8. Serviço de notificação emite lembrete local quando permitido.

## 5.4 Módulos

- Conta e perfil: identificação local.
- Veículos: cadastro, seleção e quilometragem.
- Manutenção: registro, checklist e mídia.
- Inteligência: cálculos, alertas e pré-viagem.
- Mapa: oficinas, serviços e localização.
- Relatórios: dashboard, histórico e custos.
- Configurações: regras por categoria.

## 5.5 Persistência Local

Dados devem ser organizados em entidades relacionais com migrações versionadas. Cada alteração de schema deve elevar a versão local e executar passos incrementais. A sincronização futura deve usar identificadores estáveis, timestamps e política de resolução de conflito por entidade.

## 5.6 Integrações Externas

- Mapas: abstraídos por serviço de localização e componente de mapa.
- Geolocalização: acessada via interface que retorna coordenadas ou erro de permissão.
- Notificações: serviço isolado para agendar e cancelar lembretes.
- Mídia: adaptadores de câmera, galeria e áudio retornam URIs persistíveis.

## 5.7 Estratégia de Testes

- Unitários: cálculo de próxima revisão, status, pré-viagem, filtros e parsing de valores.
- Integração: migração de banco, seed, gravação e leitura de manutenção.
- UI/E2E: registrar manutenção, filtrar histórico, alterar alerta e executar pré-viagem.

---

## ARTEFATO 6 — User Stories e Critérios de Aceite

| ID | Épico | User Story | Critérios de aceite | Pontos | Prioridade |
| --- | --- | --- | --- | --- | --- |
| US-001 | EP-01 | Como usuário, quero abrir o app com perfil local, para acessar meus dados rapidamente. | Dado primeiro acesso, quando o app inicia, então cria perfil local; Dado perfil existente, quando reabrir, então carrega dados; Dado erro local, quando falhar, então mostra mensagem. | 3 | Must Have |
| US-002 | EP-01 | Como usuário, quero visualizar meu nome no app, para confirmar meu perfil. | Dado perfil carregado, quando ver o cabeçalho, então nome aparece; Dado alteração futura, quando salvar, então reflete na UI; Dado sem nome, então usa fallback. | 2 | Could Have |
| US-003 | EP-02 | Como motorista, quero cadastrar veículo, para controlar manutenção individual. | Dado dados válidos, quando salvar, então veículo aparece; Dado tipo moto, então categorias mudam; Dado km inválido, então bloqueia. | 5 | Must Have |
| US-004 | EP-02 | Como usuário com mais de um veículo, quero alternar entre eles, para consultar históricos separados. | Dado múltiplos veículos, quando tocar chip, então troca contexto; Dado troca, então KPIs mudam; Dado sem veículo, então exibe vazio. | 3 | Must Have |
| US-005 | EP-02 | Como usuário, quero informar km semanal, para obter previsão por uso real. | Dado km semanal, quando calcular alerta, então usa média; Dado valor baixo, então evita divisão por zero; Dado mudança, então recalcula. | 3 | Must Have |
| US-006 | EP-03 | Como usuário, quero registrar manutenção, para preservar histórico técnico. | Dado formulário válido, quando salvar, então cria registro; Dado km maior, então atualiza veículo; Dado erro, então informa usuário. | 8 | Must Have |
| US-007 | EP-03 | Como usuário, quero checklist dinâmico, para registrar dados corretos por categoria. | Dado categoria óleo, quando selecionar, então mostra viscosidade; Dado freios, então mostra fluido; Dado moto, então inclui itens específicos. | 5 | Must Have |
| US-008 | EP-03 | Como usuário, quero anexar foto, para documentar peça ou problema. | Dado permissão, quando tirar foto, então URI é anexada; Dado negação, então mostra aviso; Dado imagem salva, então aparece no detalhe. | 3 | Should Have |
| US-009 | EP-03 | Como usuário, quero gravar áudio, para descrever problemas difíceis de digitar. | Dado permissão, quando gravar e parar, então áudio é anexado; Dado negação, então alerta; Dado registro salvo, então URI permanece. | 3 | Should Have |
| US-010 | EP-03 | Como usuário, quero registrar oficina, para saber onde o serviço foi feito. | Dado oficina selecionada, quando salvar, então detalhe mostra oficina; Dado sem oficina, então registro salva mesmo assim; Dado mapa, então marcador aparece. | 3 | Should Have |
| US-011 | EP-04 | Como usuário, quero cálculo automático de próxima revisão, para evitar manutenção atrasada. | Dado histórico, quando abrir saúde, então calcula data; Dado km vencido, então status vencido; Dado sem histórico, então recomenda linha base. | 8 | Must Have |
| US-012 | EP-04 | Como usuário, quero configurar antecedência, para receber avisos no momento certo. | Dado preferência, quando ajustar dias, então persiste; Dado ajuste km, então recalcula; Dado desativado, então não alerta. | 5 | Must Have |
| US-013 | EP-04 | Como usuário, quero notificação local, para ser lembrado fora do app. | Dado permissão, quando salvar registro, então notificação pode disparar; Dado sem permissão, então app continua; Dado canal Android, então usa canal adequado. | 3 | Should Have |
| US-014 | EP-04 | Como viajante, quero modo pré-viagem, para verificar riscos antes de sair. | Dado distância, quando calcular, então considera km da viagem; Dado vencido, então bloqueia; Dado OK, então libera com mensagem. | 5 | Should Have |
| US-015 | EP-05 | Como usuário, quero ver mapa de oficinas, para localizar referências confiáveis. | Dado oficinas, quando abrir mapa, então marcadores aparecem; Dado serviços com GPS, então aparecem; Dado sem internet, então lista local permanece. | 5 | Should Have |
| US-016 | EP-05 | Como usuário, quero avaliar oficina, para lembrar qualidade do serviço. | Dado avaliação, quando salvar, então aparece na oficina; Dado nota inválida, então limita 1 a 5; Dado comentário vazio, então usa texto padrão. | 3 | Could Have |
| US-017 | EP-06 | Como usuário, quero dashboard, para entender rapidamente estado do veículo. | Dado veículo, quando abrir início, então mostra KPIs; Dado histórico, então mostra último serviço; Dado alerta, então mostra prioridade. | 5 | Must Have |
| US-018 | EP-06 | Como usuário, quero histórico filtrável, para encontrar serviços por categoria. | Dado registros, quando filtrar, então lista muda; Dado todos, então mostra tudo; Dado detalhe, então mostra peças e checklist. | 5 | Must Have |
| US-019 | EP-06 | Como usuário, quero total gasto, para acompanhar custo de manutenção. | Dado registros, quando abrir dashboard, então soma custos; Dado novo registro, então atualiza; Dado sem registro, então mostra zero. | 3 | Should Have |
| US-020 | EP-06 | Como usuário, quero painel por categoria, para priorizar manutenção. | Dado categorias, quando abrir saúde, então lista status; Dado atenção, então explica motivo; Dado vencido, então destaca criticidade. | 5 | Must Have |

---

## ARTEFATO 7 — Wireframes Textuais

## Splash / Onboarding

- Propósito: carregar app e banco local.
- Componentes: logo, nome GarageTrack, mensagem de preparação.
- Ações: segue automaticamente para Home.
- Estados: loading, erro de inicialização.

## Home / Dashboard de Veículos

- Propósito: visão rápida do veículo selecionado.
- Componentes: cabeçalho, seletor de veículo, abas, painel principal, KPIs, ações rápidas.
- Ações: registrar manutenção, abrir pré-viagem, abrir saúde.
- Estados: carregado, vazio, erro.

## Painel de Saúde do Veículo

- Propósito: exibir status por categoria.
- Componentes: resumo, investimento, última revisão, cards por categoria.
- Ações: consultar motivo e vencimento.
- Estados: sem histórico, OK, atenção, vencido.

## Registrar Nova Manutenção

- Propósito: salvar serviço completo.
- Componentes: categoria, campos técnicos, oficina, checklist, GPS, câmera, galeria, áudio, salvar.
- Ações: capturar mídia, localização e salvar registro.
- Estados: formulário, salvando, erro de permissão, sucesso.

## Histórico de Manutenções

- Propósito: consultar registros.
- Componentes: filtros, lista, detalhe, checklist, foto.
- Ações: filtrar e selecionar registro.
- Estados: lista vazia, carregada, detalhe selecionado.

## Detalhe de Manutenção

- Propósito: mostrar contexto completo do serviço.
- Componentes: título, notas, oficina, peças, checklist, mídia.
- Ações: consulta e futura edição.
- Estados: com mídia, sem mídia.

## Mapa de Histórico de Serviços

- Propósito: visualizar oficinas e manutenções geograficamente.
- Componentes: mapa, marcadores, lista de oficinas, avaliações.
- Ações: tocar marcador, avaliar oficina.
- Estados: com localização, sem registros com GPS, erro de mapa.

## Configurar Alertas

- Propósito: ajustar regras preventivas.
- Componentes: cards por categoria, switch ativo, stepper de dias e km.
- Ações: aumentar/reduzir intervalos e antecedência.
- Estados: alerta ativo, inativo.

## Modo Pré-Viagem

- Propósito: validar risco para uma viagem.
- Componentes: distância prevista, banner de resultado, checklist por categoria.
- Ações: informar km e revisar itens.
- Estados: liberado, atenção, bloqueado por vencimento.

---

## ARTEFATO 8 — Roadmap de Desenvolvimento

## 8.1 Definição do MVP

Inclui: perfil local, veículos, registro de manutenção, SQLite local, checklist dinâmico, foto, áudio, GPS, histórico, mapa, painel de saúde, alertas locais, configurações e pré-viagem. Esses itens validam a proposta central: histórico técnico inteligente e preventivo.

Exclui: backend, login social, marketplace, pagamento, diagnóstico OBD, sincronização multiusuário e IA preditiva avançada. Essas funções aumentam custo e risco sem serem necessárias para validar o valor do produto.

## 8.2 Roadmap por Fase

### Fase 1 — MVP

- Objetivo: validar uso recorrente e precisão percebida dos alertas.
- Funcionalidades: app local, registros, mídia, GPS, mapa, saúde, pré-viagem.
- Critério de conclusão: usuário consegue registrar e consultar manutenção completa sem suporte externo.

### Fase 2 — Crescimento

- Objetivo: aumentar retenção e profundidade de histórico.
- Funcionalidades: backup em nuvem, exportação PDF, compartilhamento de laudo, lembretes recorrentes, cadastro manual de oficinas.
- Critério de conclusão: usuário consegue trocar aparelho sem perder histórico e compartilhar relatório.

### Fase 3 — Escala

- Objetivo: abrir modelo de negócio e ecossistema.
- Funcionalidades: portal de oficinas, integração com notas fiscais, ofertas de manutenção, recomendações por perfil de uso, API pública.
- Critério de conclusão: oficinas conseguem participar do fluxo e usuários recebem recomendações contextualizadas.

## 8.3 Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
| --- | --- | --- | --- |
| Usuário informar km incorreto | Alto | Média | Permitir edição e lembrar atualização periódica. |
| Permissões nativas negadas | Médio | Alta | App deve funcionar sem mídia/GPS e explicar benefício. |
| Escopo crescer além de 20 dias | Alto | Média | Priorizar MVP offline e adiar backend. |
| Alertas imprecisos por uso variável | Médio | Média | Permitir ajuste de média semanal e regras por categoria. |
| Dependência de mapa em ambiente de teste | Médio | Média | Manter lista textual de oficinas como fallback. |
| Dados locais perdidos sem backup | Alto | Média | Planejar exportação e sincronização na fase 2. |

---

## Checklist de Entrega

- [x] Todos os 8 artefatos foram produzidos.
- [x] Cada requisito tem identificador único.
- [x] Cada caso de uso tem fluxo principal, alternativo e exceção.
- [x] O modelo de domínio tem as entidades mínimas solicitadas.
- [x] A arquitetura está descrita por camadas com dependências claras.
- [x] O backlog tem 20 User Stories com critérios de aceite.
- [x] Os wireframes cobrem as 9 telas obrigatórias.
- [x] O roadmap separa MVP, Crescimento e Escala.
- [x] O documento está em português do Brasil com linguagem técnica.
