const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://gamanshop33:YOUR_NEW_PASSWORD@cluster0.mu90mbv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected successfully");
    const db = client.db("malidag");
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
  } catch (err) {
    console.error("Mongo connection error:", err);
  } finally {
    await client.close();
  }
}

main();