<role>
Você é um engenheiro de software sênior. Vai implementar uma **funcionalidade completa de carrinho de compras** no monorepo existente, criando endpoints REST no backend (Hono + SQLite) e a interface de usuário no frontend (React/Vite) com gerenciamento de estado global usando **Zustand**. O foco é criar uma experiência fluida de adicionar produtos ao carrinho, visualizar itens, atualizar quantidades e finalizar compras.
</role>

<dependent_tasks>
- Baseie-se nas tarefas anteriores:
  - `@tasks/task_1.md` (backend de produtos)
  - `@tasks/task_2.md` (frontend - listagem)
  - `@tasks/task_3.md` (edição/remoção)
  - `@tasks/task_4.md` (upload de imagens)
  - `@tasks/task_5.md` (visualização de produto + TanStack Router)
</dependent_tasks>

<contexto>
- O banco de dados **já possui** as tabelas necessárias:
  - `carts` (id, session_id, created_at, updated_at)
  - `cart_items` (id, cart_id, product_id, quantity, created_at, updated_at)
  - Indexes já criados para performance
- O frontend **já possui**:
  - Zustand instalado (v5.0.8) mas sem stores configuradas
  - TanStack Router configurado para navegação
  - React Query para data fetching
  - Componente `ProductCard` que já chama `useAddToCart()` (hook ainda não implementado)
- O backend **NÃO possui**:
  - Endpoints REST para carrinho
  - Prepared statements para operações de carrinho
  - Lógica de negócio para gerenciamento de carrinho
</contexto>

<escopo>
Esta tarefa implementa:

### Backend (`@backend/`)

1. **Endpoints REST para carrinho** (`@backend/src/cart.ts`):
   - `POST /api/cart/items` - Adicionar produto ao carrinho (cria carrinho se necessário)
   - `GET /api/cart` - Buscar carrinho ativo (com itens e produtos populados)
   - `PUT /api/cart/items/:id` - Atualizar quantidade de um item
   - `DELETE /api/cart/items/:id` - Remover item do carrinho
   - `DELETE /api/cart` - Limpar carrinho completo
   - `GET /api/cart/summary` - Buscar resumo (quantidade total de itens, valor total)

2. **Database operations** (`@backend/src/db.ts`):
   - Adicionar prepared statements para operações de carrinho em `getStatements()`
   - Queries otimizadas com JOIN para buscar itens com dados de produto

3. **Session management**:
   - Usar header `X-Session-Id` para identificar carrinho do usuário
   - Gerar session_id automaticamente no backend se não existir
   - Retornar session_id no header de resposta

4. **Validação e tipos**:
   - Schemas Zod para validação de input
   - Tipos TypeScript para Cart, CartItem, CartSummary
   - Tratamento de erros (produto não encontrado, item não existe, etc.)

### Frontend (`@frontend/src/`)

1. **Zustand Store** (`@/stores/cart-store.ts`):
   - Estado global: `sessionId`, `itemCount`, `totalAmount`
   - Actions: `setSessionId()`, `updateSummary()`, `clearCart()`
   - Persistência do sessionId no localStorage
   - Middleware de dev tools e immer para facilitar updates

2. **React Query Hooks** (`@/hooks/use-cart.ts`):
   - `useCart()` - Buscar carrinho completo
   - `useCartSummary()` - Buscar apenas resumo (para header)
   - `useAddToCart()` - Mutation para adicionar item
   - `useUpdateCartItem()` - Mutation para atualizar quantidade
   - `useRemoveCartItem()` - Mutation para remover item
   - `useClearCart()` - Mutation para limpar carrinho
   - Todas mutations invalidam queries relevantes automaticamente
   - Integração com Zustand store para atualizar summary

