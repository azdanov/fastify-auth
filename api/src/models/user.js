import { client } from "../database.js";

export const user = client.db("test").collection("user");

user.createIndex({ "email.address": 1 });
