import mongoose from "mongoose";
import dotenv from "dotenv";
import { EventEmitter } from "events";

dotenv.config();

// Optional: increase Node's default for listeners to avoid warnings during heavy reconnect churn
EventEmitter.defaultMaxListeners = 20;
mongoose.connection.setMaxListeners(20);

// A flag to ensure we attach listeners only once
let listenersAttached = false;

function attachConnectionListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.once("connected", () => {
    console.log("✅ MongoDB Connected:", mongoose.connection.host);
  });

  mongoose.connection.on("error", (err) => {
    console.error(
      "❌ MongoDB connection error:",
      err && err.message ? err.message : err
    );
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected — will retry connecting in 5s");
    // don't call connectDB() here directly if you're already attempting/retrying;
    // connectDB() will also attempt reconnects on failures. But this keeps it simple:
    setTimeout(() => {
      // try to reconnect only if not already connected
      if (mongoose.connection.readyState !== 1) {
        connectDB().catch(() => {}); // swallow errors here
      }
    }, 5000);
  });
}

async function connectDB() {
  // attach listeners only once
  attachConnectionListeners();

  // if already connected, do nothing
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI not set in environment");
  }

  try {
    // try connecting
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    // the 'connected' event logs the success
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err.message);
    // retry after a delay (without exiting the process)
    setTimeout(() => {
      connectDB().catch(() => {});
    }, 5000);
  }
}

export default connectDB;
