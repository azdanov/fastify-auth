import mongo from "mongodb";
import jwt from "jsonwebtoken";
import { createTokens } from "./tokens.js";

const { ObjectId } = mongo;

const JWTSecret = process.env.JWT_SECRET;

export async function getUser(request, reply) {
  try {
    const { user } = await import("../models/user.js");
    const { session } = await import("../models/session.js");

    if (request?.cookies?.accessToken) {
      const { accessToken } = request.cookies;
      const decodedAccessToken = jwt.verify(accessToken, JWTSecret);

      const currentUser = user.findOne({
        _id: ObjectId(decodedAccessToken?.userId),
      });

      return currentUser;
    } else if (request?.cookies?.refreshToken) {
      const { refreshToken } = request.cookies;
      const { sessionId } = jwt.verify(refreshToken, JWTSecret);
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
    const expires = now.setDate(
      now.getDate() + process.env.REFRESH_EXPIRES_DAYS
    );

    reply
      .setCookie("refreshToken", refreshToken, {
        path: "/",
        domain: "localhost",
        httpOnly: true,
        expires,
      })
      .setCookie("accessToken", accessToken, {
        path: "/",
        domain: "localhost",
        httpOnly: true,
      });
  } catch (error) {
    console.error(error);
  }
}
