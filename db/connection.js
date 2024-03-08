// db.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables from a .env file if present

// Retrieve MongoDB connection string from environment variables
const mongoURI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("CONNECTED");
  })
  .catch((ERROR) => {
    console.log({ ERROR: ERROR.message });
  });
