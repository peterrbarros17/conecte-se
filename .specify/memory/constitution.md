# Constituição do Projeto Conecte-se

## Princípios Fundamentais

### I. Simplicidade e Manutenção

Toda implementação DEVE resolver o problema atual com a menor quantidade de código,
camadas e configuração capaz de atendê-lo. Complexidade futura só PODE ser antecipada
quando houver evidência concreta de necessidade.

- Abstrações DEVEM ser introduzidas quando reduzirem complexidade, melhorarem a
  testabilidade ou eliminarem duplicação relevante. Não DEVEM ser criadas apenas para
  antecipar necessidades hipotéticas. Isolar uma integração externa ou viabilizar testes
  são justificativas válidas mesmo no primeiro uso.
- Novas dependências SÓ PODEM ser adicionadas com justificativa técnica registrada na
  mudança: problema que resolvem, alternativas consideradas e impacto em manutenção e
  tamanho do bundle.
- Código DEVE ser legível e autoexplicativo. Comentários DEVEM explicar o "porquê",
  não o "o quê".
- Código morto, exports não utilizados, logs de depuração e configurações redundantes
  NÃO DEVEM permanecer no repositório.
- A solução mais simples que atende aos critérios de qualidade desta constituição
  prevalece sobre soluções mais "elegantes" ou genéricas.

**Racional:** o Conecte-se é uma aplicação pessoal e pequena. Cada camada e dependência
adicional aumenta o custo de manutenção sem benefício proporcional.

### II. Type Safety

O projeto DEVE manter TypeScript em modo `strict` e contratos explícitos em todas as
fronteiras do sistema.

- `any` NÃO DEVE ser introduzido. Usar tipos precisos, genéricos, uniões e `unknown`
  com estreitamento explícito.
- Formatos de dados externos DEVEM ter tipos declarados em `src/types/` e ser validados
  ou estreitados antes do uso pela interface.
- Tipos TypeScript NÃO validam dados em runtime. Declarar uma interface e usar
  `await response.json() as CreatorData` apenas informa ao compilador como o objeto será
  tratado; não verifica o conteúdo recebido. Dados de APIs externas DEVEM passar por
  validação em runtime (checagem explícita de forma e tipo, ou biblioteca de validação)
  antes de serem tratados como o contrato declarado.
- Asserções de tipo (`as`) SÃO PERMITIDAS apenas quando o tipo for comprovadamente
  garantido no ponto de uso; não DEVEM ser usadas para silenciar erros nem como
  substituto de validação em runtime.
- `@ts-ignore` e `@ts-expect-error` NÃO DEVEM ser usados sem justificativa no código e
  revisão explícita. Preferir corrigir o tipo.
- Funções exportadas DEVEM declarar parâmetros e retorno. Contratos implícitos por
  inferência são aceitáveis apenas em funções locais triviais.
- `npm run typecheck` DEVE concluir sem erros antes de qualquer entrega.

**Racional:** contratos claros reduzem regressões em integrações com APIs externas e
tornam refatorações seguras em um projeto mantido por uma pessoa.

### III. Testabilidade

Comportamentos críticos e novas funcionalidades DEVEM ser cobertos por testes
automatizados com Jest e React Testing Library.

- Novas funcionalidades DEVEM incluir testes proporcionais ao risco e ao comportamento
  introduzido.
- Correções de defeito DEVEM incluir um teste de regressão sempre que o comportamento
  puder ser reproduzido de forma determinística.
- Testes DEVEM verificar comportamento observável (renderização, estados de erro,
  fallback, links e dados exibidos), não detalhes de implementação.
- Testes NÃO DEVEM depender de rede real. Requisições externas DEVEM ser simuladas
  (`fetch` mockado) e os testes DEVEM ser determinísticos e isolados.
- Testes DEVEM seguir a convenção existente de arquivos colocados junto ao código,
  com sufixo `.spec.ts` ou `.spec.tsx`.
- Snapshots NÃO DEVEM substituir asserções de comportamento.
- `npm test` DEVE passar integralmente antes de qualquer entrega.

**Racional:** os pontos mais sensíveis da aplicação são integrações externas e estados
de indisponibilidade; testes focados nesses comportamentos protegem a experiência sem
criar burocracia desproporcional ao tamanho do projeto.

