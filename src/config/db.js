const mongoose = require('mongoose');
const dns = require('dns');

// Windows default DNS resolver sometimes doesn't support SRV records required
// by MongoDB Atlas. Force Google/Cloudflare DNS for reliable SRV lookups.
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

let cached = global.__mongooseCache;
if (!cached) {
  cached = global.__mongooseCache = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

module.exports = connectDB;
