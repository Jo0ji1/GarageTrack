# Atividade 2 — Proposta Rápida de Aplicativo Móvel
npm start -- --host localhost
## 3.1 Identificação

- Nome(s): George Carlos, Lucas Borba
- Nome do aplicativo: GarageTrack.

## 3.2 Problema

Motoristas e motociclistas perdem registros de manutenção, esquecem prazos de revisão e não sabem com precisão quando trocar óleo, freios, pneus ou relação. Isso gera custos evitáveis, insegurança antes de viagens e perda de valor na revenda do veículo.

## 3.3 Solução Proposta

O GarageTrack organiza o histórico técnico do veículo, registra manutenção com quilometragem, custo, oficina, GPS, foto e áudio, e calcula automaticamente alertas preventivos por data e quilometragem. O app também oferece modo pré-viagem para avisar itens próximos do vencimento.

## 3.4 Público-Alvo

Proprietários de carros e motos que fazem manutenção preventiva, usam o veículo no dia a dia ou pretendem preservar histórico para segurança, economia e revenda.

## 3.5 Funcionalidades Principais

1. Cadastro e seleção de veículos.
2. Registro de manutenção com custo, quilometragem, checklist, foto, áudio e localização.
3. Histórico filtrável por categoria.
4. Cálculo de próxima revisão e alertas preventivos.
5. Mapa de oficinas e modo pré-viagem.

## 3.6 Fluxo Básico

1. Usuário abre o app.
2. Seleciona ou cadastra o veículo.
3. Registra uma manutenção realizada.
4. Anexa foto, áudio e localização da oficina.
5. Consulta o painel de saúde e recebe alertas de próximas revisões.
6. Antes de viajar, informa a distância prevista e verifica riscos.

## 3.7 Wireframe Simples

### Tela 1 — Início

```text
┌────────────────────────────┐
│ GarageTrack                │
│ [Civic Touring ▾]           │
├────────────────────────────┤
│ Quilometragem | Total gasto │
│ Último serviço | Próximo    │
├────────────────────────────┤
│ [Registrar manutenção]      │
│ [Modo pré-viagem]           │
└────────────────────────────┘
```

### Tela 2 — Registrar Manutenção

```text
┌────────────────────────────┐
│ Categoria: Óleo / Freios   │
│ Data | Km | Custo           │
│ Oficina                     │
│ Checklist dinâmico          │
│ [GPS] [Câmera] [Áudio]      │
│ [Salvar manutenção]         │
└────────────────────────────┘
```

### Tela 3 — Painel de Saúde

```text
┌────────────────────────────┐
│ Saúde do veículo            │
│ Óleo       [Atenção]        │
│ Freios     [OK]             │
│ Pneus      [OK]             │
│ Pré-viagem [Verificar]      │
└────────────────────────────┘
```

## 3.8 Tecnologias

- Linguagem: TypeScript.
- Plataforma: Expo/React Native para Android.
- Armazenamento: SQLite local.
- Recursos do dispositivo: GPS, câmera, galeria, microfone e notificações.
- Mapa: componente nativo de mapas.

## 3.9 Viabilidade

O app é viável em 20 dias porque o MVP funciona offline com SQLite, sem backend obrigatório. As funções nativas são integradas por bibliotecas do Expo e o escopo principal fica concentrado em poucos fluxos: registrar manutenção, consultar histórico, calcular alertas e visualizar mapa.

## 7. Nível Mínimo de Complexidade

- Lógica de negócio relevante: cálculo de próxima revisão por data e quilometragem, com critério que vence primeiro.
- Recursos do dispositivo: GPS, câmera, áudio e notificações.
- Persistência estruturada: veículos, manutenções, oficinas, avaliações e alertas relacionados.
- Fluxo não-trivial: dashboard, registro, histórico, mapa, pré-viagem e configuração de alertas.
