/**
 * Import documents from ../../synthetic_data.json into MongoDB.
 *
 * - Inserts in dependency order (see syntheticDataOrder.js).
 * - Skips documents whose _id already exists (does not overwrite).
 * - Writes backend/scripts/synthetic_import_manifest.json with only successfully inserted _ids (for rollback).
 *
 * Usage (from backend folder):
 *   node scripts/syntheticDataImport.js
 *
 * Requires MONGO_URI in .env (same as the app).
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { INSERT_ORDER } = require("./syntheticDataOrder");
const { prepareDocument } = require("./syntheticDataTransforms");

const DATA_PATH = path.join(__dirname, "..", "..", "synthetic_data.json");
const MANIFEST_PATH = path.join(__dirname, "synthetic_import_manifest.json");

/** Store _id in manifest in a JSON-safe form (ObjectId → string). */
function manifestId(id) {
  if (id == null) return null;
  if (typeof id === "object" && typeof id.toString === "function") return id.toString();
  return id;
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("Missing MONGO_URI. Set it in backend/.env");
    process.exit(1);
  }
  if (!fs.existsSync(DATA_PATH)) {
    console.error("Synthetic data file not found:", DATA_PATH);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  let previous = {};
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      previous = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    } catch (_) {
      previous = {};
    }
  }

  /** @type {Record<string, unknown>} */
  const manifest = {
    meta: {
      ...(previous.meta && typeof previous.meta === "object" ? previous.meta : {}),
      importedAt: new Date().toISOString(),
      sourceFile: path.basename(DATA_PATH),
    },
  };

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const collName of INSERT_ORDER) {
    const docs = raw[collName];
    if (!Array.isArray(docs) || docs.length === 0) {
      continue;
    }

    const ids = [];
    const collection = db.collection(collName);

    for (const doc of docs) {
      let prepared;
      try {
        prepared = prepareDocument(collName, doc);
      } catch (e) {
        console.error(`[${collName}] prepare failed for _id=${doc?._id}:`, e.message);
        errors += 1;
        continue;
      }

      try {
        const result = await collection.insertOne(prepared);
        const idVal = prepared._id !== undefined && prepared._id !== null ? prepared._id : result.insertedId;
        ids.push(manifestId(idVal));
        inserted += 1;
      } catch (e) {
        if (e && (e.code === 11000 || String(e.message).includes("E11000"))) {
          skipped += 1;
        } else {
          console.error(`[${collName}] insert failed _id=${prepared?._id}:`, e.message);
          errors += 1;
        }
      }
    }

    if (ids.length) {
      const prior = Array.isArray(previous[collName]) ? previous[collName] : [];
      const merged = [...new Set([...prior, ...ids])];
      manifest[collName] = merged;
    } else if (Array.isArray(previous[collName]) && previous[collName].length) {
      manifest[collName] = previous[collName];
    }
  }

  for (const key of Object.keys(previous)) {
    if (key === "meta" || manifest[key] !== undefined) continue;
    manifest[key] = previous[key];
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");

  console.log("— Synthetic import finished —");
  console.log("Inserted (new documents):", inserted);
  console.log("Skipped (duplicate _id):", skipped);
  console.log("Errors:", errors);
  console.log("Manifest written:", MANIFEST_PATH);
  console.log("Rollback: node scripts/syntheticDataRollback.js");

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
