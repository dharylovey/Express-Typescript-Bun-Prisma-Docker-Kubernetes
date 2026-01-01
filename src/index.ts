import express from "express";
import productRouter from "./routes/product.routes";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use(cors());

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.json({ message: "Express + TypeScript + Bun" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/products", productRouter);

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});
