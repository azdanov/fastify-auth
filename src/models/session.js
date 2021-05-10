import { client } from "../database.js";

export const session = client.db("test").collection("session");

session.createIndex({ sessionId: 1 });
