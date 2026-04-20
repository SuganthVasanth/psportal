/**
 * Export every collection in the MongoDB database (from MONGO_URI) to one JSON file.
 * ObjectIds → strings, Dates → ISO strings, so the file is plain JSON.
 *
 * Usage (from backend folder):
 *   npm run db:export-json
 *   node scripts/exportMongoDbToJson.js
 *   node scripts/exportMongoDbToJson.js --out ../my-backup.json
 *
 * Env:
 *   EXPORT_OUT  — optional output file path (overrides default)
 *
 * Requires MONGO_URI in backend/.env (same database the app uses, e.g. psportal).
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

/** Convert BSON / special values to JSON-serializable data. */
function toPlainJson(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "string") {
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toPlainJson);
  if (Buffer.isBuffer(value)) return value.toString("base64");

  if (typeof value === "object") {
    const ctor = value.constructor && value.constructor.name;
    if (ctor === "ObjectId" || ctor === "ObjectID") return value.toString();
    if (ctor === "Decimal128") return value.toString();
    if (ctor === "Long" && typeof value.toString === "function") return value.toString();
    if (ctor === "Int32" && typeof value.valueOf === "function") return value.valueOf();

    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = toPlainJson(v);
    }
    return out;
  }

  return value;
}

function parseOutArg() {
  const idx = process.argv.indexOf("--out");
  if (idx >= 0 && process.argv[idx + 1]) return path.resolve(process.argv[idx + 1]);
  return null;
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("Missing MONGO_URI. Set it in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const dbName = db.databaseName;

  const collections = await db.listCollections().toArray();
  const names = collections
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system."))
    .sort();

  const payload = {
    _meta: {
      database: dbName,
      exportedAt: new Date().toISOString(),
      collectionCount: names.length,
      collections: names,
    },
  };

  for (const name of names) {
    const docs = await db.collection(name).find({}).toArray();
    payload[name] = docs.map(toPlainJson);
    process.stdout.write(`Exported ${name}: ${docs.length} documents\r`);
  }
  console.log("");

  const outFromEnv = process.env.EXPORT_OUT && path.resolve(process.env.EXPORT_OUT);
  const outFromArg = parseOutArg();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const defaultOut = path.join(__dirname, "..", "..", `mongodb_export_${dbName}_${stamp}.json`);
  const outPath = outFromArg || outFromEnv || defaultOut;

  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");

  console.log("Database:", dbName);
  console.log("Collections:", names.length);
  console.log("Written:", outPath);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
