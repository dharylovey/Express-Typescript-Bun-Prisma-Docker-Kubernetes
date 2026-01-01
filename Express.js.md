# Production-Ready Express.js (TypeScript) CRUD API Guide

This guide details how to build a scalable, secure, and typed RESTful API using Express, Prisma, Zod, and PostgreSQL. It includes Docker and Kubernetes configurations for deployment.

## 1. Project Setup & Structure

Initialize the project (assuming using **Bun** for package management as preferred, but using standard `tsc` build for production requirements).

```bash
bun init
bun add express prisma @prisma/client zod dotenv cors helmet morgan
bun add -d typescript @types/node @types/express @types/cors @types/morgan ts-node nodemon
```

Initialize Prisma:

```bash
bunx prisma init
```

Create the folder structure:

```bash
mkdir -p src/{config,controllers,dtos,middlewares,repositories,routes,services,utils,validators}
```

**Folder Structure:**

```
src/
├── config/         # Env vars and DB config
├── controllers/    # Request handlers
├── dtos/           # Data Transfer Objects
├── middlewares/    # Error handling, Auth
├── repositories/   # DB interactions (Prisma)
├── routes/         # Express routers
├── services/       # Business logic
├── utils/          # Helpers (Pagination)
├── validators/     # Zod schemas
└── app.ts          # App entry point
```

## 2. Configuration & Environment

Create `.env`:

```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
NODE_ENV="development"
```

**`src/config/env.ts`**:

```typescript
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export const env = envSchema.parse(process.env);
```

**`src/config/db.ts`** (Custom Path for Prisma 7):

```typescript
import { PrismaClient } from "../generated/prisma";

export const prisma = new PrismaClient();
```

## 3. Database Schema (Prisma 7)

**`prisma/schema.prisma`**:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Decimal
  stock       Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([createdAt]) // Important for cursor pagination
}
```

Run migration:

```bash
bunx prisma migrate dev --name init
# Or in Docker:
docker compose exec api bunx prisma db push
```

### Prisma 7 Configuration

**`prisma.config.ts`** (Required for Prisma 7):

```typescript
import { defineConfig, env } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

## 4. Validation (Zod)

**`src/validators/product.validator.ts`**:

```typescript
import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    description: z.string().optional(),
    price: z.number().positive(),
    stock: z.number().int().nonnegative(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().nonnegative().optional(),
  }),
});

export const querySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
    cursor: z.string().optional(),
  }),
});
```

## 4.2. Swagger API Documentation

Install Swagger packages:

```bash
bun add swagger-ui-express swagger-jsdoc
bun add -d @types/swagger-ui-express @types/swagger-jsdoc
```

**`src/config/swagger.ts`**:

```typescript
import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Express CRUD API",
      version: "1.0.0",
      description: "A production-ready RESTful CRUD API",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      schemas: {
        Product: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            price: { type: "number" },
            stock: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateProduct: {
          type: "object",
          required: ["name", "price", "stock"],
          properties: {
            name: { type: "string", minLength: 3 },
            description: { type: "string" },
            price: { type: "number", minimum: 0 },
            stock: { type: "integer", minimum: 0 },
          },
        },
        UpdateProduct: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 3 },
            description: { type: "string" },
            price: { type: "number", minimum: 0 },
            stock: { type: "integer", minimum: 0 },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
```

Add to **`src/index.ts`**:

```typescript
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

// After middleware setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

Add JSDoc annotations to routes (example):

```typescript
/**
 * @openapi
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProduct'
 *     responses:
 *       201:
 *         description: Product created
 */
productRouter.post("/", createProduct);
```

Access Swagger UI at: **http://localhost:3000/api-docs**

## 4.5. Data Transfer Objects (DTOs)

**`src/dtos/product.dto.ts`**:

```typescript
export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock: number;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
}
```

## 5. Repository Layer

**`src/repositories/product.repository.ts`**:

```typescript
import { prisma } from "../config/db";
import type { Product, Prisma } from "../../prisma/generated/client";

