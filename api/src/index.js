import "./environment.js";
import { fastify } from "fastify";
import fastifyCookie from "fastify-cookie";
import fastifySensible from "fastify-sensible";
import fastifyCors from "fastify-cors";
import { connectDatabase } from "./database.js";
import { registerUser } from "./accounts/register.js";
import { login, logout } from "./accounts/auth.js";
import { getUser } from "./accounts/cookies.js";
import { sendEmail } from "./mail/index.js";
import { createVerifyEmailLink } from "./accounts/verify.js";

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

    app.post("/register", {}, async (request, reply) => {
      try {
        const { email, password } = request.body;
        const userId = await registerUser({ email, password });

        if (userId) {
          const verifyEmailLink = await createVerifyEmailLink(email);

          sendEmail({
            to: email,
            subject: "Verify your account",
            text: `To verify visit this link: ${verifyEmailLink}`,
            html: `<p>To verify visit <a href="${verifyEmailLink}">this link</a></p>`,
          });

          await login({ email, password }, request, reply);
          reply.send({
            data: {
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

        reply.send();
      } catch (error) {
        console.error(error);

        reply.internalServerError();
      }
    });

    app.get("/test", {}, async (request, reply) => {
      try {
        const user = await getUser(request, reply);

        if (user?._id) {
          reply.send({
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
    console.log(`Server API: http://localhost:${process.env.PORT}`);
  } catch (error) {
    console.error(error);
  }
}

connectDatabase().then(() => {
  startApp();
});
