import { fastify } from "fastify";
import fastifyStatic from "fastify-static";
import fastifySensible from "fastify-sensible";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = fastify();

async function startApp() {
  try {
    app.register(fastifySensible);

    app.register(fastifyStatic, {
      root: path.join(__dirname, "public"),
    });

    const PORT = process.env.PORT;
    await app.listen(PORT);
    console.log(`Server Web: http://localhost:${PORT}`);
  } catch (error) {
    console.log("e", error);
  }
}

startApp();