export class ProductRepository {
  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    return prisma.product.create({ data });
  }

  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id } });
  }

  // Offset-based
  async findAllOffset(skip: number, take: number) {
    const [data, total] = await prisma.$transaction([
      prisma.product.findMany({ skip, take, orderBy: { createdAt: "desc" } }),
      prisma.product.count(),
    ]);
    return { data, total };
  }

  // Cursor-based
  // Requires a unique, sequential field or timestamp + ID tiebreaker.
  // Using createdAt + id for stability.
  async findAllCursor(take: number, cursor?: string) {
    const query: Prisma.ProductFindManyArgs = {
      take: take + 1, // Fetch one extra to determine 'hasNextPage'
      orderBy: { createdAt: "desc" },
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1; // Skip the cursor itself
    }

    const data = await prisma.product.findMany(query);
    return data;
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    return prisma.product.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Product> {
    return prisma.product.delete({ where: { id } });
  }
}
```

## 6. Service Layer & Pagination Logic

**`src/services/product.service.ts`**:

```typescript
import { ProductRepository } from "../repositories/product.repository";
import type { CreateProductDto, UpdateProductDto } from "../dtos/product.dto";

export class ProductService {
  private repo = new ProductRepository();

  async createProduct(data: CreateProductDto) {
    return this.repo.create(data);
  }

