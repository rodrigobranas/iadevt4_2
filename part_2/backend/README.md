# Backend API - E-commerce Products

API REST minimalista com Hono e SQLite para cadastro e listagem de produtos.

## Setup

```bash
# Instalar dependências
bun install

# Iniciar servidor de desenvolvimento
bun run dev

# Build para produção
bun run build

# Executar versão compilada
bun run start

# Executar testes
bun test

# Executar testes em modo watch
bun test:watch
```

## Configuração

Crie um arquivo `.env` na raiz do backend:

```env
PORT=3005
DATABASE_URL=./data/database.sqlite
```

## API Endpoints

### Health Check
```
GET /health
```

### Produtos

#### Criar Produto
```
POST /api/products
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "price": number,
  "sku": "string"
}
```

#### Listar Produtos
```
GET /api/products
```

#### Buscar Produto por ID
```
GET /api/products/:id
```

#### Imagens do Produto

Armazenamento local em `backend/uploads/products`, servido estaticamente via `GET /uploads/...`.

```
GET    /api/products/:id/images              # Lista imagens do produto (ordenadas por position ASC)
POST   /api/products/:id/images              # Upload de imagens (multipart/form-data, campo "images")
DELETE /api/products/:id/images/:imageId     # Remove imagem e arquivo local quando aplicável
```

Regras do upload (MVP):
- Até **5 arquivos** por request
- Até **5MB** por arquivo
- Tipos aceitos: `image/jpeg`, `image/png`, `image/webp`
- URLs salvas de forma relativa: `/uploads/products/<arquivo>`

## Exemplos de Requests

### Criar um produto
```bash
curl -X POST http://localhost:3005/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Notebook Dell XPS 13",
    "description": "Ultrabook premium com processador Intel Core i7",
    "price": 8999.99,
    "sku": "DELL-XPS-13-2024"
  }'
```

### Listar todos os produtos
```bash
curl http://localhost:3005/api/products
```

### Upload de imagens de um produto
```bash
curl -X POST http://localhost:3005/api/products/<PRODUCT_ID>/images \
  -F "images=@/caminho/para/imagem1.jpg" \
  -F "images=@/caminho/para/imagem2.png"
```

### Listar imagens de um produto
```bash
curl http://localhost:3005/api/products/<PRODUCT_ID>/images
```

### Remover uma imagem específica
```bash
curl -X DELETE http://localhost:3005/api/products/<PRODUCT_ID>/images/<IMAGE_ID>
```

## Modelo de Dados

```typescript
type Product = {
  id: string;          // UUID gerado automaticamente
  name: string;        // Nome do produto
  description: string; // Descrição do produto
  price: number;       // Preço em decimal
  sku: string;         // Código único do produto
  createdAt: string;   // ISO 8601 timestamp
}
```

## Estrutura do Projeto

```
backend/
├── src/
│   ├── index.ts     # Servidor principal e configuração
│   ├── db.ts        # Configuração do SQLite e statements
│   └── products.ts  # Router e handlers dos produtos
├── data/
│   └── database.sqlite  # Banco de dados SQLite (criado automaticamente)
└── .env             # Variáveis de ambiente
```

## Características

- ✅ TypeScript com tipagem forte
- ✅ Validação de dados com Zod
- ✅ SQLite com queries preparadas (Bun:sqlite nativo)
- ✅ CORS habilitado para `http://localhost:5173`
- ✅ Bootstrapping automático do schema
- ✅ Tratamento de erros básico
- ✅ Respostas JSON consistentes
- ✅ Suite de testes completa com Bun Test

## Testes

Os testes cobrem:
- ✅ Criação de produtos (POST /api/products)
- ✅ Listagem de produtos (GET /api/products)
- ✅ Busca por ID (GET /api/products/:id)
- ✅ Validação de dados inválidos
- ✅ Tratamento de SKU duplicado
- ✅ Campos obrigatórios
- ✅ Health check
- ✅ Configuração CORS

Execute com `bun test` para rodar todos os testes.
