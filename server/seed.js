/* Development seed data. Fake phone numbers only. */
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const { connectDB } = require("./config/db");
const Chunk = require("./models/Chunk");
const Delivery = require("./models/Delivery");
const { fingerprint } = require("./utils/normalize");

const STATUSES = ["Delivered", "Read", "Sent", "Replied", "Pending", "Failed"];
const WEIGHTS = [45, 15, 8, 3, 5, 24];

const CHUNKS = [
  { chunkName: "Startup Mumbai - Chunk 01", broadcastName: "10-Startup Mumbai", templateName: "business_premium", rows: 131 },
  { chunkName: "Startup Delhi - Chunk 02", broadcastName: "11-Startup Delhi", templateName: "business_premium", rows: 334 },
  { chunkName: "TSOW Kolkata-1 - Chunk 03", broadcastName: "TSOW Kolkata", templateName: "tsow_invite_v2", rows: 193 },
  { chunkName: "TSOW Kolkata-2 - Chunk 04", broadcastName: "TSOW Kolkata", templateName: "tsow_invite_v2", rows: 199 },
  { chunkName: "TSOW Pune-1 - Chunk 05", broadcastName: "TSOW Pune", templateName: "tsow_invite_v2", rows: 214 },
];

const ERRORS = [
  "This message was not delivered to maintain healthy ecosystem engagement.",
  "Recipient phone number is not a valid WhatsApp user.",
  "Message failed to send because of an unknown error.",
];

function pickStatus() {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < STATUSES.length; i += 1) {
    r -= WEIGHTS[i];
    if (r <= 0) return STATUSES[i];
  }
  return "Delivered";
}

function fakePhone(i) {
  return String(9000000000 + ((i * 7919) % 999999999));
}

async function run() {
  await connectDB();
  await Promise.all([Chunk.deleteMany({}), Delivery.deleteMany({})]);

  let index = 0;
  for (let c = 0; c < CHUNKS.length; c += 1) {
    const def = CHUNKS[c];
    const code = `SEED-20260812-${String(c + 1).padStart(3, "0")}`;
    const chunk = await Chunk.create({
      chunkCode: code,
      chunkName: def.chunkName,
      originalFileName: `${def.chunkName.replace(/\s+/g, "_").toLowerCase()}.csv`,
      fileType: "csv",
      fileHash: `seed-${code}`,
      broadcastName: def.broadcastName,
      templateName: def.templateName,
      totalRows: def.rows,
      importedRows: def.rows,
      status: "Completed",
      uploadDate: new Date(Date.now() - (CHUNKS.length - c) * 86400000),
    });

    const records = [];
    for (let i = 0; i < def.rows; i += 1) {
      index += 1;
      const status = pickStatus();
      const dt = new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000);
      const phone = fakePhone(index);
      records.push({
        chunkId: chunk._id,
        chunkName: chunk.chunkName,
        chunkCode: chunk.chunkCode,
        broadcastName: def.broadcastName,
        templateName: def.templateName,
        sentTo: `+91${phone}`,
        phoneNumber: phone,
        originalPhoneNumber: `+91${phone}`,
        countryCode: "91",
        category: "NA",
        error: status === "Failed" ? ERRORS[index % ERRORS.length] : "",
        status,
        deliveryDate: dt.toISOString().slice(0, 10),
        deliveryTime: dt.toTimeString().slice(0, 8),
        deliveryDateTime: dt,
        rowFingerprint: fingerprint([code, phone, def.broadcastName, def.templateName, dt.toISOString(), status]),
        originalRow: {
          "Template Name": def.templateName,
          "Sent to": `+91${phone}`,
          Category: "NA",
          Error: status === "Failed" ? ERRORS[index % ERRORS.length] : "NA",
          Status: status,
          Delivery: dt.toISOString(),
        },
      });
    }
    await Delivery.insertMany(records);
    console.log(`[seed] ${def.chunkName}: ${records.length} records`);
  }

  await mongoose.connection.close();
  console.log("[seed] Done.");
}

run().catch((err) => {
  console.error("[seed] Failed:", err.message);
  process.exit(1);
});