3. **Componentes UI**:
   - `@/components/cart-button.tsx` - Botão no header com badge de contagem
   - `@/components/cart-drawer.tsx` - Drawer lateral para visualizar carrinho
   - `@/components/cart-item-card.tsx` - Card de item individual no carrinho
   - `@/components/cart-summary.tsx` - Resumo de valores (subtotal, total)
   - `@/pages/cart-page.tsx` - Página completa do carrinho (rota `/cart`)

4. **Integrações**:
   - Atualizar `@/components/product-card.tsx` para usar `useAddToCart()` corretamente
   - Adicionar botão de carrinho no header/navbar
   - Adicionar rota `/cart` no router
   - Sincronizar sessionId com backend via interceptor

5. **UX e feedback**:
   - Toast notifications para ações (adicionado, removido, erro)
   - Loading states em botões e mutations
   - Empty state no carrinho vazio
   - Confirmação antes de limpar carrinho
   - Animações suaves no drawer e updates de quantidade
</escopo>

<backend_requirements>
- Stack: TypeScript, Hono, Bun, SQLite (seguir padrão do projeto)
- Criar arquivo `@backend/src/cart.ts` seguindo padrão de `products.ts`
- Validação com Zod para todos inputs
- Retornar erros HTTP apropriados (400, 404, 500)
- Session management via headers (não usar cookies)
- Queries otimizadas com JOIN para evitar N+1
- Transações para operações críticas (adicionar item)
- Testes em `@backend/src/cart.test.ts`
</backend_requirements>

<frontend_requirements>
- Stack: TypeScript, React, Vite, React Query, Zustand, TanStack Router (seguir padrão do projeto)
- Componentes UI: usar `@/components/ui/*` (shadcn) - Badge, Button, Card, Sheet/Drawer, Separator, ScrollArea
- Nomear arquivos em kebab-case (padrão do projeto)
- Validar dados com Zod (criar schemas em `@/types/cart.ts`)
- Hooks organizados em `@/hooks/use-cart.ts`
- Store Zustand em `@/stores/cart-store.ts`
- Caminhos relativos para API (`/api/cart`) via proxy do Vite
- Layout responsivo e acessível
- Estados: loading, error, empty state
- Animações suaves com Framer Motion (se necessário) ou CSS
</frontend_requirements>

<session_management>
O gerenciamento de sessão deve funcionar assim:

**Backend:**
1. Verificar header `X-Session-Id` em todas requests
2. Se não existir, gerar novo UUID e retornar em response header
3. Se existir mas carrinho não existe no DB, criar novo carrinho
4. Retornar sempre o `session_id` no header de resposta

**Frontend:**
1. Zustand store persiste `sessionId` no localStorage
2. Interceptor de fetch adiciona header `X-Session-Id` automaticamente
3. Ao receber novo session_id do backend, atualizar store
4. Hook `useCartSummary()` roda em background para manter contagem atualizada

**Fluxo de criação de carrinho:**
```
1. Usuário clica "Adicionar ao Carrinho"
2. Frontend envia POST /api/cart/items sem session_id (primeira vez)
3. Backend gera session_id, cria carrinho, adiciona item
4. Backend retorna session_id no header
5. Frontend salva session_id no store + localStorage
6. Próximas requests incluem session_id automaticamente
```
</session_management>

<database_schema>
As tabelas já existem no banco (ver `@backend/src/db.ts`):

```sql
-- Já criado
CREATE TABLE carts (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE cart_items (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Indexes já criados
CREATE INDEX idx_carts_session_id ON carts(session_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

**Prepared statements a adicionar em `getStatements()`:**
```typescript
// Cart operations
getCartBySessionId: db.prepare(`
  SELECT * FROM carts WHERE session_id = $sessionId
`),

insertCart: db.prepare(`
  INSERT INTO carts (id, session_id, created_at, updated_at)
  VALUES ($id, $sessionId, $createdAt, $updatedAt)
`),

updateCartTimestamp: db.prepare(`
  UPDATE carts SET updated_at = $updatedAt WHERE id = $id
`),

deleteCart: db.prepare(`
  DELETE FROM carts WHERE id = $id
`),

