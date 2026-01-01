import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Express CRUD API",
      version: "1.0.0",
      description:
        "A production-ready RESTful CRUD API with Express, Prisma, and Zod",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
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
        PaginatedProducts: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Product" },
            },
            meta: {
              type: "object",
              properties: {
                total: { type: "integer" },
                page: { type: "integer" },
                limit: { type: "integer" },
                totalPages: { type: "integer" },
              },
            },
          },
        },
        CursorPaginatedProducts: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Product" },
            },
            meta: {
              type: "object",
              properties: {
                hasNextPage: { type: "boolean" },
                nextCursor: { type: "string", nullable: true },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
