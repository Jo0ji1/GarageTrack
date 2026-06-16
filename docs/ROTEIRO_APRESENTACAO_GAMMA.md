# Roteiro de Apresentação - GarageTrack (Gamma)

Este guia foi feito para gerar uma apresentação no Gamma com foco em público acadêmico e colegas avaliadores.

## Objetivo da apresentação
- Explicar o problema real que o app resolve.
- Demonstrar como o GarageTrack funciona na prática.
- Destacar arquitetura, segurança e operação offline-first.
- Coletar feedback dos colegas sobre utilidade e melhorias.

## Prompt pronto para colar no Gamma
Crie uma apresentação em português do Brasil, com estilo profissional e moderno, sobre o aplicativo GarageTrack. O público são colegas de curso e professores avaliadores. Estruture em 14 slides, com narrativa clara, linguagem acessível e foco em utilidade prática.

Contexto do projeto:
- Nome: GarageTrack
- Tipo: app mobile de manutenção veicular
- Plataforma: Expo React Native
- Banco local: SQLite (offline-first)
- Nuvem opcional: Supabase com autenticação e sincronização
- Proposta principal: ajudar motoristas e motociclistas a registrar manutenções, custos, alertas e histórico do veículo, mesmo sem internet

Inclua os tópicos:
1) Problema do mundo real
2) Público-alvo
3) Solução proposta
4) Funcionalidades principais
5) Fluxo de uso (do cadastro do veículo até o histórico)
6) Arquitetura em camadas
7) Offline-first e sincronização
8) Segurança e privacidade
9) Diferenciais frente a planilhas/anotações comuns
10) Demonstração sugerida
11) Impacto e benefícios
12) Limitações atuais
13) Melhorias futuras
14) Perguntas para avaliação dos colegas

Tom e estilo:
- Evite texto excessivo por slide.
- Use bullets curtos e objetivos.
- Adicione exemplos práticos de uso.
- Feche com chamada para feedback do público.

## Estrutura sugerida (slide a slide)

## Slide 1 - Capa
- GarageTrack: manutenção veicular inteligente, mesmo offline.
- Subtítulo: organização, prevenção e economia no cuidado com o veículo.

## Slide 2 - O problema
- Muitos condutores não controlam manutenção de forma contínua.
- Informações ficam espalhadas em notas, conversas e papel.
- Resultado: atrasos, custos maiores e risco mecânico.

## Slide 3 - Público-alvo
- Motoristas e motociclistas.
- Pessoas que usam o veículo para trabalho, estudo ou rotina familiar.
- Usuários que precisam de solução simples e confiável sem internet constante.

## Slide 4 - Proposta de valor
- Centralizar histórico, custos e alertas em um único app.
- Funcionar 100% offline no dia a dia.
- Sincronizar na nuvem quando o usuário quiser.

## Slide 5 - Funcionalidades essenciais
- Cadastro e gestão de veículos.
- Registro de manutenção com data, km, custo e evidências.
- Histórico com busca e detalhamento.
- Alertas preventivos por tempo e quilometragem.

## Slide 6 - Fluxo de uso
- Cadastrar veículo.
- Registrar cada serviço realizado.
- Acompanhar status de saúde e próximos vencimentos.
- Consultar histórico e gastos por categoria.

## Slide 7 - Arquitetura técnica
- Camada de dados: SQLite local como fonte da verdade.
- Camada de domínio: regras de manutenção e validações.
- Camada de apresentação: telas e experiência do usuário.
- Serviços: recursos nativos e sincronização opcional com Supabase.

## Slide 8 - Offline-first na prática
- App continua útil sem login e sem internet.
- Operações locais são rápidas e resilientes.
- Sync é opcional, acionado manualmente e com fila automática.

## Slide 9 - Segurança e privacidade
- Autenticação por e-mail/senha e Google.
- Controle de acesso na nuvem por usuário (RLS no Supabase).
- Sem necessidade de expor dados sensíveis em logs de produção.

## Slide 10 - Diferenciais
- Mais especializado que planilhas genéricas.
- Histórico estruturado para decisões de manutenção.
- Foco em prevenção, não só registro reativo.

## Slide 11 - Demonstração sugerida
- Abrir app e mostrar dashboard.
- Criar/editar veículo.
- Registrar uma manutenção.
- Mostrar histórico e alertas.
- Exibir sincronização com nuvem.

## Slide 12 - Benefícios observáveis
- Melhor organização da vida útil do veículo.
- Redução de esquecimento de serviços críticos.
- Visibilidade de gastos para planejamento financeiro.

## Slide 13 - Limitações e próximos passos
- Melhorar isolamento de dados por conta em dispositivos compartilhados.
- Refinar onboarding para contas novas com veículo de exemplo opcional.
- Expandir relatórios e insights de custo ao longo do tempo.

## Slide 14 - Perguntas para avaliação dos colegas
- O app resolve uma dor real para você?
- O fluxo está simples para uso cotidiano?
- Que função faria mais diferença no seu contexto?
- O que reduziria atrito na primeira utilização?

## Roteiro de fala (5 a 8 minutos)
- Minuto 1: problema e contexto.
- Minuto 2: proposta e público.
- Minutos 3 e 4: funcionalidades + fluxo.
- Minuto 5: arquitetura offline-first e sync.
- Minuto 6: segurança e diferenciais.
- Minuto 7: limitações e roadmap.
- Minuto 8: perguntas e coleta de feedback.

## Critérios de avaliação sugeridos para a turma
- Utilidade percebida no dia a dia.
- Facilidade de uso.
- Clareza das informações exibidas.
- Confiança no registro e no histórico.
- Potencial de evolução do produto.

## Dicas de execução no Gamma
- Use 1 ideia principal por slide.
- Prefira visuais do app (prints) em vez de blocos longos de texto.
- Mantenha consistência de cores e tipografia.
- Termine com QR code para formulário de feedback.
