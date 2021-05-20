import mongo from "mongodb";
import jwt from "jsonwebtoken";
import { createTokens } from "./tokens.js";

const { ObjectId } = mongo;

const { JWT_SECRET, ROOT_DOMAIN, REFRESH_EXPIRES_DAYS } = process.env;

export async function getUser(request, reply) {
  try {
    const { user } = await import("../models/user.js");
    const { session } = await import("../models/session.js");

    if (request?.cookies?.accessToken) {
      const { accessToken } = request.cookies;
      console.log({ accessToken, JWT_SECRET });
      const decodedAccessToken = jwt.verify(accessToken, JWT_SECRET);

      return user.findOne({
        _id: ObjectId(decodedAccessToken?.userId),
      });
    } else if (request?.cookies?.refreshToken) {
      const { refreshToken } = request.cookies;
      const { sessionId } = jwt.verify(refreshToken, JWT_SECRET);
      const currentSession = await session.findOne({ sessionId });

      if (currentSession.valid) {
        const currentUser = await user.findOne({
          _id: ObjectId(currentSession.userId),
        });
        await refreshTokens(sessionId, currentUser._id, reply);

        return currentUser;
      }
    }
  } catch (error) {
    console.error(error);
  }
}

export async function refreshTokens(sessionId, userId, reply) {
  try {
    const { accessToken, refreshToken } = await createTokens(sessionId, userId);
    const now = new Date();
    const expires = now.setDate(now.getDate() + REFRESH_EXPIRES_DAYS);

    reply
      .setCookie("refreshToken", refreshToken, {
        path: "/",
        domain: ROOT_DOMAIN,
        httpOnly: true,
        secure: true,
        expires,
      })
      .setCookie("accessToken", accessToken, {
        path: "/",
        domain: ROOT_DOMAIN,
        httpOnly: true,
        secure: true,
      });
  } catch (error) {
    console.error(error);
  }
}
