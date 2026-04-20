/**
 * Remove only documents inserted by syntheticDataImport.js (tracked in manifest).
 * Deletes in reverse dependency order. Does not restore overwritten documents —
 * import skips existing _ids, so your prior data at those keys is unchanged.
 *
 * Usage (from backend folder):
 *   node scripts/syntheticDataRollback.js
 *
 * Optional: MANIFEST_PATH env to point to a different manifest file.
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { REVERSE_ORDER } = require("./syntheticDataOrder");

const MANIFEST_PATH = process.env.SYNTHETIC_MANIFEST_PATH || path.join(__dirname, "synthetic_import_manifest.json");

/** Rehydrate _id values for deleteMany (ObjectId vs string vs number). */
function idFromManifest(raw) {
  if (raw === null || raw === undefined) return raw;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && /^[a-fA-F0-9]{24}$/.test(raw)) {
    return new mongoose.Types.ObjectId(raw);
  }
  return raw;
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("Missing MONGO_URI. Set it in backend/.env");
    process.exit(1);
  }
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("Manifest not found:", MANIFEST_PATH);
    console.error("Nothing to roll back (run syntheticDataImport.js first).");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  let deleted = 0;
  const collectionsTouched = [];

  for (const collName of REVERSE_ORDER) {
    if (collName === "meta" || !manifest[collName]) continue;
    const ids = manifest[collName];
    if (!Array.isArray(ids) || ids.length === 0) continue;

    const collection = db.collection(collName);
    const objectIds = ids.map(idFromManifest);
    const result = await collection.deleteMany({ _id: { $in: objectIds } });
    deleted += result.deletedCount || 0;
    collectionsTouched.push(`${collName}: ${result.deletedCount || 0}`);
  }

  console.log("— Synthetic rollback finished —");
  console.log("Total documents deleted:", deleted);
  collectionsTouched.forEach((line) => console.log(" ", line));
  console.log("You may delete the manifest file if you are done:", MANIFEST_PATH);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
