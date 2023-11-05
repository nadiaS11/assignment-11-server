const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(express.json());
app.use(cors());

//mongodb connection

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ly9jdk7.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const foodCollection = await client.db("naamkeenDB").collection("foods");

    //get top 6 foods
    app.get("/api/v1/foods", async (req, res) => {
      let query = {};
      let sortObj = {};

      const category = req.query.foodcategory;
      const sortField = req.query.sortField;
      const sortOrder = req.query.sortOrder;
      if (category) {
        query.foodcategory = category;
      }
      if (sortField && sortOrder) {
        sortObj[sortField] = sortOrder;
      }

      const cursor = foodCollection.find(query).sort(sortObj);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Welcome to Naamkeen server");
});

app.listen(port, () => {
  console.log(`namkeen server running on port ${port}`);
});
