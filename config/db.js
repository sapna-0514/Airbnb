const mongoose = require("mongoose");

async function connectDB() {
  mongoose.set("strictQuery", true);

  const uri = process.env.MONGO_URL;
  if (!uri) {
    throw new Error("MONGO_URL is not defined. Check your .env file.");
  }

  await mongoose.connect(uri);
  console.log(`MongoDB connected -> ${mongoose.connection.name}`);

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });

  return mongoose.connection;
}

module.exports = connectDB;