### IV. Separação de Responsabilidades

Rotas, acesso a dados externos, tipos e interface DEVEM permanecer em módulos com
responsabilidades bem definidas, preservando a arquitetura atual.

- `src/app/` DEVE conter roteamento, layout e composição de página. Regras de acesso a
  serviços externos NÃO DEVEM ser embutidas nesse diretório.
- `src/api/` DEVE concentrar o acesso a serviços externos (URLs, parâmetros, tratamento
  de resposta e erros de integração).
- `src/types/` DEVE conter os contratos de dados compartilhados.
- `src/components/` DEVE conter componentes de interface coesos. Cada componente DEVE ter
  uma responsabilidade principal identificável.
- Componentes DEVEM consumir funções e tipos dos módulos apropriados, sem duplicar
  lógica de integração ou constantes de serviço.
- `"use client"` DEVE ser aplicado apenas onde houver interatividade ou APIs do
  navegador, no menor escopo possível.
- Lógica compartilhada DEVE ser extraída quando houver reutilização real ou quando a
  extração reduzir complexidade ou melhorar a testabilidade, respeitando o princípio de
  simplicidade.

**Racional:** a separação atual entre `app`, `api`, `components` e `types` mantém o
projeto navegável e permite alterar uma integração sem reescrever a interface.

### V. Resiliência

Falhas de integrações externas NÃO DEVEM comprometer funcionalidades independentes.

- Cada integração externa DEVE tratar falha de rede, resposta HTTP inválida e ausência
  de dados com fallback ou estado vazio explícito na interface.
- Uma falha em uma integração NÃO DEVE impedir a renderização das demais seções.
- Erros de controle de fluxo do Next.js DEVEM ser repropagados antes de qualquer
  fallback, preservando o comportamento de `unstable_rethrow` onde já aplicado.
- Blocos `catch` NÃO DEVEM ser silenciosos: DEVEM registrar o erro de forma útil ou
  produzir um fallback visível e intencional.
- Estratégias de cache e revalidação de `fetch` DEVEM ser explícitas e justificadas no
  código.
- Retentativas automáticas ou circuit breakers só PODEM ser introduzidos com necessidade
  comprovada; a solução padrão é fallback simples.

**Racional:** a aplicação depende de YouTube, GitHub Gist e imagem externa. A página
continua útil mesmo quando qualquer uma dessas dependências falha.

### VI. Segurança

Credenciais, variáveis de ambiente e dados sensíveis DEVEM permanecer protegidos.

- Segredos DEVEM ser acessados apenas no servidor. Chaves NÃO DEVEM usar o prefixo
  `NEXT_PUBLIC_` nem ser referenciadas em componentes cliente.
- `.env.local` e demais arquivos `.env*` NÃO DEVEM ser versionados. `.env.example` DEVE
  documentar apenas os nomes das variáveis, nunca valores reais.
- Segredos NÃO DEVEM aparecer em logs, mensagens de erro, testes, URLs versionadas ou
  código-fonte.
- Variáveis de ambiente DEVEM ser validadas ou ter fallback seguro no ponto de uso.
- Conteúdo externo NÃO DEVE ser interpretado como HTML. `dangerouslySetInnerHTML` só PODE
  ser usado com sanitização e justificativa explícita.
- Links externos abertos em nova aba DEVEM usar `rel="noopener noreferrer"`.
- Dependências DEVEM ser mínimas e revisadas quanto a manutenção e vulnerabilidades
  conhecidas antes da adoção.

**Racional:** mesmo sendo um projeto pessoal, vazamento de chaves de API e exposição de
dados de contato têm custo real e são evitáveis com disciplina simples.

## Restrições Técnicas e de Compatibilidade

- A stack DEVE permanecer Next.js com App Router, React e TypeScript. A arquitetura atual
  (`src/app`, `src/api`, `src/components`, `src/types`) DEVE ser preservada.
- A versão mínima de Node.js é 20.9, conforme `package.json` e `.nvmrc`.
- Banco de dados, backend próprio, filas, containers ou outra infraestrutura NÃO DEVEM
  ser introduzidos sem necessidade demonstrada, alternativa mais simples descartada e
  decisão registrada na mudança.
