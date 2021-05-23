import "./environment.js";
import { fastify } from "fastify";
import fastifyCookie from "fastify-cookie";
import fastifySensible from "fastify-sensible";
import fastifyCors from "fastify-cors";
import { connectDatabase } from "./database.js";
import { registerUser, changePassword } from "./accounts/register.js";
import { authorizeUser, login, logout } from "./accounts/auth.js";
import { getUser } from "./accounts/cookies.js";
import { sendEmail } from "./mail/index.js";
import { createResetLink, validateResetEmail } from "./accounts/reset.js";
import {
  createVerifyEmailLink,
  validateVerifyEmail,
} from "./accounts/verify.js";

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

    app.post("/api/register", {}, async (request, reply) => {
      try {
        const { email, password } = request.body;
        const userId = await registerUser({ email, password });

        if (userId) {
          const verifyEmailLink = await createVerifyEmailLink(email);

          sendEmail({
            to: email,
            subject: "Verify your account",
            text: `Verify email: ${verifyEmailLink}`,
            html: `<a href="${verifyEmailLink}">Verify email</a>`,
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

    app.post("/api/verify", {}, async (request, reply) => {
      try {
        const { email, token } = request.body;

        const isValid = await validateVerifyEmail(email, token);
        if (isValid) {
          return reply.code(200).send();
        }
        return reply.unauthorized();
      } catch (error) {
        console.error(error);
        return reply.unauthorized();
      }
    });

    app.post("/api/change-password", {}, async (request, reply) => {
      try {
        const { oldPassword, newPassword } = request.body;
        const user = await getUser(request, reply);

        if (user?.email?.address) {
          const { isAuthorized, userId } = await authorizeUser({
            email: user.email.address,
            password: oldPassword,
          });

          if (isAuthorized) {
            await changePassword(userId, newPassword);
            return reply.code(200).send();
          }
        }
        return reply.unauthorized();
      } catch (error) {
        console.error(error);
        return reply.unauthorized();
      }
    });

    app.post("/api/forgot-password", {}, async (request, reply) => {
      try {
        const { email } = request.body;
        const link = await createResetLink(email);

        if (link) {
          await sendEmail({
            to: email,
            subject: "Reset your password",
            text: `Reset password: ${link}`,
            html: `<a href="${link}">Reset password</a>`,
          });
        }

        return reply.code(200).send();
      } catch (error) {
        console.error(error);
        return reply.unauthorized();
      }
    });

    app.post("/api/reset-password", {}, async (request, reply) => {
      try {
        const { email, password, token, time } = request.body;
        const isValid = await validateResetEmail(token, email, time);
        if (!isValid) {
          return reply.unauthorized();
        }

        const { user } = await import("./models/user.js");
        const foundUser = await user.findOne({ "email.address": email });

        if (foundUser._id) {
          await changePassword(foundUser._id, password);
          return reply.code(200).send();
        }
      } catch (error) {
        console.error(error);
        return reply.unauthorized();
      }
    });

    app.post("/api/login", {}, async (request, reply) => {
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

    app.post("/api/logout", {}, async (request, reply) => {
      try {
        await logout(request, reply);

        reply.send();
      } catch (error) {
        console.error(error);
        reply.internalServerError();
      }
    });

    app.get("/api/test", {}, async (request, reply) => {
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
