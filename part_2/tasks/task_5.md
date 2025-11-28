<role>
Você é um engenheiro de software sênior. Vai implementar uma **tela de visualização/detalhes de produto** no frontend (React/Vite) do monorepo existente, integrando **TanStack Router** para navegação e consumindo os endpoints de produtos e imagens já implementados no backend (Hono + SQLite). O foco é criar uma experiência visual agradável para exibir todas as imagens do produto em um layout moderno.
</role>

<dependent_tasks>
- Baseie-se nas tarefas anteriores:
  - `@tasks/task_1.md` (backend de produtos)
  - `@tasks/task_2.md` (frontend - listagem)
  - `@tasks/task_3.md` (edição/remoção)
  - `@tasks/task_4.md` (upload de imagens)
</dependent_tasks>

<contexto>
- O projeto já possui infraestrutura de imagens no backend:
  - `GET /api/products/:id` retorna os dados de um produto.
  - `GET /api/products/:id/images` retorna todas as imagens ordenadas por position.
- O frontend atualmente exibe apenas a capa (primeira imagem) no grid de produtos.
- Atualmente o frontend NÃO usa roteamento; apenas renderiza `<ProductsPage />` direto no `App.tsx`.
- O TanStack Router já está no `package.json` mas ainda não foi configurado.
</contexto>

<escopo>
Esta tarefa implementa:

1. **Configuração do TanStack Router** no frontend:
   - Configurar o router com rotas tipadas (file-based routing opcional; configuração manual é mais simples).
   - Rota principal `/` para listagem de produtos.
   - Rota `/product/:id` para visualização de produto.

2. **Página de visualização de produto** (`@/pages/product-detail-page.tsx`):
   - Buscar dados do produto via `useQuery` com `GET /api/products/:id`.
   - Buscar imagens do produto via `useQuery` com `GET /api/products/:id/images`.
   - Layout moderno e agradável com:
     - **Galeria de imagens** como destaque principal (múltiplas visualizações).
     - Informações do produto (nome, descrição, preço, SKU).
     - Botões de ação (Voltar, Editar, Excluir).
   - Estados de loading, erro e produto não encontrado.

3. **Integração na listagem**:
   - Tornar os cards de produto clicáveis (navegação para `/product/:id`).
   - Usar `<Link>` do TanStack Router para navegação.

4. **Layout de galeria**:
   - use o Figma MCP com esse link https://www.figma.com/design/2ozcLy62AQ7GJ8VG8ear4A/Untitled?node-id=0-99&t=cndUDpghmi1JavpJ-4 como base
   - Layout responsivo (mobile-first).
</escopo>

<frontend_requirements>
- Stack: TypeScript, Vite, React Query, TanStack Router, Zod (seguir padrão do projeto).
- Componentes UI: usar `@/components/ui/*` (shadcn) como Button, Card, Badge, Skeleton, Alert, AspectRatio, etc.
- Nomear arquivos de componentes em kebab-case (padrão do projeto): `product-detail-page.tsx`.
- Validar dados com Zod (reuso dos schemas existentes).
- Hooks:
  - `useProductById(id)` em `@/hooks/use-products.ts` — busca um produto específico.
  - `useProductImages(id)` (já existe) — busca imagens do produto.
- Caminhos relativos para API (`/api/...`, `/uploads/...`) via proxy do Vite (já configurado).
- Estados: loading (skeleton), error (alert), not found (mensagem customizada).
- Layout responsivo e acessível.
</frontend_requirements>

<backend_context>
Endpoints disponíveis (implementados em tarefas anteriores):

- `GET /api/products/:id` → retorna um produto ou 404.
- `GET /api/products/:id/images` → lista imagens ordenadas por position.

**Não é necessário alterar o backend para esta tarefa.**
</backend_context>

