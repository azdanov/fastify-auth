import crypto from "node:crypto";

export async function createSession(userId, connection) {
  try {
    const sessionId = crypto.randomUUID();
    const { ip, userAgent } = connection;
    const { session } = await import("../models/session.js");

    await session.insertOne({
      sessionId,
      userId,
      valid: true,
      userAgent,
      ip,
      updatedAt: new Date(),
      createdAt: new Date(),
    });

    return sessionId;
  } catch (error) {
    console.error(error);
    throw new Error("Creating sessions failed");
  }
}