// Cart items operations
getCartItemsByCartId: db.prepare(`
  SELECT 
    ci.*,
    p.id as product_id,
    p.name as product_name,
    p.price as product_price,
    p.sku as product_sku
  FROM cart_items ci
  INNER JOIN products p ON ci.product_id = p.id
  WHERE ci.cart_id = $cartId
  ORDER BY ci.created_at DESC
`),

getCartItemById: db.prepare(`
  SELECT * FROM cart_items WHERE id = $id
`),

getCartItemByProductId: db.prepare(`
  SELECT * FROM cart_items 
  WHERE cart_id = $cartId AND product_id = $productId
`),

insertCartItem: db.prepare(`
  INSERT INTO cart_items (id, cart_id, product_id, quantity, created_at, updated_at)
  VALUES ($id, $cartId, $productId, $quantity, $createdAt, $updatedAt)
`),

updateCartItemQuantity: db.prepare(`
  UPDATE cart_items 
  SET quantity = $quantity, updated_at = $updatedAt 
  WHERE id = $id
`),

deleteCartItem: db.prepare(`
  DELETE FROM cart_items WHERE id = $id
`),

deleteCartItemsByCartId: db.prepare(`
  DELETE FROM cart_items WHERE cart_id = $cartId
`),
```
</database_schema>

<typing>
Criar tipos e schemas em `@/types/cart.ts`:

```typescript
import { z } from 'zod';

// Schemas Zod
export const cartItemSchema = z.object({
  id: z.string(),
  cartId: z.string(),
  productId: z.string(),
  quantity: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Dados do produto (populados via JOIN)
  product: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    sku: z.string(),
  }),
});

export const cartSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  items: z.array(cartItemSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const cartSummarySchema = z.object({
  itemCount: z.number().int().nonnegative(),
  totalAmount: z.number().nonnegative(),
});

export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID é obrigatório'),
  quantity: z.number().int().positive().default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantidade deve ser positiva'),
});

// Types
export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;
export type CartSummary = z.infer<typeof cartSummarySchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
```
</typing>

<file_structure>
Arquivos a criar/modificar:

### Backend
```
backend/src/
  cart.ts                 # NOVO: endpoints REST do carrinho
  cart.test.ts            # NOVO: testes dos endpoints
  db.ts                   # MODIFICAR: adicionar prepared statements
  index.ts                # MODIFICAR: registrar rotas do carrinho
```

### Frontend
```
frontend/src/
  types/
    cart.ts               # NOVO: tipos e schemas do carrinho
  stores/
    cart-store.ts         # NOVO: Zustand store global
  hooks/
    use-cart.ts           # NOVO: React Query hooks para carrinho
  components/
    cart-button.tsx       # NOVO: botão de carrinho no header
    cart-drawer.tsx       # NOVO: drawer lateral do carrinho
    cart-item-card.tsx    # NOVO: card de item individual
    cart-summary.tsx      # NOVO: resumo de valores
    product-card.tsx      # MODIFICAR: implementar useAddToCart corretamente
  pages/
    cart-page.tsx         # NOVO: página completa do carrinho
  lib/
    api-client.ts         # NOVO: interceptor para session_id
  router.tsx              # MODIFICAR: adicionar rota /cart
  App.tsx                 # MODIFICAR: adicionar CartButton no header
