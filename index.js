const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://namkeen-project.web.app",
      "https://namkeen-project.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(cookieParser());

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
    // await client.connect();

    const foodCollection = await client.db("naamkeenDB").collection("foods");
    const userCollection = await client.db("naamkeenDB").collection("users");
    const orderCollection = await client
      .db("naamkeenDB")
      .collection("orderItems");

    const verifyToken = (req, res, next) => {
      const { token } = req.cookies;
      if (!token) {
        return res.status(401).send({ message: "You are not authorized" });
      }

      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        function (err, decoded) {
          if (err) {
            return res.status(401).send({ message: "You are not authorized" });
          }
          req.user = decoded;
          next();
        }
      );
    };

    //jwt
    app.post("/api/v1/auth/access-token", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: 60 * 60,
      });
      console.log(token);
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    //get top 6 foods sorted by order amount
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

    //foods added by users
    app.get("/api/v1/foods/added-by", verifyToken, async (req, res) => {
      const queryEmail = req.query.email;
      const tokenEmail = req.user.email;
      if (queryEmail !== tokenEmail) {
        return res.status(403).send({ message: "forbidden" });
      }
      let query = {};
      if (queryEmail) {
        query.email = queryEmail;
      }
      const cursor = foodCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/api/v1/foods/added-by", async (req, res) => {
      const foodInfo = req.body;
      const result = await foodCollection.insertOne(foodInfo);
      console.log(result);
      res.send(result);
    });
    //pages
    app.get("/api/v1/foods/pages", async (req, res) => {
      //pagination
      const page = Number(req.query.page);
      const limit = Number(req.query.limit);
      const skip = (page - 1) * limit;
      const cursor = foodCollection.find().skip(skip).limit(limit);
      const total = await foodCollection.countDocuments();
      const result = await cursor.toArray();
      res.send({ total, result });
    });

    //user info in register page
    app.post("/api/v1/users", async (req, res) => {
      const userInfo = req.body;
      const result = await userCollection.insertOne(userInfo);
      console.log(result);
      res.send(result);
    });
    //single food by id
    app.get("/api/v1/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });
    //store users ordered food
    app.post("/api/v1/user/create-order", async (req, res) => {
      const orderItem = req.body;

      const result = await orderCollection.insertOne(orderItem);
      res.send(result);
    });
    //get user specific orders
    app.get("/api/v1/user/orders", verifyToken, async (req, res) => {
      const queryEmail = req.query.email;
      const tokenEmail = req.user.email;
      if (queryEmail !== tokenEmail) {
        return res.status(403).send({ message: "forbidden" });
      }
      let query = {};
      if (queryEmail) {
        query.email = queryEmail;
      }
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/api/v1/user/delete-order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
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
