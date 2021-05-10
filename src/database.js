import mongo from "mongodb";

const { MongoClient } = mongo;

const { MONGO_USERNAME, MONGO_PASSWORD, MONGO_HOSTNAME, MONGO_PORT, MONGO_DB } =
  process.env;

const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;

export const client = new MongoClient(url, { useNewUrlParser: true });

export async function connectDatabase() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });

    console.log("MongoDB is connected");
  } catch (error) {
    console.error(error);
    await client.close();
  }
}
