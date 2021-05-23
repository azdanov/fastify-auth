import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fastify } from "fastify";
import fastifyStatic from "fastify-static";
import fastifySensible from "fastify-sensible";
import fetch from "cross-fetch";
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

    app.get("/reset/:email/:exp/:token", {}, async (request, reply) =>
      reply.sendFile("reset.html")
    );

    app.get("/verify/:email/:token", {}, async (request, reply) => {
      try {
        const { email, token } = request.params;

        const httpsAgent = new https.Agent({
          rejectUnauthorized: false,
        });

        const response = await fetch(
          "https://api.fastify-auth.dev/api/verify",
          {
            method: "POST",
            body: JSON.stringify({ email, token }),
            credentials: "include",
            agent: httpsAgent,
            headers: { "Content-type": "application/json" },
          }
        );

        if (response.status === 200) {
          return reply.redirect("/");
        }
        reply.unauthorized();
      } catch (error) {
        console.log(error);
        reply.unauthorized();
      }
    });

    const PORT = process.env.PORT;
    await app.listen(PORT);
    console.log(`Server Web: http://localhost:${PORT}`);
  } catch (error) {
    console.log("e", error);
  }
}

startApp();
