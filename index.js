const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(express.json());
app.use(cors());

app.get("/", async (req, res) => {
  res.send("Welcome to Namkeen server");
});

app.listen(port, () => {
  console.log(`namkeen server running on port ${port}`);
});
