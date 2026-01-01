# Express CRUD API

A production-ready RESTful API built with **Express.js**, **TypeScript**, **Bun**, **Prisma ORM**, **Zod validation**, **PostgreSQL**, **Docker**, and **Kubernetes**.

## ✨ Features

- 🚀 **Express 5.x** with TypeScript
- 📦 **Bun** as the JavaScript runtime
- 🗄️ **Prisma ORM** with PostgreSQL
- ✅ **Zod** for request validation
- 📄 **Swagger/OpenAPI** documentation
- 🐳 **Docker & Docker Compose** for development
- ☸️ **Kubernetes** manifests for deployment
- 📊 **Pagination** support (offset & cursor-based)

## 📁 Project Structure

```
├── src/
│   ├── config/         # Configuration (Swagger, etc.)
│   ├── controllers/    # Route handlers
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── schemas/        # Zod validation schemas
│   └── index.ts        # Application entry point
├── prisma/
│   └── schema.prisma   # Database schema
├── k8s/                # Kubernetes manifests
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed
- [Docker](https://www.docker.com/) installed

### Using Docker Compose (Recommended)

```bash
# Start all services (API + PostgreSQL + pgAdmin)
docker compose up -d

# Sync database schema (first time only)
docker compose exec api bunx prisma db push

# With watch mode for development
docker compose up --watch
```

**Services:**
| Service | URL | Credentials |
|-----------|------------------------------|--------------------------|
| API | http://localhost:3000 | - |
| Swagger | http://localhost:3000/api-docs | - |
| pgAdmin | http://localhost:5050 | admin@admin.com / admin |

### Local Development (Without Docker for API)

1. **Install dependencies:**

   ```bash
   bun install
   ```

2. **Start PostgreSQL with Docker:**

   ```bash
   docker compose up postgres -d
   ```

3. **Configure environment variables:**

   ```bash
   # .env file
   PORT=3000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mydb
   NODE_ENV="development"
   ```

4. **Sync database schema:**

   ```bash
   bunx prisma db push
   ```

5. **Start the development server:**
   ```bash
   bun run dev
   ```

## 📚 API Endpoints

### Products

| Method | Endpoint           | Description                      |
| ------ | ------------------ | -------------------------------- |
| POST   | `/products`        | Create a new product             |
| GET    | `/products/offset` | Get products (offset pagination) |
| GET    | `/products/cursor` | Get products (cursor pagination) |
| PUT    | `/products/:id`    | Update a product                 |
| DELETE | `/products/:id`    | Delete a product                 |

### Other Endpoints

| Method | Endpoint  | Description     |
| ------ | --------- | --------------- |
| GET    | `/`       | Welcome message |
| GET    | `/health` | Health check    |

## 📖 API Usage Examples

### Create a Product

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse",
    "price": 29.99,
    "stock": 100
  }'
```

### Get Products (Offset Pagination)

```bash
curl "http://localhost:3000/products/offset?page=1&limit=10"
```

**Response:**

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Get Products (Cursor Pagination)

```bash
# First request
curl "http://localhost:3000/products/cursor?limit=10"

# Next page using cursor
curl "http://localhost:3000/products/cursor?limit=10&cursor=<nextCursor>"
```

**Response:**

```json
{
  "data": [...],
  "meta": {
    "nextCursor": "abc123",
    "hasNextPage": true
  }
}
```

### Update a Product

```bash
curl -X PUT http://localhost:3000/products/<product-id> \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product Name",
    "price": 39.99
  }'
```

### Delete a Product

```bash
curl -X DELETE http://localhost:3000/products/<product-id>
```

## 🗄️ Database Schema

```prisma
model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Decimal
  stock       Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## ☸️ Kubernetes Deployment

```bash
# Apply all manifests
kubectl apply -f k8s/

# Verify deployment
kubectl get pods
kubectl get services
```

## 🛠️ Available Scripts

| Command                   | Description                    |
| ------------------------- | ------------------------------ |
| `bun run dev`             | Start development server       |
| `bun run start`           | Start production server        |
| `bunx prisma db push`     | Sync schema to database        |
| `bunx prisma migrate dev` | Create and run migrations      |
| `bunx prisma studio`      | Open Prisma Studio             |
| `bunx prisma generate`    | Generate Prisma Client         |
| `bun prisma/seed.ts`      | Seed database with sample data |

### Seeding in Docker

```bash
docker compose exec api bun prisma/seed.ts
```

## 📝 License

MIT
