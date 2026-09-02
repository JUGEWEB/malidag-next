const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://Cluster203:GAmA1234@cluster203.5lsmq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster203";

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10000,
});

async function main() {
  try {
    console.log("Connecting to MongoDB...");

    await client.connect();

    console.log("✅ MongoDB connected successfully");

    const db = client.db("malidag");
    const productsCol = db.collection("products");

    const count = await productsCol.countDocuments();

    console.log(`✅ products count: ${count}`);

    const sample = await productsCol.findOne(
      {},
      {
        projection: {
          itemId: 1,
          id: 1,
          category: 1,
          "item.name": 1,
          "details.country": 1,
        },
      }
    );

    console.log("✅ sample product:");
    console.log(JSON.stringify(sample, null, 2));
  } catch (error) {
    console.error("❌ MongoDB test failed:");
    console.error(error);
  } finally {
    await client.close().catch(() => {});
    console.log("Connection closed.");
  }
}

main();