```
</file_structure>

<api_specification>
### Backend API Endpoints

#### POST /api/cart/items
Adicionar produto ao carrinho (cria carrinho se necessário)

**Request:**
```typescript
Headers: {
  'X-Session-Id'?: string
}
Body: {
  productId: string
  quantity: number // default: 1
}
```

**Response:** 201 Created
```typescript
Headers: {
  'X-Session-Id': string
}
Body: {
  id: string // cart_item id
  cartId: string
  productId: string
  quantity: number
  createdAt: string
  updatedAt: string
}
```

**Erros:**
- 400: Validation failed / Product não encontrado
- 500: Erro ao adicionar item

---

#### GET /api/cart
Buscar carrinho completo com itens

**Request:**
```typescript
Headers: {
  'X-Session-Id': string
}
```

**Response:** 200 OK
```typescript
Body: {
  id: string
  sessionId: string
  items: Array<{
    id: string
    cartId: string
    productId: string
    quantity: number
    createdAt: string
    updatedAt: string
    product: {
      id: string
      name: string
      price: number
      sku: string
    }
  }>
  createdAt: string
  updatedAt: string
}
```

**Erros:**
- 404: Carrinho não encontrado
- 500: Erro ao buscar carrinho

---

#### GET /api/cart/summary
Buscar apenas resumo (otimizado para header)

**Request:**
```typescript
Headers: {
  'X-Session-Id': string
}
```

**Response:** 200 OK
```typescript
Body: {
  itemCount: number    // soma de todas quantities
  totalAmount: number  // soma de (price * quantity)
}
```

**Se carrinho não existe:** retorna `{ itemCount: 0, totalAmount: 0 }`

---

#### PUT /api/cart/items/:id
Atualizar quantidade de um item

**Request:**
```typescript
Params: {
  id: string // cart_item id
}
Headers: {
  'X-Session-Id': string
}
Body: {
  quantity: number // deve ser > 0
}
```

**Response:** 200 OK
```typescript
Body: {
  id: string
  cartId: string
  productId: string
  quantity: number
  createdAt: string
  updatedAt: string
}
```

**Erros:**
- 400: Validation failed / Quantity inválida
- 404: Item não encontrado
- 500: Erro ao atualizar

---

#### DELETE /api/cart/items/:id
Remover item do carrinho

**Request:**
```typescript
Params: {
  id: string // cart_item id
}
Headers: {
  'X-Session-Id': string
}
```

**Response:** 204 No Content

**Erros:**
- 404: Item não encontrado
- 500: Erro ao remover

---

#### DELETE /api/cart
Limpar carrinho (remover todos os itens)

**Request:**
```typescript
Headers: {
  'X-Session-Id': string
}
```

**Response:** 204 No Content

**Erros:**
- 404: Carrinho não encontrado
- 500: Erro ao limpar
</api_specification>

<zustand_store_implementation>
Store em `@/stores/cart-store.ts`:

```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface CartState {
  sessionId: string | null;
  itemCount: number;
  totalAmount: number;
}

interface CartActions {
  setSessionId: (id: string) => void;
  updateSummary: (itemCount: number, totalAmount: number) => void;
  clearCart: () => void;
}

type CartStore = CartState & { actions: CartActions };

export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      immer((set) => ({
        sessionId: null,
        itemCount: 0,
        totalAmount: 0,
        actions: {
          setSessionId: (id: string) =>
            set((state) => {
              state.sessionId = id;
            }),
          updateSummary: (itemCount: number, totalAmount: number) =>
            set((state) => {
              state.itemCount = itemCount;
              state.totalAmount = totalAmount;
            }),
          clearCart: () =>
            set((state) => {
              state.itemCount = 0;
              state.totalAmount = 0;
            }),
        },
      })),
      {
        name: 'cart-storage',
        partialize: (state) => ({
          sessionId: state.sessionId,
          // Não persistir itemCount e totalAmount, vêm do servidor
        }),
      }
    ),
    { name: 'cart-store' }
  )
);

