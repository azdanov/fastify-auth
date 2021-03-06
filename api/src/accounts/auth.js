import { createSession } from "./session.js";
import { refreshTokens } from "./cookies.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const { compare } = bcrypt;

const { JWT_SECRET, ROOT_DOMAIN } = process.env;

export async function authorizeUser({ email, password }) {
  const { user } = await import("../models/user.js");
  const userData = await user.findOne({ "email.address": email });
  const isAuthorized = await compare(password, userData.password);

  return { isAuthorized, userId: userData._id };
}

export async function login({ email, password }, request, reply) {
  const { isAuthorized, userId } = await authorizeUser({ email, password });

  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  const sessionId = await createSession(userId, {
    ip: request.ip,
    userAgent: request.headers["user-agent"],
  });

  await refreshTokens(sessionId, userId, reply);

  return { isAuthorized, userId };
}

export async function logout(request, reply) {
  try {
    const { session } = await import("../models/session.js");

    if (request?.cookies?.refreshToken) {
      const { refreshToken } = request.cookies;
      const { sessionId } = jwt.verify(refreshToken, JWT_SECRET);

      await session.deleteOne({ sessionId });
    }

    reply
      .clearCookie("refreshToken", {
        domain: ROOT_DOMAIN,
      })
      .clearCookie("accessToken", {
        domain: ROOT_DOMAIN,
      });
  } catch (error) {
    console.error(error);
  }
}