<layout_sugerido>
- use o Figma MCP com esse link https://www.figma.com/design/2ozcLy62AQ7GJ8VG8ear4A/Untitled?node-id=0-99&t=cndUDpghmi1JavpJ-4 como base
</layout_sugerido>

<typing>
Reuse tipos e schemas existentes em `@/types/product.ts`:

```ts
// Já existente no projeto
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  createdAt: string;
}

export type ProductImage = {
  id: string;
  url: string;
  position: number;
  createdAt: string;
}
```

Hook adicional para buscar produto por ID:

```ts
// @/hooks/use-products.ts (adicionar)
export function useProductById(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Produto não encontrado')
        }
        throw new Error('Erro ao buscar produto')
      }
      const data = await response.json()
      return productSchema.parse(data)
    },
    enabled: !!id,
  })
}
```
</typing>

<file_structure>
Arquivos a criar/modificar em `@frontend/src/`:

```
src/
  router.tsx                   # NOVO: configuração do TanStack Router
  main.tsx                     # MODIFICAR: integrar RouterProvider
  App.tsx                      # MODIFICAR: usar Outlet do router (layout compartilhado)
  pages/
    products-page.tsx          # MODIFICAR: tornar cards clicáveis com Link
    product-detail-page.tsx    # NOVO: página de detalhes do produto
  hooks/
    use-products.ts            # MODIFICAR: adicionar useProductById
  components/
    product-card.tsx           # MODIFICAR: adicionar Link para navegação
    image-gallery.tsx          # NOVO (opcional): componente de galeria reutilizável
```
</file_structure>

<behavior_details>
- **Loading:** exibir skeleton com layout similar à página final (imagem + informações).
- **Erro:** exibir `Alert` com mensagem de erro e botão "Voltar".
- **Não encontrado (404):** exibir mensagem amigável (ex.: "Produto não encontrado") e botão "Voltar para lista".
- **Galeria:** ao clicar em miniatura, alterar imagem principal com transição suave (opcional).
- **Navegação:** cards clicáveis no grid; breadcrumb/botão voltar na página de detalhes.
- **Ações (Editar/Excluir):** reusar componentes/lógica existentes (`EditProductDialog`, `useDeleteProduct`).
- **Após exclusão:** navegar automaticamente para `/` e mostrar toast de sucesso.
</behavior_details>

<tanstack_router_key_concepts>
O TanStack Router é um router totalmente tipado com foco em type safety e DX. Conceitos-chave:

1. **Rotas tipadas:** parâmetros e search params são inferidos automaticamente.
2. **Parâmetros dinâmicos:** usar `$id` (não `:id`) no caminho da rota.
3. **Navegação:**
   - Componente `<Link>`: `<Link to="/product/$id" params={{ id: '123' }}>Ver</Link>`
   - Hook `useNavigate()`: `const navigate = useNavigate(); navigate({ to: '/' })`
4. **Extrair parâmetros:** `const { id } = useParams({ from: '/product/$id' })`
5. **Layout compartilhado:** usar `<Outlet />` no componente raiz para renderizar rotas filhas.

**Dica:** TanStack Router v1 usa configuração imperativa (não file-based por padrão), como mostrado em `<routing_setup>`.
</tanstack_router_key_concepts>

<constraints>
- **NÃO DEVE** alterar o schema de `Product` ou `ProductImage`.
- **NÃO DEVE** modificar o backend para esta tarefa.
- **NÃO DEVE** usar bibliotecas de terceiros para galeria (implementar simples com componentes do projeto).
- **NÃO DEVE** fazer fetch direto na página; usar hooks com React Query.
- **NÃO DEVE** hardcodar host/porta; usar caminhos relativos (`/api/...`, `/uploads/...`).
- **DEVE** manter TypeScript, Zod, React Query, TanStack Router e padrões do projeto.
- **DEVE** seguir nomenclatura kebab-case para arquivos de componentes.
- **DEVE** usar componentes de UI existentes em `@/components/ui/*`.
- **DEVE** garantir responsividade e acessibilidade (alt text, keyboard navigation).
</constraints>