  async getProductsOffset(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const { data, total } = await this.repo.findAllOffset(skip, limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductsCursor(limit: number = 10, cursor?: string) {
    const items = await this.repo.findAllCursor(limit, cursor);
    const hasNextPage = items.length > limit;
    const data = hasNextPage ? items.slice(0, -1) : items;
    const nextCursor = hasNextPage ? data[data.length - 1]?.id : undefined;
    return {
      data,
      meta: {
        hasNextPage,
        nextCursor,
      },
    };
  }

  async updateProduct(id: string, data: UpdateProductDto) {
    const product = await this.repo.findById(id);
    if (!product) {
      throw new Error(`Product not found with id ${id}`);
    }
    return this.repo.update(id, data);
  }

  async deleteProduct(id: string) {
    const product = await this.repo.findById(id);
    if (!product) {
      throw new Error(`Product not found with id ${id}`);
    }
    return this.repo.delete(id);
  }
}
```

> **Why Cursor Pagination?**
> Offset pagination (`OFFSET 100000 LIMIT 10`) gets slower as the dataset grows because the database must count and skip rows. Cursor pagination uses an index (like `WHERE createdAt < last_seen_date`) to jump directly to the next page, maintaining O(1) performance regardless of data size.

## 7. Controllers

**`src/controllers/product.controller.ts`**:

> **Important:** Zod schemas expect wrapped objects (e.g., `{ body: ... }`). When using them in controllers, you must wrap the request objects accordingly.

```typescript
import type { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service";
import {
  createProductSchema,
  querySchema,
  updateProductSchema,
} from "../validators/product.validator";

const service = new ProductService();

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Wrap req.body to match schema structure: { body: { ... } }
  const { body } = createProductSchema.parse({ body: req.body });
  try {
    const product = await service.createProduct(body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const getProductsOffset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { query } = querySchema.parse({ query: req.query });
  try {
    const parsedLimit = Number(query.limit) || 10;
    const parsedPage = Number(query.page) || 1;
    const data = await service.getProductsOffset(parsedPage, parsedLimit);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getProductsCursor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { query } = querySchema.parse({ query: req.query });
  try {
    const parsedLimit = Number(query.limit) || 10;
    const parsedCursor = (query.cursor as string) || undefined;
    const data = await service.getProductsCursor(parsedLimit, parsedCursor);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = updateProductSchema.parse({
    params: req.params,
    body: req.body,
  });
  try {
    const { id } = params;
    const data = await service.updateProduct(id, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = updateProductSchema.parse({
    params: req.params,
    body: {},
  });
  try {
    const { id } = params;
    const data = await service.deleteProduct(id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};
```

## 7.2. Routes

**`src/routes/product.routes.ts`**:

```typescript
import { Router } from "express";
import {
  createProduct,
  getProductsOffset,
  getProductsCursor,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controllers";

const productRouter = Router();

productRouter.post("/", createProduct);
productRouter.get("/offset", getProductsOffset);
productRouter.get("/cursor", getProductsCursor);
productRouter.put("/:id", updateProduct);
productRouter.delete("/:id", deleteProduct);

export default productRouter;
```

## 7.5. Application Entry Point

**`src/app.ts`**:

```typescript
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import productRoutes from "./routes/product.routes";

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/products", productRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Basic Error Handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
);

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
```

**`Dockerfile`** (Bun):

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock* /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Copy source and generate prisma
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
RUN bunx prisma generate

# Final release image
FROM base AS release
COPY --from=prerelease /app/node_modules node_modules
COPY --from=prerelease /app/src src
COPY --from=prerelease /app/package.json .
COPY --from=prerelease /app/prisma prisma
COPY --from=prerelease /app/prisma.config.ts .

USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]
```

**`docker-compose.yml`**:

> **Important:** Ensure `DATABASE_URL` credentials match `POSTGRES_USER` and `POSTGRES_PASSWORD`.

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/mydb
    depends_on:
      - postgres
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mydb
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### Docker Commands

```bash
# Build and start
docker compose build --no-cache
docker compose up -d

# Run Prisma migrations inside container
docker compose exec api bunx prisma db push

# Reset database (removes volume)
docker compose down -v
docker compose up -d
```

## 8.2. Kubernetes

### Prerequisites

Enable Kubernetes in Docker Desktop:

1. Open Docker Desktop → Settings → **Kubernetes** → Check "Enable Kubernetes" → Apply & Restart
2. Wait for the green "Kubernetes running" indicator

Verify setup:

```bash
kubectl version
kubectl get nodes
```

### Kubernetes Manifests

Create all files in a `k8s/` directory:

**`k8s/configmap.yaml`** - Non-sensitive environment variables:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  NODE_ENV: "production"
```

**`k8s/secret.yaml`** - Sensitive data (DATABASE_URL):

```yaml
# WARNING: In production, use kubectl create secret or external secret managers
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
type: Opaque
stringData:
  DATABASE_URL: "postgresql://postgres:postgres@postgres-service:5432/mydb"
```

**`k8s/postgres.yaml`** - Database deployment with persistent storage:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_USER
              value: "postgres"
            - name: POSTGRES_PASSWORD
              value: "postgres"
            - name: POSTGRES_DB
              value: "mydb"
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: postgres-storage
          persistentVolumeClaim:
            claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
```

**`k8s/deployment.yaml`** - API deployment with service:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: express-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: express-api
  template:
    metadata:
      labels:
        app: express-api
    spec:
      containers:
        - name: express-api
          image: express-crud-api-api:latest
          imagePullPolicy: Never # Use local Docker image
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: api-config
            - secretRef:
                name: api-secrets
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          resources:
            requests:
              memory: "128Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: express-api-service
spec:
  type: NodePort
  selector:
    app: express-api
  ports:
    - port: 3000
      targetPort: 3000
      nodePort: 30000 # Access via localhost:30000
```

### Deploy to Kubernetes

```bash
# Apply all manifests in order
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/deployment.yaml

# Watch pods until ready
kubectl get pods -w

# Run database migration (uses deployment to auto-select a pod)
kubectl exec -it deployment/express-api -- bunx prisma db push

# Test the API
curl http://localhost:30000/health
curl http://localhost:30000/products/offset
```

### Useful Kubernetes Commands

| Command                           | Description                   |
| --------------------------------- | ----------------------------- |
| `kubectl get pods`                | List all pods                 |
| `kubectl get services`            | List all services             |
| `kubectl logs <pod-name>`         | View pod logs                 |
| `kubectl describe pod <pod-name>` | Debug pod issues              |
| `kubectl delete -f k8s/`          | Delete all resources          |
| `kubectl get pvc`                 | List persistent volume claims |

### Docker Compose vs Kubernetes

| Docker Compose        | Kubernetes                |
| --------------------- | ------------------------- |
| `docker compose up`   | `kubectl apply -f k8s/`   |
| `docker compose down` | `kubectl delete -f k8s/`  |
| `docker compose logs` | `kubectl logs <pod-name>` |
| Single node           | Can scale across nodes    |
| `depends_on`          | Uses readiness probes     |

## 9. Best Practices Summary

- **Security**: Use `helmet`, `cors`, and validate all inputs with `zod`.
- **Architecture**: Keep business logic in Services, not Controllers.
- **Performance**: Use Cursor pagination for lists that grow indefinitely.
- **Reliability**: Graceful shutdown, health check endpoints (`/health`), and structured logging.
