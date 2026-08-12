const mongoose = require("mongoose");

let connected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    dbName: "broadcastiq",
    serverSelectionTimeoutMS: 15000,
  });

  connected = true;

  mongoose.connection.on("disconnected", () => {
    connected = false;
    console.error("[db] MongoDB disconnected");
  });
  mongoose.connection.on("connected", () => {
    connected = true;
  });

  console.log("[db] MongoDB connected -> database: monitor");
  return mongoose.connection;
}

function isConnected() {
  return connected && mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isConnected };