<boas_praticas>
- **Type safety:** aproveitar inferência de tipos do TanStack Router.
- **Reuso de código:** reutilizar hooks, componentes e lógica existentes (ex.: `EditProductDialog`, `useDeleteProduct`).
- **Estados de carregamento:** skeleton com layout semelhante à UI final para evitar layout shift.
- **Feedback visual:** loading states, hover effects, transições suaves.
- **Acessibilidade:** alt text descritivo, keyboard navigation, ARIA labels.
- **Responsividade:** mobile-first, testar em diferentes tamanhos de tela.
- **Separação de concerns:** extrair galeria para componente separado se ficar complexo.
- **Error boundaries:** considerar adicionar error boundary na rota (TanStack Router suporta nativamente).
- **Performance:** lazy load de imagens se necessário (atributo `loading="lazy"`).
</boas_praticas>

<nao_deve>
- Não usar `react-router-dom`; usar **TanStack Router**.
- Não implementar file-based routing (configuração manual é mais simples para este MVP).
- Não carregar todas as imagens em resolução máxima de uma vez (se houver muitas, considerar lazy loading).
- Não esquecer de invalidar cache do React Query após edição/exclusão.
- Não fazer navegação manual com `window.location` ou manipulação de histórico; usar APIs do TanStack Router.
- Não duplicar lógica de edição/exclusão; reutilizar componentes existentes.
- Não usar cores hardcoded do Tailwind; usar design tokens do tema.
- Não esquecer estados de erro e not found (UX completa).
</nao_deve>

<referencias>
- TanStack Router v1: https://tanstack.com/router/latest
- TanStack Router - Type-safe Navigation: https://tanstack.com/router/latest/docs/framework/react/guide/navigation
- TanStack Router - Route Params: https://tanstack.com/router/latest/docs/framework/react/guide/route-params
- TanStack React Query: https://tanstack.com/query/latest
- Radix UI AspectRatio: https://www.radix-ui.com/primitives/docs/components/aspect-ratio
- Shadcn/ui Components: https://ui.shadcn.com/
- Accessibility - Alt Text: https://www.w3.org/WAI/tutorials/images/
</referencias>

<acceptance_criteria>
- Em `@frontend/`, `bun run dev` inicia em `http://localhost:5173` com roteamento funcional.
- Rota `/` exibe o grid de produtos (comportamento atual preservado).
- Rota `/product/:id` exibe página de detalhes com:
  - Galeria de imagens (principal + miniaturas clicáveis).
  - Informações do produto (nome, descrição, preço, SKU).
  - Botões: Voltar, Editar, Excluir (funcionais).
- Cards na listagem são clicáveis e navegam para `/product/:id`.
- Estados de loading, error e not found implementados e visuais.
- Layout responsivo (desktop e mobile).
- Após exclusão, navega de volta para `/` automaticamente.
- TypeScript sem erros, lint passando, build funcionando.
- Navegação tipada (sem erros de tipo ao usar `Link` e `useNavigate`).
- Layout seguindo o Figma estritamente
</acceptance_criteria>

<output>
Além do código, forneça:

1. **Resumo de implementação:**
   - O que foi adicionado/modificado.
   - Decisões de design e layout da galeria.
   - Como o TanStack Router foi configurado.

2. **Exemplos de navegação:**
   - Como acessar a página de detalhes (URL).
   - Como as ações (Editar/Excluir) se comportam na página de detalhes.

3. **Screenshots ou descrição visual:**
   - Descrever como ficou o layout da galeria (ou incluir screenshot se possível).
   - Layout desktop vs mobile.

4. **Decisões técnicas:**
   - Por que escolheu configuração manual vs file-based routing.
   - Como a galeria foi estruturada (componente separado ou inline).
   - Quais componentes shadcn/ui foram utilizados.
</output>

