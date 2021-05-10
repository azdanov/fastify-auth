import { createSession } from "./session.js";
import { refreshTokens } from "./cookies.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const { compare } = bcrypt;

const JWTSecret = process.env.JWT_SECRET;

export async function login({ email, password }, request, reply) {
  const { user } = await import("../models/user.js");
  const userData = await user.findOne({ "email.address": email });
  const isAuthorized = await compare(password, userData.password);

  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  const userId = userData._id;
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
      const { sessionId } = jwt.verify(refreshToken, JWTSecret);

      await session.deleteOne({ sessionId });
    }

    reply.clearCookie("refreshToken").clearCookie("accessToken");
  } catch (error) {
    console.error(error);
  }
}
