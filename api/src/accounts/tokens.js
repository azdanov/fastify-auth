import jwt from "jsonwebtoken";

const JWTSecret = process.env.JWT_SECRET;

export async function createTokens(sessionId, userId) {
  try {
    const refreshToken = jwt.sign({ sessionId }, JWTSecret);
    const accessToken = jwt.sign({ sessionId, userId }, JWTSecret);

    return { accessToken, refreshToken };
  } catch (error) {
    console.error(error);
  }
}
