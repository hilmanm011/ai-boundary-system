import dotenv from "dotenv";
dotenv.config();

import express from "express";
import aiRoutes from "./routes/ai.routes.js";
import { checkConnection } from "./db/client.js";

const app = express();
app.use(express.json());

app.use("/ai", aiRoutes);

async function start() {
  await checkConnection();
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}

start();