- Novas dependências NÃO DEVEM ser adicionadas sem justificativa técnica e sem avaliar
  impacto em manutenção, segurança e bundle.
- Funcionalidades existentes, rotas, contratos de dados e comportamento visível DEVEM ser
  preservados, salvo quando a mudança for explicitamente solicitada.
- Alterações de estilo DEVEM seguir Tailwind CSS e os padrões visuais existentes; um novo
  framework ou sistema de estilos NÃO DEVE ser introduzido.
- `npm run build` DEVE continuar funcionando após mudanças em rotas, configuração,
  dependências ou código de servidor.

## Fluxo de Desenvolvimento e Critérios de Qualidade

Fluxo esperado para cada mudança:

1. **Entender** — ler o código e os padrões relacionados antes de alterar; delimitar o
   escopo e identificar impactos em funcionalidades existentes.
2. **Planejar** — definir a menor mudança viável. Dependência, infraestrutura, abstração
   ou alteração de arquitetura DEVEM ter justificativa registrada.
3. **Implementar** — avançar em incrementos pequenos, preservando contratos e
   comportamento existente.
4. **Testar** — adicionar ou atualizar testes para o comportamento novo ou corrigido.
5. **Verificar** — executar `npm run verify`, que encadeia os três comandos obrigatórios:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`

   Executar `npm run verify` é suficiente para cumprir o gate mínimo, desde que o script
   continue encadeando os três comandos. Rodar os comandos individualmente é equivalente.
   Se o script for alterado e deixar de executar algum deles, os comandos faltantes DEVEM
   ser executados separadamente. `npm run build` também DEVE ser executado quando a
   mudança afetar rotas, configuração, dependências ou código de servidor.
6. **Revisar** — conferir o diff completo: sem alterações não relacionadas, sem segredos,
   sem código morto, sem logs de depuração e com documentação atualizada quando comandos,
   variáveis de ambiente ou comportamento mudarem.
7. **Reportar** — informar os comandos de verificação executados e seus resultados.

Critérios de qualidade para considerar uma implementação concluída:

- Lint sem erros e typecheck sem erros.
- Todos os testes passando; comportamentos críticos cobertos.
- Nenhum `any` ou supressão de tipo sem justificativa.
- Nenhum segredo ou dado sensível exposto.
- Nenhuma dependência ou infraestrutura não justificada.
- Funcionalidades existentes preservadas e compatibilidade mantida.
- Código consistente com a estrutura, nomenclatura e estilo do projeto.

## Governança

Esta constituição é a autoridade máxima sobre práticas de engenharia do projeto. Em caso
de conflito com convenções, documentação ou preferências locais, os princípios aqui
definidos prevalecem. `readme.md` e os scripts de `package.json` são referências
operacionais subordinadas a este documento.

**Emendas**

- Toda emenda DEVE ser proposta com motivação, impacto esperado, princípios afetados e
  plano de migração quando houver mudança incompatível.
- A aprovação é responsabilidade do mantenedor do projeto.
- A emenda DEVE atualizar este arquivo, o histórico de versão e a data de última alteração.
- O relatório de impacto da emenda é material temporário de revisão e DEVE ser removido
  antes do commit da constituição alterada.

**Versionamento semântico**

- **MAJOR**: remoção ou redefinição incompatível de princípio, seção ou regra de
  governança.
- **MINOR**: inclusão de princípio ou seção, ou expansão material de orientação existente.
- **PATCH**: esclarecimentos, correções de redação e refinamentos sem mudança semântica.

**Conformidade**

- Toda mudança DEVE ser verificada contra esta constituição antes de ser considerada
  concluída. Não conformidade bloqueia a entrega até correção ou emenda aprovada.
- Exceções de complexidade, dependência ou infraestrutura DEVEM ser justificadas na
  própria mudança. Exceções recorrentes DEVEM ser incorporadas por emenda.
- A revisão de conformidade DEVE ocorrer ao final de cada mudança e ser refeita quando a
  stack ou o escopo do projeto mudar materialmente.

**Version**: 1.1.0 | **Ratified**: 2026-11-10 | **Last Amended**: 2026-11-15
