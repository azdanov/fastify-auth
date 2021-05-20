import "./environment.js";
import { fastify } from "fastify";
import fastifyStatic from "fastify-static";
import fastifyCookie from "fastify-cookie";
import fastifySensible from "fastify-sensible";
import fastifyCors from "fastify-cors";
import { connectDatabase } from "./database.js";
import { registerUser } from "./accounts/register.js";
import { login, logout } from "./accounts/auth.js";
import { getUser } from "./accounts/cookies.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sendEmail } from "./mail/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUCCESS = "SUCCESS";

const app = fastify();

async function startApp() {
  try {
    app.register(fastifySensible);

    app.register(fastifyCors, {
      origin: [/fastify-auth\.dev$/],
      credentials: true,
    });

    app.register(fastifyCookie, {
      secret: process.env.COOKIE_SECRET,
    });

    app.register(fastifyStatic, {
      root: join(__dirname, "public"),
    });

    app.post("/register", {}, async (request, reply) => {
      try {
        const { email, password } = request.body;
        const userId = await registerUser({ email, password });

        if (userId) {
          await login({ email, password }, request, reply);
          reply.send({
            data: {
              status: SUCCESS,
              userId,
            },
          });
        }
      } catch (error) {
        console.error(error);
        reply.badRequest();
      }
    });

    app.post("/login", {}, async (request, reply) => {
      try {
        const { email, password } = request.body;

        const userId = await login({ email, password }, request, reply);
        reply.send({
          data: {
            status: SUCCESS,
            userId,
          },
        });
      } catch (error) {
        console.error(error);
        reply.unauthorized();
      }
    });

    app.post("/logout", {}, async (request, reply) => {
      try {
        await logout(request, reply);

        reply.send({
          data: {
            status: SUCCESS,
          },
        });
      } catch (error) {
        console.error(error);

        reply.internalServerError();
      }
    });

    app.get("/test", {}, async (request, reply) => {
      try {
        const user = await getUser(request, reply);

        if (user?._id) {
          sendEmail({
            to: "bar@example.com",
            subject: "Hello!",
            text: "Hello world!",
            html: "<b>Hello world!</b>",
          });

          reply.send({
            status: SUCCESS,
            data: user,
          });
        } else {
          reply.notFound();
        }
      } catch (error) {
        throw new Error(error);
      }
    });

    await app.listen(process.env.PORT);
    console.log(`Server: http://localhost:${process.env.PORT}`);
  } catch (error) {
    console.error(error);
  }
}

connectDatabase().then(() => {
  startApp();
});