// Selector hooks para performance
export const useSessionId = () => useCartStore((state) => state.sessionId);
export const useCartItemCount = () => useCartStore((state) => state.itemCount);
export const useCartTotalAmount = () => useCartStore((state) => state.totalAmount);
export const useCartActions = () => useCartStore((state) => state.actions);
```
</zustand_store_implementation>

<behavior_details>
### UX e Comportamentos

**Adicionar ao carrinho:**
1. Usuário clica "Adicionar ao Carrinho" em qualquer card
2. Botão mostra loading ("Adicionando...")
3. Request enviada com session_id (se existir)
4. Backend adiciona item ou incrementa quantidade se já existe
5. Toast de sucesso: "Produto adicionado ao carrinho!"
6. Badge no ícone do carrinho atualiza automaticamente
7. Se erro: toast de erro com mensagem

**Visualizar carrinho:**
1. Usuário clica no ícone do carrinho no header
2. Drawer abre pela direita (mobile) ou sidebar (desktop)
3. Lista todos os itens com imagem, nome, preço, quantidade
4. Botões +/- para ajustar quantidade (atualiza no backend)
5. Botão X para remover item individual
6. Resumo fixo no bottom: subtotal, total
7. Botão "Finalizar Compra" (pode redirecionar ou mostrar modal)
8. Botão "Limpar Carrinho" (confirma antes)

**Estados:**
- **Loading:** skeleton cards enquanto busca carrinho
- **Empty state:** ilustração + texto "Seu carrinho está vazio" + botão "Ver produtos"
- **Error:** alert com mensagem de erro + botão "Tentar novamente"
- **Updating quantity:** botões +/- com loading

**Sincronização:**
- `useCartSummary()` polling a cada 30s (ou websocket no futuro)
- Após adicionar/remover/atualizar: invalidar queries e atualizar summary
- Se session_id mudar no backend, atualizar no store

**Página /cart:**
- Layout mais espaçoso que drawer
- Grid de produtos em cards maiores
- Resumo lateral (desktop) ou no bottom (mobile)
- Breadcrumb: Home > Carrinho
- Mesma funcionalidade que drawer
</behavior_details>

<constraints>
- **NÃO DEVE** usar cookies; usar apenas headers HTTP
- **NÃO DEVE** implementar checkout/pagamento (fora do escopo)
- **NÃO DEVE** implementar autenticação de usuário (usar session_id anônimo)
- **NÃO DEVE** alterar schema do banco de dados (já existe)
- **NÃO DEVE** usar state managers além de Zustand (não usar Context API)
- **DEVE** usar React Query para todas operações de API
- **DEVE** validar todos inputs com Zod (backend e frontend)
- **DEVE** seguir padrões do projeto (nomenclatura, estrutura, etc.)
- **DEVE** garantir type safety completo (TypeScript strict)
- **DEVE** implementar testes no backend
- **DEVE** otimizar queries SQL (usar JOIN, não N+1)
- **DEVE** tratar todos casos de erro apropriadamente
</constraints>

<boas_praticas>
### Backend
- Usar transações para operações críticas (adicionar item)
- Validar que produto existe antes de adicionar ao carrinho
- Retornar erros HTTP semânticos (400, 404, 500)
- Logs estruturados para debugging
- Queries otimizadas com índices

### Frontend
- Extrair lógica de negócio em hooks customizados
- Componentes focados em UI, hooks focados em lógica
- Loading states em todos botões de ação
- Feedback visual imediato (optimistic updates se possível)
- Acessibilidade: aria-labels, keyboard navigation
- Responsividade: mobile-first design
- Performance: usar React.memo() onde apropriado
- Evitar re-renders desnecessários: selector hooks do Zustand

### Geral
- Código limpo e bem documentado
- Seguir convenções do projeto (nomenclatura, estrutura)
- Type safety rigoroso (evitar `any`)
- Tratamento completo de erros
- UX consistente e intuitiva
</boas_praticas>

<nao_deve>
- Não implementar autenticação/login de usuário
- Não implementar checkout/pagamento
- Não usar cookies ou JWT (apenas session_id em header)
- Não alterar schema do banco de dados existente
- Não usar Redux/Context API/outras stores (apenas Zustand)
- Não fazer polling excessivo (máximo 30s de intervalo)
- Não carregar imagens de produto em alta resolução no carrinho (thumbnail)
- Não esquecer de invalidar queries após mutations
- Não usar cores hardcoded; usar design tokens do tema
- Não esquecer estados de loading/error/empty
- Não fazer requests desnecessárias (usar staleTime apropriado)
</nao_deve>

<referencias>
- Zustand Documentation: https://zustand.docs.pmnd.rs/
- Zustand Best Practices: https://zustand.docs.pmnd.rs/guides/best-practices
- TanStack React Query: https://tanstack.com/query/latest
- React Query Mutations: https://tanstack.com/query/latest/docs/framework/react/guides/mutations
- Hono Framework: https://hono.dev/
- Bun SQLite: https://bun.sh/docs/api/sqlite
- Shadcn/ui Components: https://ui.shadcn.com/
- Radix UI Sheet/Drawer: https://www.radix-ui.com/primitives/docs/components/dialog
- Accessibility Best Practices: https://www.w3.org/WAI/WCAG21/quickref/
</referencias>

<acceptance_criteria>
### Backend
- [ ] Arquivo `@backend/src/cart.ts` criado com todos os endpoints
- [ ] Prepared statements adicionados em `@backend/src/db.ts`
- [ ] Session management funcionando via headers
- [ ] Validação Zod em todos inputs
- [ ] Testes em `@backend/src/cart.test.ts` passando
- [ ] Queries otimizadas com JOIN (sem N+1)
- [ ] Tratamento de erros completo (400, 404, 500)
- [ ] `bun run dev` no backend funciona sem erros
- [ ] `bun test` no backend passa todos os testes

### Frontend
- [ ] Zustand store criada em `@/stores/cart-store.ts`
- [ ] Hooks React Query em `@/hooks/use-cart.ts`
- [ ] Tipos e schemas em `@/types/cart.ts`
- [ ] Componente `CartButton` no header com badge
- [ ] Componente `CartDrawer` funcionando
- [ ] Componente `CartItemCard` com +/- e remover
- [ ] Página `/cart` funcionando
- [ ] Rota `/cart` adicionada no router
- [ ] `ProductCard` usando `useAddToCart()` corretamente
- [ ] Interceptor de API adicionando `X-Session-Id`
- [ ] Loading states em todos botões
- [ ] Toast notifications em todas ações
- [ ] Empty state no carrinho vazio
- [ ] Responsividade mobile e desktop
- [ ] `bun run dev` no frontend funciona sem erros
- [ ] `bun lint` e `bun typecheck` passando

### Integração
- [ ] Adicionar item ao carrinho funciona
- [ ] Atualizar quantidade funciona
- [ ] Remover item funciona
- [ ] Limpar carrinho funciona
- [ ] Badge do carrinho atualiza automaticamente
- [ ] Session_id persiste entre reloads
- [ ] Drawer abre/fecha corretamente
- [ ] Navegação para `/cart` funciona
- [ ] Sincronização entre drawer e página
- [ ] Tratamento de erros end-to-end
</acceptance_criteria>

<output>
Além do código, forneça:

1. **Resumo de implementação:**
   - Endpoints criados no backend
   - Estrutura do Zustand store
   - Hooks criados no frontend
   - Componentes UI implementados
   - Integrações realizadas

2. **Decisões de design:**
   - Como funciona o session management
   - Por que escolheu headers vs cookies
   - Como sincronizar estado entre Zustand e React Query
   - Layout do drawer vs página completa

3. **Fluxo de uso:**
   - Passo a passo de adicionar produto ao carrinho
   - Como visualizar e gerenciar carrinho
   - Como session_id é gerenciado

4. **Próximos passos sugeridos:**
   - Implementar checkout (fora do escopo)
   - Adicionar autenticação de usuário
   - Implementar cupons de desconto
   - Adicionar cálculo de frete
   - Migrar session_id para JWT

5. **Testes realizados:**
   - Casos de teste do backend
   - Testes manuais do fluxo completo
   - Edge cases testados
</output>

